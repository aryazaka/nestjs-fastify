import { Controller, Get, Post, Body, Param, Patch, Delete, ParseIntPipe } from '@nestjs/common';
import { BookService } from './books.service';
import { CreateBookDto } from './dto/create.books.dto';
import { UpdateBookDto } from './dto/update.books.dto';

@Controller('books')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Get()
async findAll() {
    return {
  data: await this.bookService.findAll(),
    success: true,
    test: 200,
  message: 'List of books berhasil!!',
};
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
     return {
  data: await this.bookService.findOne(id),
    success: true,
    test: 200,
  message: 'List of books berhasil!!',
};
    
  }

  @Post()
  async create(@Body() dto: CreateBookDto) {
    return await this.bookService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBookDto) {
    return await this.bookService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.bookService.remove(id);
  }
}
