import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker } from 'bullmq';
import { NotificationDeliveryExecutor } from './notification-delivery.executor.js';
import { NotificationDeliveryJobData } from './notification-delivery.types.js';
import {
  NOTIFICATION_JOB_NAME,
  NOTIFICATION_QUEUE_NAME,
  parseBullmqRedisConnection,
} from './notification-queue.utils.js';

@Injectable()
export class NotificationWorkerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(NotificationWorkerService.name);
  private worker?: Worker<NotificationDeliveryJobData>;

  constructor(
    private readonly config: ConfigService,
    private readonly executor: NotificationDeliveryExecutor,
  ) {}

  async onModuleInit() {
    const redisUrl = this.config.get<string>('REDIS_URL');
    if (!redisUrl) {
      throw new Error(
        'REDIS_URL is required for BullMQ notification worker. Upstash REST is not supported for queue workers.',
      );
    }

    const connection = parseBullmqRedisConnection(redisUrl);

    this.worker = new Worker<NotificationDeliveryJobData>(
      NOTIFICATION_QUEUE_NAME,
      async (job) => {
        if (job.name !== NOTIFICATION_JOB_NAME) {
          return;
        }

        await this.executor.deliver(job.data);
      },
      {
        connection,
        concurrency: 10,
      },
    );

    this.worker.on('failed', (job, error) => {
      this.logger.error(
        `Notification job failed: id=${job?.id ?? 'unknown'} name=${job?.name ?? 'unknown'}`,
        error,
      );
    });

    this.logger.log('Notification worker started');
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }
}
