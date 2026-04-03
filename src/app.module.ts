import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
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
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
