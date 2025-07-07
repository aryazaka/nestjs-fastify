import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppLogger } from '../../common/logger/logger.service';
import { CreateBookDto } from './dto/create.books.dto';
import { UpdateBookDto } from './dto/update.books.dto';
import { RabbitMQService } from '../../common/rabbitmq/rabbitmq.service';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class BookService {
  private readonly queueName = 'books_queue';

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
    private readonly rabbitMQ: RabbitMQService,
    private readonly redis: RedisService,
  ) {}

  // Create: kirim ke worker, worker yg insert & update cache
  async create(data: CreateBookDto) {
    await this.rabbitMQ.publish(this.queueName, data);
    // Optional: hapus cache all biar next findAll fresh
    await this.redis.del('book:all');
    return { success: true, message: 'Book queued to be saved!' };
  }

  // Update: update DB & update cache
  async update(id: number, data: UpdateBookDto) {
    const updated = await this.prisma.book.update({ where: { id }, data });
    await this.redis.set(`book:${id}`, JSON.stringify(updated));
    await this.redis.del('book:all'); // invalidate list cache
    return updated;
  }

  // FindOne: cache first
  async findOne(id: number) {
    const cacheKey = `book:${id}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit: ${cacheKey}`);
      return JSON.parse(cached);
    }

    this.logger.debug(`Cache miss: ${cacheKey}, fetching from DB`);
    const book = await this.prisma.book.findUnique({ where: { id } });
    if (!book) throw new NotFoundException('Book not found');

    await this.redis.set(cacheKey, JSON.stringify(book),  60 * 60 );
// TTL 1 jam
    return book;
  }

  // FindAll: cache first
  async findAll() {
    const cacheKey = 'book:all';

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      console.log(`Cache hit: ${cacheKey}`);
      return JSON.parse(cached);
    }

    console.log(`Cache miss: ${cacheKey}, fetching from DB`);
    const books = await this.prisma.book.findMany();

   await this.redis.set(cacheKey, JSON.stringify(books), 60 * 60 );

    return books;
  }

  // Remove: delete from DB & delete cache
  async remove(id: number) {
    await this.prisma.book.delete({ where: { id } });
    await this.redis.del(`book:${id}`);
    await this.redis.del('book:all'); // invalidate list cache
    return { success: true };
  }
}
