// src/worker/books.worker.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { RabbitMQService } from '../common/rabbitmq/rabbitmq.service';
import { AppLogger } from '../common/logger/logger.service';

@Injectable()
export class BooksWorker implements OnModuleInit {
  private readonly queueName = 'books_queue';

  constructor(
    private readonly db: PrismaService,
    private readonly redis: RedisService,
    private readonly rabbitMQ: RabbitMQService,
    private readonly logger: AppLogger,
  ) {}

  async onModuleInit() {
    this.logger.info(`Books Worker started, waiting for queue: ${this.queueName}`);
    await this.rabbitMQ.consume(this.queueName, async (msg) => {
      try {
        const created = await this.db.book.create({ data: msg });
        await this.redis.set(`book:${created.id}`, JSON.stringify(created));
        this.logger.info(`Book saved by worker: ${created.title}`);
      } catch (error) {
        this.logger.error(`Failed to process message: ${error.message}`);
      }
    });
  } c 
}
