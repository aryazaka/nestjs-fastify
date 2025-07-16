import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { CreateCompanyUserDto } from './dto/create-company-user.dto';
import { UpdateCompanyUserDto } from './dto/update-company-user.dto';
import { RedisService } from 'src/infra/redis/redis.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class CompanyUserService {
  private readonly logger = new Logger(CompanyUserService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async create(companyId: number, createCompanyUserDto: CreateCompanyUserDto) {
    this.logger.log(`Creating user for companyId: ${companyId}`);
    const { password, email, role, ...userData } = createCompanyUserDto;

    if (role === Role.ADMIN) {
      throw new BadRequestException('Cannot create a user with the ADMIN role.');
    }

    // Check if company exists
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      // This case should ideally not happen if companyId is from a trusted source (e.g., JWT)
      throw new BadRequestException(`Company with ID ${companyId} not found.`);
    }

    // Check if email is already taken in the company
    const existingUser = await this.prisma.user.findFirst({
      where: { email, companyId },
    });
    if (existingUser) {
      throw new ConflictException(
        `User with email ${email} already exists in this company.`,
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            companyId,
            email,
            passwordHash,
            role,
            name: userData.name,
            address: userData.address,
            contactNumber: userData.contactNumber,
          },
        });

        if (role === Role.EMPLOYEE) {
          // Check if NIK is unique for the company
          const existingEmployee = await tx.employee.findFirst({
            where: { nik: userData.nik, user: { companyId } },
          });
          if (existingEmployee) {
            throw new ConflictException(
              `Employee with NIK ${userData.nik} already exists.`,
            );
          }

          await tx.employee.create({
            data: {
              userId: newUser.id,
              nik: userData.nik,
              status: userData.status,
              position: userData.position,
              joinDate: new Date(userData.joinDate),
              noRekening: userData.noRekening,
            },
          });
        }
        // Refetch user with employee data to return complete object
        return tx.user.findUnique({
          where: { id: newUser.id },
          include: { employee: true },
        });
      });

      // Invalidate cache
      await this.redis.del(`company:${companyId}:users`);
      this.logger.log(
        `Successfully created user and invalidated cache for company ${companyId}`,
      );
      return result;
    } catch (error) {
      this.logger.error('Error creating company user:', error);
      // Re-throw known exceptions to be handled by filters
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      // Throw a generic error for unknown issues
      throw new BadRequestException(
        'An error occurred while creating the user.',
      );
    }
  }

  async findAll(companyId: number) {
    const cacheKey = `company:${companyId}:users`;
    const cachedUsers = await this.redis.get(cacheKey);
    if (cachedUsers) {
      this.logger.log(`Cache hit for users in companyId: ${companyId}`);
      return JSON.parse(cachedUsers);
    }

    this.logger.log(
      `Cache miss. Fetching users from DB for companyId: ${companyId}`,
    );
    const users = await this.prisma.user.findMany({
      where: { companyId },
      include: {
        employee: true,
      },
    });

    await this.redis.set(cacheKey, JSON.stringify(users), 3600);
    return users;
  }

  async findOne(companyId: number, id: number) {
    const cacheKey = `company:${companyId}:user:${id}`;
    const cachedUser = await this.redis.get(cacheKey);
    if (cachedUser) {
      this.logger.log(`Cache hit for user ${id} in companyId: ${companyId}`);
      return JSON.parse(cachedUser);
    }

    this.logger.log(
      `Cache miss. Fetching user ${id} from DB for companyId: ${companyId}`,
    );
    const user = await this.prisma.user.findFirst({
      where: { id, companyId },
      include: {
        employee: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    await this.redis.set(cacheKey, JSON.stringify(user), 3600);
    return user;
  }

  async update(
    companyId: number,
    id: number,
    updateCompanyUserDto: UpdateCompanyUserDto,
  ) {
    this.logger.log(`Updating user ${id} for companyId: ${companyId}`);
    const { password, ...updateData } = updateCompanyUserDto;

    const user = await this.prisma.user.findFirst({
      where: { id, companyId },
    });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${id} not found in company ${companyId}.`,
      );
    }

    const dataToUpdate: any = { ...updateData };

    if (password) {
      dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: dataToUpdate,
        include: { employee: true },
      });

      // Invalidate caches
      await this.redis.del(`company:${companyId}:users`);
      await this.redis.del(`company:${companyId}:user:${id}`);
      this.logger.log(`Successfully updated user ${id} and invalidated caches.`);

      return updatedUser;
    } catch (error) {
      this.logger.error(`Error updating user ${id}:`, error);
      throw new BadRequestException('An error occurred while updating the user.');
    }
  }

  async remove(adminId: number, companyId: number, targetUserId: number) {
    this.logger.log(
      `Admin ${adminId} attempting to delete user ${targetUserId} from company ${companyId}`,
    );

    // Rule 1: Admin cannot delete their own account
    if (adminId === targetUserId) {
      throw new BadRequestException('Admins cannot delete their own account.');
    }

    const userToDelete = await this.prisma.user.findFirst({
      where: { id: targetUserId, companyId },
      include: { employee: true },
    });

    if (!userToDelete) {
      throw new NotFoundException(
        `User with ID ${targetUserId} not found in company ${companyId}.`,
      );
    }

    // Rule 2: Admin can only delete specific roles
    const allowedRolesToDelete: Role[] = [Role.EMPLOYEE, Role.HR, Role.FINANCE];
    if (!allowedRolesToDelete.includes(userToDelete.role)) {
      throw new ForbiddenException(
        `Admins cannot delete users with the role: ${userToDelete.role}.`,
      );
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        if (userToDelete.employee) {
          await tx.employee.delete({ where: { userId: targetUserId } });
        }
        await tx.user.delete({ where: { id: targetUserId } });
      });

      // Invalidate caches
      await this.redis.del(`company:${companyId}:users`);
      await this.redis.del(`company:${companyId}:user:${targetUserId}`);
      this.logger.log(`Successfully deleted user ${targetUserId} and invalidated caches.`);

      return { message: `User ${targetUserId} deleted successfully.` };
    } catch (error) {
      this.logger.error(`Error deleting user ${targetUserId}:`, error);
      if (error.code === 'P2003') {
        throw new ConflictException(
          'Cannot delete this user. They have related records (e.g., payroll) that must be removed first.',
        );
      }
      throw new BadRequestException('An error occurred while deleting the user.');
    }
  }
}
