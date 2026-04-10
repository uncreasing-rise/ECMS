import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { NotificationsController } from './notifications.controller.js';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { DeviceTokensModule } from '../../common/device-tokens/device-tokens.module';
import { NotificationQueueService } from './notification-queue.service.js';
import { NotificationsCleanupService } from './notifications-cleanup.service.js';

@Module({
  imports: [PrismaModule, DeviceTokensModule],
  providers: [NotificationsService, NotificationQueueService, NotificationsCleanupService],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
