import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { NotificationDeliveryJobData } from './notification-delivery.types.js';
import {
  NOTIFICATION_JOB_NAME,
  NOTIFICATION_QUEUE_NAME,
  parseBullmqRedisConnection,
} from './notification-queue.utils.js';

@Injectable()
export class NotificationQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationQueueService.name);
  private queue?: Queue<NotificationDeliveryJobData>;
  private queueEnabled = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.config.get<string>('REDIS_URL');
    if (!redisUrl) {
      this.logger.warn(
        'REDIS_URL is missing. Notification queue producer disabled (Upstash REST does not support BullMQ workers).',
      );
      this.queueEnabled = false;
      return;
    }

    const connection = parseBullmqRedisConnection(redisUrl);

    this.queue = new Queue<NotificationDeliveryJobData>(
      NOTIFICATION_QUEUE_NAME,
      {
        connection,
        defaultJobOptions: {
          attempts: 5,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { age: 60 * 60, count: 1000 },
          removeOnFail: { age: 24 * 60 * 60, count: 5000 },
        },
      },
    );

    this.queueEnabled = true;
    this.logger.log('Notification queue producer started');
  }

  async onModuleDestroy() {
    await this.queue?.close();
  }

  async enqueue(job: NotificationDeliveryJobData) {
    if (!this.queueEnabled || !this.queue) {
      this.logger.warn(
        `Skip enqueue for notification ${job.notificationId}: queue producer is disabled`,
      );
      return;
    }

    await this.queue.add(NOTIFICATION_JOB_NAME, job, {
      jobId: `${job.notificationId}`,
    });
  }
}
