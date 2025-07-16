
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { RegisterAdminDto } from './dto/register-admin.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role, companyId: user.companyId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  // async registerAdmin(registerAdminDto: RegisterAdminDto) {
  //   const hashedPassword = await bcrypt.hash(registerAdminDto.password, 10);

  //   const existingUser = await this.prisma.user.findUnique({
  //     where: { email: registerAdminDto.email },
  //   });

  //   if (existingUser) {
  //     throw new BadRequestException('Email already exists');
  //   }

  //   const user = await this.prisma.user.create({
  //     data: {
  //       name: registerAdminDto.name,
  //       email: registerAdminDto.email,
  //       passwordHash: hashedPassword,
  //       address: registerAdminDto.address,
  //       contactNumber: registerAdminDto.contactNumber,
  //       companyId: registerAdminDto.companyId,
  //       role: Role.ADMIN,
  //     },
  //   });

  //   // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //   const { passwordHash, ...result } = user;
  //   return result;
  // }

  // async register(registerDto: RegisterDto) {
  //   const hashedPassword = await bcrypt.hash(registerDto.password, 10);

  //   const existingUser = await this.prisma.user.findUnique({
  //     where: { email: registerDto.email },
  //   });

  //   if (existingUser) {
  //     throw new BadRequestException('Email already exists');
  //   }

  //   if (![Role.FINANCE, Role.HR, Role.EMPLOYEE].includes(registerDto.role)) {
  //     throw new BadRequestException('Invalid role');
  //   }

  //   const user = await this.prisma.user.create({
  //     data: {
  //       name: registerDto.name,
  //       email: registerDto.email,
  //       passwordHash: hashedPassword,
  //       address: registerDto.address,
  //       contactNumber: registerDto.contactNumber,
  //       companyId: registerDto.companyId,
  //       role: registerDto.role,
  //     },
  //   });

  //   // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //   const { passwordHash, ...result } = user;
  //   return result;
  // }
}