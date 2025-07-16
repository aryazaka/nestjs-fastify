import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
} from 'class-validator';

export class CreateCompanyDto {
  @IsNotEmpty({ message: 'Nama perusahaan wajib diisi' })
  @IsString({ message: 'Nama perusahaan harus berupa teks' })
  name: string;

  @IsNotEmpty({ message: 'Email admin wajib diisi' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  emailAdmin: string;

  @IsNotEmpty({ message: 'Telepon kantor wajib diisi' })
  @IsString({ message: 'Telepon kantor harus berupa teks' })
  officePhone: string;

  @IsNotEmpty({ message: 'Alamat wajib diisi' })
  @IsString({ message: 'Alamat harus berupa teks' })
  address: string;

  @IsNotEmpty({ message: 'Password wajib diisi' })
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  password: string;

  @IsOptional()
  @IsString()
  socketId?: string;
}
