import { Module } from '@nestjs/common';
import { GatewayService } from './gateway.service';

@Module({
  exports: [GatewayService],
  providers: [GatewayService],
})
export class GatewayModule {}
