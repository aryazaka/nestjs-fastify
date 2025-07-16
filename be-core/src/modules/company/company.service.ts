import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { AppLogger } from '../../infra/logger/logger.service';
import { RedisService } from '../../infra/redis/redis.service';
import { CreateCompanyDto } from './dto/create.company.dto';
import { UpdateCompanyDto } from './dto/update.company.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class CompanyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
    private readonly redis: RedisService,
  ) {
    this.logger.info(CompanyService.name);
  }

  async findOne(id: number) {
    const cacheKey = `company:${id}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit: ${cacheKey}`);
      return JSON.parse(cached);
    }
    this.logger.debug(`Cache miss: ${cacheKey}, fetching from DB`);
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        users: {
          where: {
            role: Role.ADMIN,
          },
        },
      },
    });
    if (!company) throw new NotFoundException('Company not found');
    await this.redis.set(cacheKey, JSON.stringify(company), 60 * 60);
    return company;
  }

  async findAll() {
    const cacheKey = 'company:all';
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit: ${cacheKey}`);
      return JSON.parse(cached);
    }
    this.logger.debug(`Cache miss: ${cacheKey}, fetching from DB`);
    const companies = await this.prisma.company.findMany({
      include: {
        users: {
          where: {
            role: Role.ADMIN,
          },
        },
      },
    });
    await this.redis.set(cacheKey, JSON.stringify(companies), 60 * 60);
    return companies;
  }

  async create(dto: CreateCompanyDto) {
    const { name, emailAdmin, officePhone, address, password } = dto;
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await this.prisma.$transaction(async (prisma) => {
      const company = await prisma.company.create({
        data: {
          name,
          emailAdmin,
          officePhone,
          address,
        },
      });

      await prisma.user.create({
        data: {
          name: `Admin ${name}`,
          email: emailAdmin,
          address,
          contactNumber: officePhone,
          passwordHash: hashedPassword,
          role: Role.ADMIN,
          companyId: company.id,
        },
      });

      return company;
    });

    await this.redis.del('company:all');
    return {
      data: result,
      success: true,
      message: 'Company and Admin user created successfully!',
    };
  }

  async update(id: number, dto: UpdateCompanyDto) {
    const { password, ...companyData } = dto;

    const result = await this.prisma.$transaction(async (prisma) => {
      const updatedCompany = await prisma.company.update({
        where: { id },
        data: companyData,
      });

      const userData: {
        email?: string;
        address?: string;
        contactNumber?: string;
        passwordHash?: string;
        name?: string;
      } = {};

      if (companyData.emailAdmin) {
        userData.email = companyData.emailAdmin;
      }
      if (companyData.address) {
        userData.address = companyData.address;
      }
      if (companyData.officePhone) {
        userData.contactNumber = companyData.officePhone;
      }
      if (companyData.name) {
        userData.name = `Admin ${companyData.name}`;
      }

      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        userData.passwordHash = hashedPassword;
      }

      if (Object.keys(userData).length > 0) {
        await prisma.user.updateMany({
          where: {
            companyId: id,
            role: Role.ADMIN,
          },
          data: userData,
        });
      }

      return updatedCompany;
    });

    await this.redis.del('company:all');
    await this.redis.del(`company:${id}`);

    return {
      data: result,
      success: true,
      message: 'Company and Admin user updated successfully!',
    };
  }

  async remove(id: number) {
    await this.prisma.$transaction(async (prisma) => {
      await prisma.user.deleteMany({ where: { companyId: id } });
      await prisma.company.delete({ where: { id } });
    });

    await this.redis.del('company:all');
    await this.redis.del(`company:${id}`);

    return {
      success: true,
      message: 'Company and associated users deleted successfully!',
    };
  }
}
