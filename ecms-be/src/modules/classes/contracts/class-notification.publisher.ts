import {
  NotificationRefType,
  NotificationType,
} from '../../notifications/notification.constants.js';

export interface CreateClassNotificationParams {
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  ref_type?: NotificationRefType;
  ref_id?: string;
}

export interface ClassNotificationPublisher {
  create(
    params: CreateClassNotificationParams,
  ): Promise<{ id?: string; [key: string]: unknown }>;
  createBulk(
    params: CreateClassNotificationParams[],
  ): Promise<{ count: number }>;
}

export const CLASS_NOTIFICATION_PUBLISHER = Symbol(
  'CLASS_NOTIFICATION_PUBLISHER',
);
