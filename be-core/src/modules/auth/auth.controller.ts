
import { Controller, Request, Post, UseGuards, Get, Body, SetMetadata } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '@prisma/client';
import { RegisterAdminDto } from './dto/register-admin.dto';

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  // @Post('register-admin')
  // @Roles(Role.SUPERADMIN)
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // async registerAdmin(@Body() registerAdminDto: RegisterAdminDto) {
  //   return this.authService.registerAdmin(registerAdminDto);
  // }

  // @Post('register')
  // @Roles(Role.ADMIN)
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // async register(@Body() registerDto: RegisterDto) {
  //   return this.authService.register(registerDto);
  // }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req, @Body() loginDto: LoginDto) {
    return this.authService.login(req.user);
  }
}
