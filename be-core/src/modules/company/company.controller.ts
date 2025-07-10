import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { CreateCompanyDto } from './dto/create.company.dto';
import { UpdateCompanyDto } from './dto/update.company.dto';
import { CompanyService } from './company.service';

@Controller('company')
export class CompanyController {
  constructor(
    private readonly companyService: CompanyService,
  ) {}

  @Get()
  async findAll() {
    return {
      data: await this.companyService.findAll(),
      success: true,
      message: 'List of companies retrieved successfully!',
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return {
      data: await this.companyService.findOne(id),
      success: true,
      message: 'Company retrieved successfully!',
    };
  }

  @Post()
  async create(@Body() dto: CreateCompanyDto) {
    const result = await this.companyService.create(dto);
    return result;
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCompanyDto,
  ) {
    const result = await this.companyService.update(id, dto);
    return result;
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.companyService.remove(id);
    return result;
  }
}