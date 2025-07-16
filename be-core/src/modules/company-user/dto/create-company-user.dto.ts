import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Role, EmploymentStatus } from '@prisma/client';

export class CreateCompanyUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;

  @IsString()
  @IsNotEmpty()
  contactNumber: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  // Employee specific fields - required only if role is EMPLOYEE
  @ValidateIf((o) => o.role === Role.EMPLOYEE)
  @IsString()
  @IsNotEmpty()
  nik: string;

  @ValidateIf((o) => o.role === Role.EMPLOYEE)
  @IsEnum(EmploymentStatus)
  @IsNotEmpty()
  status: EmploymentStatus;

  @ValidateIf((o) => o.role === Role.EMPLOYEE)
  @IsString()
  @IsNotEmpty()
  position: string;

  @ValidateIf((o) => o.role === Role.EMPLOYEE)
  @IsDateString()
  @IsNotEmpty()
  joinDate: string;

  @ValidateIf((o) => o.role === Role.EMPLOYEE)
  @IsString()
  @IsNotEmpty()
  noRekening: string;
}
