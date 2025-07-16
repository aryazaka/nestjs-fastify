import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { CompanyUserService } from './company-user.service';
import { CreateCompanyUserDto } from './dto/create-company-user.dto';
import { UpdateCompanyUserDto } from './dto/update-company-user.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('company-user')
export class CompanyUserController {
  constructor(private readonly companyUserService: CompanyUserService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Request() req, @Body() createCompanyUserDto: CreateCompanyUserDto) {
    // The logged-in admin's companyId is used to create a user in the same company
    const { companyId } = req.user;
    return this.companyUserService.create(companyId, createCompanyUserDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.HR, Role.FINANCE)
  findAll(@Request() req) {
    const { companyId } = req.user;
    return this.companyUserService.findAll(companyId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.HR, Role.FINANCE)
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const { companyId } = req.user;
    return this.companyUserService.findOne(companyId, id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCompanyUserDto: UpdateCompanyUserDto,
  ) {
    const { companyId } = req.user;
    return this.companyUserService.update(companyId, id, updateCompanyUserDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const { companyId, id: adminId } = req.user;
    return this.companyUserService.remove(adminId, companyId, id);
  }
}
