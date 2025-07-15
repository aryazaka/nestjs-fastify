import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { ClientProxy } from '@nestjs/microservices';
import { GatewayService } from '../../infra/gateway/gateway.service';

@Injectable()
export class WebhookService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @Inject('RABBITMQ_SERVICE') private readonly rabbitClient: ClientProxy,
    private readonly gatewayService: GatewayService,
  ) {}

  async handleXenditWebhook(callbackToken: string, payload: any) {
    const expectedToken = this.configService.get<string>('XENDIT_WEBHOOK_TOKEN');
    if (callbackToken !== expectedToken) {
      throw new UnauthorizedException('Invalid callback token');
    }

    console.log(`Received Xendit webhook: ${payload.event}`);

    if (payload.event.startsWith('payment_request.')) {
      await this.handlePaymentRequestWebhook(payload.data);
    } else if (payload.event === 'disbursement') {
      await this.handleDisbursement(payload.data);
    } else {
      console.warn(`Unhandled event type: ${payload.event}`);
    }

    return { status: 'ok' };
  }

  private async handlePaymentRequestWebhook(data: any) {
    const paymentRequestId = data.id;
    console.log(`Processing payment_request webhook for ID: ${paymentRequestId}, status: ${data.status}`);

    await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.paymentTransaction.findFirst({
        where: { xenditPaymentRequestId: paymentRequestId },
      });

      if (!transaction) {
        console.warn(`PaymentTransaction not found for paymentRequestId: ${paymentRequestId}`);
        return;
      }

      if (transaction.status !== 'PENDING') {
        console.warn(`Transaction ${transaction.id} already processed`);
        return;
      }

      if (data.status === 'PAID') {
        // Update transaction → PAID
        await tx.paymentTransaction.update({
          where: { id: transaction.id },
          data: { status: 'PAID' },
        });

        // Update payrolls → PROCESSING
        await tx.payroll.updateMany({
          where: { payrollPeriodId: transaction.payrollPeriodId },
          data: { status: 'PROCESSING' },
        });

        // Kirim message ke queue untuk trigger batch disbursement
        this.rabbitClient.emit('disbursement_queue', { transactionId: transaction.id });

        console.log(`Transaction ${transaction.id} marked as PAID & dispatched to worker`);
      } else if (data.status === 'FAILED') {
        // Update transaction → FAILED
        await tx.paymentTransaction.update({
          where: { id: transaction.id },
          data: { status: 'FAILED' },
        });
        console.log(`Transaction ${transaction.id} failed`);
      } else {
        console.warn(`Unhandled payment request status: ${data.status}`);
      }
    });
  }

  private async handleDisbursement(data: any) {
    console.log(`Handling disbursement webhook for external ID: ${data.external_id}`);

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

    const newStatus = data.status === 'COMPLETED' ? 'PAID' :
                      data.status === 'FAILED' ? 'FAILED' : null;

    if (!newStatus) {
      console.warn(`Unhandled disbursement status: ${data.status}`);
      return;
    }

    await this.prisma.payroll.update({
      where: { id: payrollId },
      data: { status: newStatus, paidDate: newStatus === 'PAID' ? new Date() : undefined },
    });

    const paymentTransaction = payroll.payrollPeriod.paymentTransactions.find(
      (pt) => pt.xenditBatchDisbId === data.batch_id
    );

    if (paymentTransaction) {
      this.gatewayService.broadcastToUser(paymentTransaction.paidById, 'payroll_status_update', {
        payrollId,
        status: newStatus,
        employeeId: payroll.employeeId,
        payrollPeriodId: payroll.payrollPeriodId,
      });
    } else {
      console.warn(`PaymentTransaction not found for payroll ${payrollId}`);
    }

    console.log(`Payroll ${payrollId} updated to ${newStatus}`);
  }
}
