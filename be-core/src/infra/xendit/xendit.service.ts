import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Xendit, { PaymentRequest as PaymentRequestClient } from 'xendit-node';

@Injectable()
export class XenditService {
  private readonly paymentRequest: any;
  private readonly xenditPaymentRequestClient: any;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('XENDIT_SECRET_KEY')!;

    // Cara 2: Langsung buat PaymentRequestClient
    this.xenditPaymentRequestClient = new PaymentRequestClient({ secretKey });
  }

  async createPaymentRequest(data: any): Promise<any> {
    return this.xenditPaymentRequestClient.createPaymentRequest({ data });
  }

  async getPaymentRequestById(id: string): Promise<any> {
    return this.paymentRequest.getPaymentRequestByID({ paymentRequestId: id });
  }

   async simulatePaymentRequest(paymentRequestId: string): Promise<any> {
    return this.xenditPaymentRequestClient.simulatePaymentRequestPayment({
      paymentRequestId,
    });
  }
}
