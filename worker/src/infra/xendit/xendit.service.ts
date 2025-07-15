import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Disbursement from 'xendit-node';

@Injectable()
export class XenditService {
  private disbursement: any;

  constructor(private configService: ConfigService) {
    this.disbursement = new Disbursement({
      secretKey: this.configService.get<string>('XENDIT_SECRET_KEY')!,
    });
  }

  async createBatchDisbursement(data: any): Promise<any> {
    return this.disbursement.createBatch(data);
  }
}
