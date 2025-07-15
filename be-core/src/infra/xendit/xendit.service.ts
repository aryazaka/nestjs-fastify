import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Xendit, { PaymentRequest as PaymentRequestClient } from 'xendit-node';

@Injectable()
export class XenditService {
  private readonly paymentRequest: any;
  private readonly xenditPaymentRequestClient: any;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('XENDIT_SECRET_KEY')!;

    // Inisialisasi Xendit Client
    const xenditClient = new Xendit({ secretKey });

    // Cara 1: Dari destruktur PaymentRequest
    this.paymentRequest = xenditClient.PaymentRequest;

    // Cara 2: Langsung buat PaymentRequestClient
    this.xenditPaymentRequestClient = new PaymentRequestClient({ secretKey });
  }

  async createPaymentRequest(data: any): Promise<any> {
    return this.xenditPaymentRequestClient.createPaymentRequest({ data });
  }

  async getPaymentRequestById(id: string): Promise<any> {
    return this.paymentRequest.getPaymentRequestByID({ paymentRequestId: id });
  }
}
