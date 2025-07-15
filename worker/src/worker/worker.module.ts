import { Module } from '@nestjs/common';
import { CompanyWorkerService } from './company.worker.service';
import { PrismaModule } from '../infra/prisma/prisma.module';
import { RedisModule } from '../infra/redis/redis.module';
import { LoggerModule } from '../infra/logger/logger.module';
import { XenditModule } from '../infra/xendit/xendit.module';
import { DisbursementWorkerService } from './disbursement.worker.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, RedisModule, LoggerModule, XenditModule, ConfigModule.forRoot({ isGlobal: true })],
  providers: [CompanyWorkerService, DisbursementWorkerService],
})
export class WorkerModule {}
