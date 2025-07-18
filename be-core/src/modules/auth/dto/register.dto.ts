import { IsEmail, IsNotEmpty, IsNumber, IsString, MinLength, IsIn } from 'class-validator';
import { Role } from '@prisma/client';

type RegisterableRole = 'HR' | 'FINANCE' | 'EMPLOYEE';

export class RegisterDto {
  @IsNotEmpty()
  @IsNumber()
  companyId: number;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsIn([Role.FINANCE, Role.HR, Role.EMPLOYEE])
  role: RegisterableRole;

  @IsNotEmpty()
  @IsString()
  contactNumber: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;
}