import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { randomUUID } from 'node:crypto';
import { DeviceTokensService } from '../../common/device-tokens/device-tokens.service';
import { FirebaseService } from '../../common/firebase/firebase.service';
import { NotificationsGateway } from '../../common/websocket/notifications.gateway';

export interface CreateNotificationParams {
  user_id: string;
  type: string;
  title: string;
  body: string;
  ref_type?: string;
  ref_id?: string;
}

export interface NotificationQueryParams {
  user_id: string;
  skip?: number;
  take?: number;
  ref_type?: string;
  unread_only?: boolean;
}

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private deviceTokens: DeviceTokensService,
    private firebase: FirebaseService,
    @Optional() private notificationsGateway?: NotificationsGateway,
  ) {}

  // ─── Create Notification ──────────────────────
  async create(params: CreateNotificationParams) {
    const notification = await this.prisma.notifications.create({
      data: {
        id: randomUUID(),
        user_id: params.user_id,
        type: params.type,
        title: params.title,
        body: params.body,
        ref_type: params.ref_type,
        ref_id: params.ref_id,
        created_at: new Date(),
      },
    });

    await this.sendPushNotification(params.user_id, params.title, params.body, {
      type: params.type,
      ref_type: params.ref_type,
      ref_id: params.ref_id,
    });

    // Broadcast real-time notification via WebSocket
    if (this.notificationsGateway) {
      this.notificationsGateway.broadcastToUser(params.user_id, {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        is_read: notification.is_read,
        created_at: notification.created_at,
      });
    }

    return notification;
  }

  // ─── Send Push Notification ───────────────────
  private async sendPushNotification(
    user_id: string,
    title: string,
    body: string,
    data?: Record<string, string | null | undefined>,
  ) {
    try {
      // Get user's active FCM tokens
      const fcm_tokens = await this.deviceTokens.getActiveFCMTokens(user_id);

      if (fcm_tokens.length === 0) {
        return; // User has no registered devices
      }

      // Clean up data object to exclude null/undefined values
      const cleanData: Record<string, string> = {};
      if (data) {
        Object.entries(data).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            cleanData[key] = String(value);
          }
        });
      }

      // Send to all user's devices
      if (fcm_tokens.length === 1) {
        await this.firebase.sendToUser({
          user_id,
          title,
          body,
          fcm_token: fcm_tokens[0],
          data: cleanData,
        });
      } else {
        await this.firebase.sendMulticast({
          user_id,
          title,
          body,
          fcm_tokens,
          data: cleanData,
        });
      }
    } catch (error) {
      // Log error but don't throw - push is optional, DB notification is primary
      console.error(
        `Failed to send push notification to user ${user_id}:`,
        error,
      );
    }
  }

  // ─── Get Notifications ────────────────────────
  async getNotifications(params: NotificationQueryParams) {
    const {
      user_id,
      skip = 0,
      take = 20,
      ref_type,
      unread_only = false,
    } = params;

    const where: Prisma.notificationsWhereInput = { user_id };

    if (ref_type) {
      where.ref_type = ref_type;
    }

    if (unread_only) {
      where.is_read = false;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notifications.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take,
      }),
      this.prisma.notifications.count({ where }),
    ]);

    return {
      data: notifications,
      total,
      skip,
      take,
      hasMore: skip + take < total,
    };
  }

  // ─── Get Single Notification ──────────────────
  async getNotification(id: string, user_id: string) {
    const notification = await this.prisma.notifications.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Thông báo không tồn tại');
    }

    if (notification.user_id !== user_id) {
      throw new BadRequestException('Không có quyền truy cập');
    }

    return notification;
  }

  // ─── Mark as Read ─────────────────────────────
  async markAsRead(id: string, user_id: string) {
    const notification = await this.getNotification(id, user_id);

    if (notification.is_read) {
      return { message: 'Thông báo đã được đánh dấu đọc rồi' };
    }

    await this.prisma.notifications.update({
      where: { id },
      data: { is_read: true },
    });

    return { message: 'Đánh dấu thông báo đã đọc' };
  }

  // ─── Mark All as Read ─────────────────────────
  async markAllAsRead(user_id: string) {
    const result = await this.prisma.notifications.updateMany({
      where: { user_id, is_read: false },
      data: { is_read: true },
    });

    return {
      message: `Đánh dấu ${result.count} thông báo đã đọc`,
      count: result.count,
    };
  }

  // ─── Delete Notification ──────────────────────
  async delete(id: string, user_id: string) {
    await this.getNotification(id, user_id);

    await this.prisma.notifications.delete({
      where: { id },
    });

    return { message: 'Xóa thông báo thành công' };
  }

  // ─── Delete All Notifications ─────────────────
  async deleteAll(user_id: string) {
    const result = await this.prisma.notifications.deleteMany({
      where: { user_id },
    });

    return {
      message: `Xóa ${result.count} thông báo`,
      count: result.count,
    };
  }

  // ─── Get Unread Count ────────────────────────
  async getUnreadCount(user_id: string) {
    const count = await this.prisma.notifications.count({
      where: { user_id, is_read: false },
    });

    return { count };
  }

  // ─── Bulk Create Notifications ────────────────
  async createBulk(params: CreateNotificationParams[]) {
    if (!params.length) {
      return { count: 0 };
    }

    const settled = await Promise.allSettled(params.map((p) => this.create(p)));
    const successCount = settled.filter(
      (it) => it.status === 'fulfilled',
    ).length;

    return { count: successCount };
  }

  // ─── Delete Old Notifications (Cleanup) ───────
  async deleteOldNotifications(days: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.prisma.notifications.deleteMany({
      where: {
        created_at: {
          lt: cutoffDate,
        },
        is_read: true,
      },
    });

    return {
      message: `Xóa ${result.count} thông báo cũ`,
      count: result.count,
    };
  }
}
