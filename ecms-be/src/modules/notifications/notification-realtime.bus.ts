import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

export interface NotificationRealtimeMessage {
  userId: string;
  notification: {
    id: string;
    type: string;
    title: string;
    body: string;
  };
}

const NOTIFICATION_REALTIME_CHANNEL = 'ecms:notifications:realtime';

@Injectable()
export class NotificationRealtimeBus implements OnModuleDestroy {
  private readonly logger = new Logger(NotificationRealtimeBus.name);
  private publisher?: ReturnType<typeof createClient>;
  private subscriber?: ReturnType<typeof createClient>;
  private disabled = false;

  constructor(private readonly config: ConfigService) {}

  async publish(message: NotificationRealtimeMessage) {
    if (this.isDisabled()) {
      return;
    }

    const client = await this.ensurePublisher();
    if (!client) {
      return;
    }

    await client.publish(
      NOTIFICATION_REALTIME_CHANNEL,
      JSON.stringify(message),
    );
  }

  async subscribe(
    handler: (message: NotificationRealtimeMessage) => void | Promise<void>,
  ) {
    if (this.isDisabled()) {
      return;
    }

    const client = await this.ensureSubscriber();
    if (!client) {
      return;
    }

    await client.subscribe(NOTIFICATION_REALTIME_CHANNEL, async (payload) => {
      try {
        const parsed = JSON.parse(payload) as NotificationRealtimeMessage;
        await handler(parsed);
      } catch (error) {
        this.logger.error(
          'Failed to process realtime notification payload',
          error,
        );
      }
    });
  }

  async onModuleDestroy() {
    await Promise.all([
      this.publisher?.quit().catch(() => undefined),
      this.subscriber?.quit().catch(() => undefined),
    ]);
  }

  private async ensurePublisher() {
    if (this.publisher) {
      return this.publisher;
    }

    const redisUrl = this.getRedisUrlOrDisable();
    if (!redisUrl) {
      return null;
    }

    this.publisher = createClient({ url: redisUrl });
    this.publisher.on('error', (error) => {
      this.logger.error('Realtime publisher Redis error', error);
    });
    await this.publisher.connect();
    return this.publisher;
  }

  private async ensureSubscriber() {
    if (this.subscriber) {
      return this.subscriber;
    }

    const redisUrl = this.getRedisUrlOrDisable();
    if (!redisUrl) {
      return null;
    }

    this.subscriber = createClient({ url: redisUrl });
    this.subscriber.on('error', (error) => {
      this.logger.error('Realtime subscriber Redis error', error);
    });
    await this.subscriber.connect();
    return this.subscriber;
  }

  private getRedisUrlOrDisable() {
    const redisUrl = this.config.get<string>('REDIS_URL');
    if (!redisUrl) {
      this.disabled = true;
      this.logger.warn(
        'REDIS_URL is missing. Realtime notification bus disabled (room fan-out across instances unavailable).',
      );
      return null;
    }

    return redisUrl;
  }

  private isDisabled() {
    return this.disabled;
  }
}
