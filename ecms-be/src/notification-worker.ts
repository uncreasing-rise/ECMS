import { NestFactory } from '@nestjs/core';
import { NotificationWorkerModule } from './modules/notifications/notification-worker.module.js';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(NotificationWorkerModule, {
    logger: ['log', 'warn', 'error'],
  });

  const shutdown = async () => {
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

void bootstrap();
