import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { XenditService } from '../../infra/xendit/xendit.service';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import {
  PaymentRequestParameters,
  PaymentMethodType,
  PaymentRequest,
  PaymentMethodReusability,
  VirtualAccountChannelCode,
} from 'xendit-node/payment_request/models';

@Injectable()
export class PaymentService {
  constructor(
    private readonly db: PrismaService,
    private readonly xendit: XenditService,
  ) {}

  async initiatePayrollPayment(
    dto: CreatePaymentRequestDto,
    userId: number,
  ): Promise<{ paymentRequest: PaymentRequest; savedTransaction: any }> {
    const { payrollPeriodId, totalAmount, vaType } = dto;

    const payrolls = await this.db.payroll.findMany({ where: { payrollPeriodId } });
    if (!payrolls.length) throw new NotFoundException('No payrolls for this period');

    const calculatedTotal = payrolls.reduce((sum, p) => sum + p.netSalary.toNumber(), 0);
    if (calculatedTotal !== totalAmount) {
      throw new BadRequestException('Total amount mismatch with payroll data');
    }

    const user = await this.db.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const uniqueRefId = `pr-${payrollPeriodId}-${Date.now()}`;
    const paymentMethodRefId = `pm-${payrollPeriodId}-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // ✅ Map vaType → channelCode
    let channelCode: VirtualAccountChannelCode;
    switch (vaType!.toLowerCase()) {
      case 'bca':
        channelCode = VirtualAccountChannelCode.Bca;
        break;
      case 'bni':
        channelCode = VirtualAccountChannelCode.Bni;
        break;
      case 'bri':
        channelCode = VirtualAccountChannelCode.Bri;
        break;
      case 'mandiri':
        channelCode = VirtualAccountChannelCode.Mandiri;
        break;
      default:
        throw new BadRequestException('Unsupported VA type');
    }

    const paymentMethod = {
      reusability: PaymentMethodReusability.OneTimeUse,
      type: PaymentMethodType.VirtualAccount,
      referenceId: paymentMethodRefId,
      virtualAccount: {
        channelCode,
        channelProperties: {
          customerName: user.name ?? 'Default HR Name',
          expiresAt,
        },
      },
    };

    const data: PaymentRequestParameters = {
      amount: totalAmount,
      currency: 'IDR',
      referenceId: uniqueRefId,
      paymentMethod,
      metadata: {
        payrollPeriodId: String(payrollPeriodId),
      },
    };

    console.log('Sending to Xendit:', JSON.stringify(data, null, 2));

    const paymentRequest = await this.xendit.createPaymentRequest(data);

    const savedTransaction = await this.db.paymentTransaction.create({
      data: {
        payrollPeriodId,
        totalAmount,
        paymentMethod: 'PAYMENT_REQUEST',
        status: 'PENDING',
        paidById: userId,
        xenditPaymentRequestId: paymentRequest.id,
      },
    });

    return { paymentRequest, savedTransaction };
  }

  async getPaymentRequestByTransactionId(transactionId: number) {
    const transaction = await this.db.paymentTransaction.findUnique({
      where: { id: transactionId },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');
    if (!transaction.xenditPaymentRequestId) throw new NotFoundException('No payment request ID saved');

    const paymentRequest = await this.xendit.getPaymentRequestById(transaction.xenditPaymentRequestId);

    return {
      paymentRequest,
      transaction,
    };
  }

   async simulatePayment(paymentRequestId: string): Promise<any> {
    const paymentRequest = await this.xendit.simulatePaymentRequest(paymentRequestId);
    return { message: 'Simulation successful', paymentRequest };
  }
}
