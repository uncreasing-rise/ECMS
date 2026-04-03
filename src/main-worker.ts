import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { WorkerModule } from './worker/worker.module';

async function bootstrapWorker() {
  const logger = new Logger('WorkerBootstrap');
  const rabbitMqUrl = process.env.RABBITMQ_URL;

  if (!rabbitMqUrl) {
    logger.error('RABBITMQ_URL is required for worker mode');
    process.exit(1);
  }

  const queue = process.env.WORKER_QUEUE || 'email.verification';
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    WorkerModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [rabbitMqUrl],
        queue,
        queueOptions: {
          durable: true,
        },
      },
    },
  );

  await app.listen();
  logger.log(`Worker started. queue=${queue}`);
}

bootstrapWorker();
