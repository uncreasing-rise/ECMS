import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BranchesModule } from './branches/branches.module';
import { CoursesModule } from './courses/courses.module';
import { ClassesModule } from './classes/classes.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { FinanceModule } from './finance/finance.module';
import { RolesModule } from './roles/roles.module';
import { SessionsModule } from './sessions/sessions.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { LeadsModule } from './leads/leads.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { AppThrottlerGuard } from './common/guards/app-throttler.guard';
import { ReadCacheInterceptor } from './common/interceptors/read-cache.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isLoadTestMode = configService.get<string>('LOAD_TEST_MODE', 'false') === 'true';
        const redisEnabled = configService.get<string>('REDIS_ENABLED', 'false') === 'true';
        const redisHost = configService.get<string>('REDIS_HOST', '127.0.0.1');
        const redisPort = Number(configService.get<string>('REDIS_PORT', '6379'));
        const redisPassword = configService.get<string>('REDIS_PASSWORD');
        const ttlMs = Number(configService.get<string>('THROTTLE_TTL_MS', '60000'));
        const limit = Number(configService.get<string>('THROTTLE_LIMIT', isLoadTestMode ? '50000' : '300'));

        const throttlerOptions = {
          throttlers: [
            {
              name: 'default',
              ttl: ttlMs,
              limit,
            },
          ],
        };

        if (!redisEnabled) {
          return throttlerOptions;
        }

        return {
          ...throttlerOptions,
          storage: new ThrottlerStorageRedisService({
            host: redisHost,
            port: redisPort,
            password: redisPassword,
            db: Number(configService.get<string>('REDIS_DB', '0')),
          }),
        };
      },
    }),
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
    PrismaModule,
    InfrastructureModule,
    AuthModule,
    UsersModule,
    RolesModule,
    SessionsModule,
    AuditLogsModule,
    BranchesModule,
    CoursesModule,
    ClassesModule,
    EnrollmentsModule,
    FinanceModule,
    LeadsModule,
    // TODO: Add remaining modules
    // - ExamsModule
    // - AttendanceModule
    // - PayrollModule
    // - NotificationsModule
    // - GradesModule
    // - AssignmentsModule
    // - ResourcesModule
    // - GuardiansModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ReadCacheInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
  ],
})
export class AppModule {}
