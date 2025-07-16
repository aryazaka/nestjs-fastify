
import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { LoggerModule } from './infra/logger/logger.module';

import { RedisModule } from './infra/redis/redis.module';
import { DevtoolsModule } from '@nestjs/devtools-integration';
import { AuthModule } from './modules/auth/auth.module';
import { CompanyModule } from './modules/company/company.module';
import { XenditModule } from './infra/xendit/xendit.module';
import { PaymentModule } from './modules/payment/payment.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { GatewayModule } from './infra/gateway/gateway.module';
import { CompanyUserModule } from './modules/company-user/company-user.module';

@Module({
  imports: [
    DevtoolsModule.register({
      http: process.env.NODE_ENV !== 'production',
      port: 8001,
    }),
    // LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RedisModule,
    AuthModule,
    CompanyModule,
    XenditModule,
    PaymentModule,
    WebhookModule,
    GatewayModule,
    CompanyUserModule,

  ],
})
export class AppModule {}
