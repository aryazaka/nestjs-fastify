import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { BooksModule } from './modules/books/books.module';
import { ConfigModule } from '@nestjs/config';
import { RabbitMQModule } from './common/rabbitmq/rabbitmq.module';
import { RedisModule } from './common/redis/redis.module';
import { WorkerModule } from './worker/worker.module';
@Module({
  imports: [
    LoggerModule.forRoot({
  pinoHttp: process.env.NODE_ENV !== 'production'
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}, // default JSON log
}),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BooksModule,
    RabbitMQModule,
    RedisModule,
    WorkerModule
  ],
})
export class AppModule {}
