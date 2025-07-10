import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
    console.log('✅ Prisma successfully connected to the database');
  }

  // Opsional: disconnect on shutdown
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
