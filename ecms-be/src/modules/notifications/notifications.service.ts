import { AppErrorCode } from '../../common/api/app-error-code.enum.js';
import { AppException } from '../../common/api/app-exception.js';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { randomUUID } from 'node:crypto';
import { NotificationQueueService } from './notification-queue.service.js';
import {
  NotificationRefType,
  NotificationType,
} from './notification.constants.js';

export interface CreateNotificationParams {
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  ref_type?: NotificationRefType;
  ref_id?: string;
  send_email?: boolean;
}

export interface NotificationQueryParams {
  user_id: string;
  skip?: number;
  take?: number;
  ref_type?: NotificationRefType;
  unread_only?: boolean;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationQueue: NotificationQueueService,
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

    try {
      await this.notificationQueue.enqueue({
        notificationId: notification.id,
        userId: params.user_id,
        title: params.title,
        body: params.body,
        type: params.type,
        refType: params.ref_type,
        refId: params.ref_id,
        sendEmail: params.send_email ?? false,
        idempotencyKey: `notification:${notification.id}`,
      });
    } catch (error) {
      this.logger.error(
        `Failed to enqueue notification delivery for notification ${notification.id}`,
        error,
      );
    }

    return notification;
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
      throw new AppException({
        code: AppErrorCode.NOT_FOUND,
        errorKey: 'notification.not_found',
        message: 'Thông báo không tồn tại',
      });
    }

    if (notification.user_id !== user_id) {
      throw new AppException({
        code: AppErrorCode.BAD_REQUEST,
        errorKey: 'notification.bad_request',
        message: 'Không có quyền truy cập',
      });
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
