import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { AppLogger } from '../../infra/logger/logger.service';
import { RedisService } from '../../infra/redis/redis.service';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { CreateCompanyDto } from './dto/create.company.dto';
import { UpdateCompanyDto } from './dto/update.company.dto';

@Injectable()
export class CompanyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
    private readonly redis: RedisService,
    @Inject('COMPANY_SERVICE') private readonly client: ClientProxy,
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
    const company = await this.prisma.company.findUnique({ where: { id } });
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
    const companies = await this.prisma.company.findMany();
    await this.redis.set(cacheKey, JSON.stringify(companies), 60 * 60);
    return companies;
  }

  async create(dto: CreateCompanyDto) {
    const result = await firstValueFrom(
      this.client.send({ cmd: 'create_company' }, dto).pipe(timeout(5000)),
    );
    return result;
  }

  async update(id: number, dto: UpdateCompanyDto) {
    const result = await firstValueFrom(
      this.client.send({ cmd: 'update_company' }, { id, data: dto }).pipe(timeout(5000)),
    );

    if (result?.success === false && result.error === 'Company not found') {
      throw new NotFoundException('Company not found');
    }

    return result;
  }

  async remove(id: number) {
    const result = await firstValueFrom(
      this.client.send({ cmd: 'delete_company' }, id).pipe(timeout(5000)),
    );

    if (result?.success === false && result.error === 'Company not found') {
      throw new NotFoundException('Company not found');
    }

    return result;
  }
}
