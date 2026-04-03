import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Channel, ChannelModel, connect } from 'amqplib';

@Injectable()
export class RabbitMqService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqService.name);
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const url = this.configService.get<string>('RABBITMQ_URL');
    if (!url) {
      this.logger.warn('RABBITMQ_URL not configured, queue publisher is disabled');
      return;
    }

    this.connection = await connect(url);
    this.channel = await this.connection.createChannel();
  }

  async publish(queue: string, payload: Record<string, unknown>): Promise<boolean> {
    if (!this.channel) {
      this.logger.warn(`RabbitMQ channel unavailable. Skip publish to queue: ${queue}`);
      return false;
    }

    await this.channel.assertQueue(queue, { durable: true });
    const message = {
      pattern: queue,
      data: payload,
    };

    return this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }
}
