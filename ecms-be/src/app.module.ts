import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { MailModule } from './common/mail/mail.module';
import { FirebaseModule } from './common/firebase/firebase.module';
import { WebSocketModule } from './common/websocket/websocket.module';
import { DeviceTokensModule } from './common/device-tokens/device-tokens.module';
import { AuthModule } from './modules/auth/auth.module';
import { CoursesModule } from './modules/courses/courses.module';
import { ClassesModule } from './modules/classes/classes.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { StudentsModule } from './modules/students/students.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { AttendancesModule } from './modules/attendances/attendances.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { ExamsModule } from './modules/exams/exams.module';
import { PortalModule } from './modules/portal/portal.module';
import { ChatModule } from './modules/chat/chat.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../.env', '.env'],
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        return {
          throttlers: [{ ttl: 10000, limit: 100 }],
          storage: redisUrl ? new ThrottlerStorageRedisService(redisUrl) : undefined,
        };
      },
    }),
    PrismaModule,
    RedisModule,
    MailModule,
    FirebaseModule,
    WebSocketModule,
    DeviceTokensModule,
    AuthModule,
    CoursesModule,
    ClassesModule,
    NotificationsModule,
    StudentsModule,
    InvoicesModule,
    AuditLogsModule,
    AttendancesModule,
    AssignmentsModule,
    ExamsModule,
    PortalModule,
    ChatModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
