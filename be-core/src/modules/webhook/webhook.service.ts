import {
  Injectable,
  UnauthorizedException,
  Inject,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { ClientProxy } from '@nestjs/microservices';
import { GatewayService } from '../../infra/gateway/gateway.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @Inject('RABBITMQ_SERVICE') private readonly rabbitClient: ClientProxy,
    private readonly gatewayService: GatewayService,
  ) {}

  async handleXenditWebhook(callbackToken: string, payload: any) {
    const expectedToken = this.configService.get<string>(
      'XENDIT_WEBHOOK_TOKEN',
    );
    if (callbackToken !== expectedToken) {
      throw new UnauthorizedException('Invalid callback token');
    }

    console.log(`Received Xendit webhook: ${payload.event}`);

    if (payload.event.startsWith('payment_request.')) {
      await this.handlePaymentRequestWebhook(payload.data);
    } else if (payload.event.startsWith('payment.')) {
      await this.handlePaymentWebhook(payload.data);
    } else if (payload.event === 'disbursement') {
      await this.handleDisbursement(payload.data);
    } else {
      console.warn(`Unhandled event type: ${payload.event}`);
    }

    return { status: 'ok' };
  }

  private async handlePaymentRequestWebhook(data: any) {
    const paymentRequestId = data.id;
    console.log(
      `Processing payment_request webhook for ID: ${paymentRequestId}, status: ${data.status}`,
    );

    const transaction = await this.prisma.paymentTransaction.findFirst({
      where: { xenditPaymentRequestId: paymentRequestId },
    });

    if (!transaction) {
      console.warn(
        `PaymentTransaction not found for paymentRequestId: ${paymentRequestId}`,
      );
      return;
    }

    // Tambah handle EXPIRED
    if (data.status === 'EXPIRED') {
      await this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: { status: 'EXPIRED' },
      });
      console.log(`Transaction ${transaction.id} marked as EXPIRED`);
      return;
    }

    // Tambah jika status SUCCEEDED (opsional, tergantung use case)
    if (data.status === 'SUCCEEDED') {
      await this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: { status: 'PAID' },
      });
      console.log(`Transaction ${transaction.id} marked as PAID`);
      return;
    }

    console.warn(`Unhandled payment_request status: ${data.status}`);
  }

  private async handlePaymentWebhook(data: any) {
    const paymentRequestId = data.payment_request_id;
    const paymentStatus = data.status;

    console.log(
      `Processing payment webhook for paymentRequestId: ${paymentRequestId}, paymentId: ${data.id}, status: ${paymentStatus}`,
    );

    const transaction = await this.prisma.paymentTransaction.findFirst({
      where: { xenditPaymentRequestId: paymentRequestId },
    });

    if (!transaction) {
      console.warn(
        `PaymentTransaction not found for paymentRequestId: ${paymentRequestId}`,
      );
      return;
    }

    if (transaction.status !== 'PENDING') {
      console.warn(`Transaction ${transaction.id} already processed`);
      return;
    }

    if (paymentStatus === 'SUCCEEDED') {
      await this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: { status: 'PAID' },
      });

      // Update payrolls → PROCESSING
      await this.prisma.payroll.updateMany({
        where: { payrollPeriodId: transaction.payrollPeriodId },
        data: { status: 'PROCESSING' },
      });

      // Kirim message ke queue
      this.rabbitClient.emit('disbursement_queue', {
        transactionId: transaction.id,
      });

      console.log(
        `Transaction ${transaction.id} marked as PAID & dispatched to worker`,
      );
    } else if (paymentStatus === 'FAILED') {
      await this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: { status: 'FAILED' },
      });
      console.log(`Transaction ${transaction.id} marked as FAILED`);
    } else if (paymentStatus === 'PENDING') {
      // optional: kalau mau simpan status pending
      console.log(`Payment is pending for transaction ${transaction.id}`);
    } else {
      console.warn(`Unhandled payment status: ${paymentStatus}`);
    }
  }

  private async handleDisbursement(data: any) {
    console.log(
      `Handling disbursement webhook for external ID: ${data.external_id}`,
    );

    const payrollId = parseInt(data.external_id.replace('payroll-', ''), 10);
    if (isNaN(payrollId)) {
      console.error(`Invalid external_id format: ${data.external_id}`);
      return;
    }

    const payroll = await this.prisma.payroll.findUnique({
      where: { id: payrollId },
      include: { payrollPeriod: { include: { paymentTransactions: true } } },
    });

    if (!payroll) {
      console.warn(`Payroll not found for ID: ${payrollId}`);
      return;
    }

    const newStatus =
      data.status === 'COMPLETED'
        ? 'PAID'
        : data.status === 'FAILED'
          ? 'FAILED'
          : null;

    if (!newStatus) {
      console.warn(`Unhandled disbursement status: ${data.status}`);
      return;
    }

    await this.prisma.payroll.update({
      where: { id: payrollId },
      data: {
        status: newStatus,
        paidDate: newStatus === 'PAID' ? new Date() : undefined,
      },
    });

    const paymentTransaction = payroll.payrollPeriod.paymentTransactions.find(
      (pt) => pt.xenditBatchDisbId === data.batch_id,
    );

    if (paymentTransaction) {
      this.gatewayService.broadcastToUser(
        paymentTransaction.paidById,
        'payroll_status_update',
        {
          payrollId,
          status: newStatus,
          employeeId: payroll.employeeId,
          payrollPeriodId: payroll.payrollPeriodId,
        },
      );
    } else {
      console.warn(`PaymentTransaction not found for payroll ${payrollId}`);
    }

    console.log(`Payroll ${payrollId} updated to ${newStatus}`);
  }
}
