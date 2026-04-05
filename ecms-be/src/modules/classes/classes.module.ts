import { Module } from '@nestjs/common';
import { ClassesController } from './classes.controller.js';
import { ClassesService } from './classes.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { ClassesCoreService } from './classes.core.service.js';
import { ClassesLifecycleService } from './services/classes-lifecycle.service.js';
import { ClassesSchedulesService } from './services/classes-schedules.service.js';
import { ClassesAssignmentsService } from './services/classes-assignments.service.js';
import { ClassesExamsService } from './services/classes-exams.service.js';
import { ClassesGradingService } from './services/classes-grading.service.js';
import {
  CLASS_NOTIFICATION_PUBLISHER,
  type ClassNotificationPublisher,
} from './contracts/class-notification.publisher.js';

@Module({
  imports: [NotificationsModule],
  controllers: [ClassesController],
  providers: [
    ClassesCoreService,
    ClassesLifecycleService,
    ClassesSchedulesService,
    ClassesAssignmentsService,
    ClassesExamsService,
    ClassesGradingService,
    {
      provide: CLASS_NOTIFICATION_PUBLISHER,
      useFactory: (
        notificationsService: NotificationsService,
      ): ClassNotificationPublisher => notificationsService,
      inject: [NotificationsService],
    },
    ClassesService,
  ],
  exports: [ClassesService],
})
export class ClassesModule {}
