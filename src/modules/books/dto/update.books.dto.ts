import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class UpdateBookDto {
  @IsNotEmpty({ message: 'Judul wajib diisi' })
  @IsString({ message: 'Judul harus berupa teks' })
  title: string;

  @IsNotEmpty({ message: 'Penulis wajib diisi' })
  @IsString({ message: 'Penulis harus berupa teks' })
  author: string;

  @IsNotEmpty({ message: 'Harga wajib diisi' })
  @IsNumber({}, { message: 'Harga harus berupa angka' })
  price: number;
}
