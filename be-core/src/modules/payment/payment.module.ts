import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { XenditModule } from '../../infra/xendit/xendit.module';
import { PrismaModule } from '../../infra/prisma/prisma.module';

@Module({
  imports: [XenditModule, PrismaModule],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
