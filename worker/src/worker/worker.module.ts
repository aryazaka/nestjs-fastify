import { Module } from '@nestjs/common';
import { CompanyWorkerService } from './company.worker.service';
import { PrismaModule } from '../infra/prisma/prisma.module';
import { RedisModule } from '../infra/redis/redis.module';
import { LoggerModule } from '../infra/logger/logger.module';

@Module({
  imports: [PrismaModule, RedisModule, LoggerModule],
  controllers: [CompanyWorkerService],
})
export class WorkerModule {}