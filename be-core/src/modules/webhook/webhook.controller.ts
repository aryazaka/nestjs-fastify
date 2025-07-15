import { Controller, Post, Req, Headers } from '@nestjs/common';
import { WebhookService } from './webhook.service';

@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('xendit')
  handleXenditWebhook(
    @Headers('x-callback-token') callbackToken: string,
    @Req() req: any,
  ) {
    const body = req.body;
    return this.webhookService.handleXenditWebhook(callbackToken, body);
  }
}
