import { Controller, Post, Get, Body, Req, Param } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('initiate')
  async initiatePayment(@Body() dto: CreatePaymentRequestDto, @Req() req: any) {
    const userId = req.user?.id ?? 13; // ganti dengan JWT kalau sudah ada
    return this.paymentService.initiatePayrollPayment(dto, userId);
  }

  @Get('transaction/:id')
  async getPaymentRequestByTransactionId(@Param('id') transactionId: number) {
    return this.paymentService.getPaymentRequestByTransactionId(transactionId);
  }
}
