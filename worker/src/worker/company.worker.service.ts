import { Injectable, NotFoundException } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { PrismaService } from '../infra/prisma/prisma.service';
import { RedisService } from '../infra/redis/redis.service';
import { AppLogger } from '../infra/logger/logger.service';

@Injectable()
export class CompanyWorkerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly logger: AppLogger,
  ) {
    console.log(CompanyWorkerService.name);
  }

  @MessagePattern({ cmd: 'create_company' })
  async create(@Payload() data: any) {
    try {
      console.log('Creating company...');
      const company = await this.prisma.company.create({ data });
      await this.redis.del('company:all');
      console.log('Company created successfully');
      return { success: true, data: company };
    } catch (error) {
      console.error('Error in create_company worker:', error.message, error.stack);
      throw new RpcException(error.message); // Melemparkan RpcException
    }
  }

  @MessagePattern({ cmd: 'update_company' })
  async update(@Payload() payload: { id: number; data: any }) {
    try {
      const { id, data } = payload;
      console.log(`Updating company with id: ${id}`)
      const company = await this.prisma.company.findUnique({ where: { id } });
      if (!company){
        return { success: false, message: 'Company not found', error: 'Company not found' };
      }
      const updated = await this.prisma.company.update({ where: { id }, data });
      await this.redis.set(`company:${id}`, JSON.stringify(updated));
      await this.redis.del('company:all');
      console.log(`Company with id: ${id} updated successfully`);
      return { success: true, data: updated };
    } catch (error) {
      console.error('Error in update_company worker:', error.message, error.stack);
      throw new RpcException(error.message); // Melemparkan RpcException
    }
  }

  @MessagePattern({ cmd: 'delete_company' })
  async remove(@Payload() id: number) {
    try {
      console.log(`Deleting company with id: ${id}`);
      const company = await this.prisma.company.findUnique({ where: { id } });
      if (!company){
        return { success: false, message: 'Company not found', error: 'Company not found' };
      }
      await this.prisma.company.delete({ where: { id } });
      await this.redis.del(`company:${id}`);
      await this.redis.del('company:all');
      console.log(`Company with id: ${id} deleted successfully`);
      return { success: true };
    } catch (error) {
      console.error('Error in delete_company worker:', error.message, error.stack);
      throw new RpcException(error.message); // Melemparkan RpcException
    }
  }
}