
import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { LoggerModule } from './infra/logger/logger.module';

import { RedisModule } from './infra/redis/redis.module';
import { DevtoolsModule } from '@nestjs/devtools-integration';
import { AuthModule } from './modules/auth/auth.module';
import { CompanyModule } from './modules/company/company.module';

@Module({
  imports: [
    DevtoolsModule.register({
      http: process.env.NODE_ENV !== 'production',
      port: 8001, // ganti ke port lain
    }),
    LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // BooksModule,
    RedisModule,
    AuthModule,
    CompanyModule,

  ],
})
export class AppModule {}
