import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { RedisModule } from '../../common/redis/redis.module.js';
import { MailModule } from '../../common/mail/mail.module.js';
import { FirebaseModule } from '../../common/firebase/firebase.module.js';
import { DeviceTokensModule } from '../../common/device-tokens/device-tokens.module.js';
import { NotificationDeliveryExecutor } from './notification-delivery.executor.js';
import { NotificationWorkerService } from './notification-worker.service.js';
import { NotificationRealtimeBus } from './notification-realtime.bus.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../.env', '.env'],
    }),
    PrismaModule,
    RedisModule,
    MailModule,
    FirebaseModule,
    DeviceTokensModule,
  ],
  providers: [NotificationDeliveryExecutor, NotificationWorkerService, NotificationRealtimeBus],
})
export class NotificationWorkerModule {}
