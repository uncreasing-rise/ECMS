export interface NotificationDeliveryJobData {
  notificationId: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  refType?: string | null;
  refId?: string | null;
  sendEmail?: boolean;
  idempotencyKey: string;
}
