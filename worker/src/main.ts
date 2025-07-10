import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { WorkerModule } from './worker/worker.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(WorkerModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL],
      queue: process.env.RABBITMQ_RPC_QUEUE_NAME,
      queueOptions: {
        durable: true,
      },
    },
  });

  await app.listen();
  console.log('Worker is listening');
}
bootstrap();