import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationRealtimeBus } from '../../modules/notifications/notification-realtime.bus.js';

@Module({
  imports: [JwtModule.register({})],
  providers: [NotificationsGateway, NotificationRealtimeBus],
  exports: [NotificationsGateway],
})
export class WebSocketModule {}
