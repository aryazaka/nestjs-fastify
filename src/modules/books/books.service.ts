import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBookDto } from './dto/create.books.dto';
import { UpdateBookDto } from './dto/update.books.dto';
import { Book } from './interfaces/book.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { AppLogger } from '../../common/logger/logger.service';

@Injectable()
export class BookService {
  constructor(private DB: PrismaService, private readonly logger: AppLogger) {}

  private books : Book[] = [{id: 1, title: 'Book 1', author: 'Author 1', price: 100}];

 async findAll() {
  console.log('▶ Running findAll()');
  this.logger.info('▶ findAll() called');
  const data = await this.DB.berita.findMany();
  console.log('✅ findMany() result:', data);
   this.logger.debug('✅ findAll() result:', data);
  return data;
}

  async findOne(id: number) {
    const book = this.books.find(b => b.id === id);
    if (!book) throw new NotFoundException('Book not found');
    return book;
  }

  async create(data: CreateBookDto) {
    const newBook = {
      id: Date.now(),
      ...data,
    };
    this.books.push(newBook);
    return newBook;
  }

  async update(id: number, data: UpdateBookDto) {
    const index = this.books.findIndex(b => b.id === id);
    if (index === -1) throw new NotFoundException('Book not found');

    this.books[index] = { ...this.books[index], ...data };
    return this.books[index];
  }

  async remove(id: number) {
    const index = this.books.findIndex(b => b.id === id);
    if (index === -1) throw new NotFoundException('Book not found');

    const deleted = this.books.splice(index, 1);
    return deleted[0];
  }
}
