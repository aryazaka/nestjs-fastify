import { Module } from '@nestjs/common';
import { CompanyController } from './company.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CompanyService } from './company.service';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { RedisModule } from '../../infra/redis/redis.module';
import { LoggerModule } from '../../infra/logger/logger.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    LoggerModule,
    ClientsModule.register([
      {
        name: 'COMPANY_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: process.env.RABBITMQ_RPC_QUEUE_NAME,
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [CompanyController],
  providers: [CompanyService],
})
export class CompanyModule {}
