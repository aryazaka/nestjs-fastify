import { Module } from '@nestjs/common';
import { BookService } from './books.service';
import { BookController } from './books.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AppLoggerModule } from '../../common/logger/logger.module';
import { RabbitMQModule } from '../../common/rabbitmq/rabbitmq.module';
import { RedisModule } from '../../common/redis/redis.module';

@Module({
  controllers: [BookController],
  providers: [BookService],
  imports: [PrismaModule, AppLoggerModule, RabbitMQModule, RedisModule],
})
export class BooksModule {}
