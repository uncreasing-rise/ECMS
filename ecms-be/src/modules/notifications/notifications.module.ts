import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { NotificationsController } from './notifications.controller.js';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { DeviceTokensModule } from '../../common/device-tokens/device-tokens.module';
import { FirebaseModule } from '../../common/firebase/firebase.module';
import { WebSocketModule } from '../../common/websocket/websocket.module';

@Module({
  imports: [PrismaModule, DeviceTokensModule, FirebaseModule, WebSocketModule],
  providers: [NotificationsService],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
