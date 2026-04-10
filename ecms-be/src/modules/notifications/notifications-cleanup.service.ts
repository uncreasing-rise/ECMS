import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service.js';

@Injectable()
export class NotificationsCleanupService {
  private readonly logger = new Logger(NotificationsCleanupService.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Cron('0 30 2 * * *')
  async cleanupOldNotifications() {
    const result = await this.notificationsService.deleteOldNotifications(30);
    this.logger.log(`Notification cleanup completed. deleted=${result.count}`);
  }
}
