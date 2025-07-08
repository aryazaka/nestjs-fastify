import { Injectable, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit {
  private channel: amqp.Channel;

  async onModuleInit() {
    const rmqURL = process.env.RABBITMQ_URL || 'amqp://localhost';
    console.log(`Connecting to RabbitMQ`);
    const conn = await amqp.connect(rmqURL);
    this.channel = await conn.createChannel();
    console.log('✅ RabbitMQ channel created');
  }

  // Bisa publish ke queue apa saja
  async publish(queue: string, data: any) {
    await this.channel.assertQueue(queue); // pastikan queue ada
    this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)));
  }

  // Bisa consume queue apa saja
  async consume(queue: string, callback: (msg: any) => Promise<void>) {
    await this.channel.assertQueue(queue); // pastikan queue ada
    this.channel.consume(queue, async (msg) => {
      if (msg) {
        const content = JSON.parse(msg.content.toString());
        await callback(content);
        this.channel.ack(msg);
      }
    });
  }
}
