// src/worker/worker.module.ts
import { Module } from '@nestjs/common';
// import { BooksWorker } from './books.worker.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../common/redis/redis.module';
import { RabbitMQModule } from '../common/rabbitmq/rabbitmq.module';
import { AppLoggerModule } from '../common/logger/logger.module';

@Module({
  imports: [PrismaModule, RedisModule, RabbitMQModule, AppLoggerModule],
  // providers: [BooksWorker],
})
export class WorkerModule {}
