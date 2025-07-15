import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infra/prisma/prisma.service';
import { XenditService } from '../infra/xendit/xendit.service';
import { EventPattern } from '@nestjs/microservices';

@Injectable()
export class DisbursementWorkerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly xenditService: XenditService,
  ) {}

  @EventPattern('disbursement_queue')
  async processDisbursement(data: { transactionId: string }) {
    const { transactionId } = data;
    console.log(`Processing disbursement for transaction ${transactionId}`);

    // 1. Fetch transaction and related payrolls
    const transaction = await this.prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
      include: {
        payrollPeriod: {
          include: {
            payrolls: {
              include: {
                employee: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      console.error(`Transaction not found: ${transactionId}`);
      return;
    }

    // 2. Prepare disbursement items
    const disbursementItems = transaction.payrollPeriod.payrolls.map((p) => ({
      externalID: `payroll-${p.id}`,
      amount: p.netSalary,
      bankCode: 'BCA', // This should be dynamic, from employee data
      accountHolderName: p.employee.user.name, // This should be from employee data
      accountNumber: p.employee.noRekening,
      description: `Payroll for ${p.employee.user.name}`,
    }));

    // 3. Call Xendit to create batch disbursement
    const batchDisbursement = await this.xenditService.createBatchDisbursement({
      reference: transaction.id,
      disbursements: disbursementItems,
    });

    // 4. Update transaction with batch disbursement ID
    await this.prisma.paymentTransaction.update({
      where: { id: transactionId },
      data: { xenditBatchDisbId: batchDisbursement.id },
    });

    console.log(
      `Disbursement for transaction ${transactionId} has been sent to Xendit with batch ID: ${batchDisbursement.id}`,
    );
  }
}
