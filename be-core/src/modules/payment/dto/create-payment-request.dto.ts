import { IsNumber, IsString } from 'class-validator';

export class CreatePaymentRequestDto {
  @IsNumber()
  payrollPeriodId: number;

  @IsNumber()
  totalAmount: number;

  @IsString()
  vaType?: string; // contoh: 'bni', 'bca', 'bri'
}
