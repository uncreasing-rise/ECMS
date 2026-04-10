import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DeviceTokensService } from '../../common/device-tokens/device-tokens.service';
import { FirebaseService } from '../../common/firebase/firebase.service';
import { RedisService } from '../../common/redis/redis.service';
import { MailService } from '../../common/mail/mail.service';
import { NotificationDeliveryJobData } from './notification-delivery.types.js';
import { NotificationRealtimeBus } from './notification-realtime.bus.js';

const IDEMPOTENCY_TTL_SECONDS = 7 * 24 * 60 * 60;
const IDEMPOTENCY_DONE_SUFFIX = ':done';

@Injectable()
export class NotificationDeliveryExecutor {
  private readonly logger = new Logger(NotificationDeliveryExecutor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly deviceTokens: DeviceTokensService,
    private readonly firebase: FirebaseService,
    private readonly redis: RedisService,
    private readonly mail: MailService,
    private readonly realtimeBus: NotificationRealtimeBus,
  ) {}

  async deliver(job: NotificationDeliveryJobData) {
    const baseData: Record<string, string | null | undefined> = {
      type: job.type,
      ref_type: job.refType,
      ref_id: job.refId,
      notification_id: job.notificationId,
    };

    await this.runChannelWithIdempotency(job, 'push', async () => {
      const fcmTokens = await this.deviceTokens.getActiveFCMTokens(job.userId);
      if (!fcmTokens.length) {
        return;
      }

      const cleanData: Record<string, string> = {};
      Object.entries(baseData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          cleanData[key] = String(value);
        }
      });

      if (fcmTokens.length === 1) {
        await this.firebase.sendToUser({
          user_id: job.userId,
          title: job.title,
          body: job.body,
          fcm_token: fcmTokens[0],
          data: cleanData,
        });
        return;
      }

      await this.firebase.sendMulticast({
        user_id: job.userId,
        title: job.title,
        body: job.body,
        fcm_tokens: fcmTokens,
        data: cleanData,
      });
    });

    await this.runChannelWithIdempotency(job, 'websocket', async () => {
      await this.realtimeBus.publish({
        userId: job.userId,
        notification: {
          id: job.notificationId,
          type: job.type,
          title: job.title,
          body: job.body,
        },
      });
    });

    if (job.sendEmail) {
      await this.runChannelWithIdempotency(job, 'email', async () => {
        const user = await this.prisma.users.findUnique({
          where: { id: job.userId },
          select: { email: true, full_name: true },
        });

        if (!user?.email) {
          return;
        }

        await this.mail.sendNotificationEmail({
          to: user.email,
          full_name: user.full_name,
          subject: job.title,
          body: job.body,
        });
      });
    }
  }

  private async runChannelWithIdempotency(
    job: NotificationDeliveryJobData,
    channel: 'push' | 'websocket' | 'email',
    execute: () => Promise<void>,
  ) {
    const key = `${job.idempotencyKey}:${channel}${IDEMPOTENCY_DONE_SUFFIX}`;
    const alreadyDone = await this.redis.cacheGet(key);

    if (alreadyDone === '1') {
      this.logger.warn(
        `Skip duplicate delivery for notification ${job.notificationId} channel=${channel}`,
      );
      return;
    }

    await execute();
    await this.redis.cacheSet(key, '1', IDEMPOTENCY_TTL_SECONDS);
  }
}
