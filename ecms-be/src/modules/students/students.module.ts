import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { StudentsAnalyticsService } from './students-analytics.service';
import { StudentsAcademicService } from './students-academic.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [StudentsController],
  providers: [
    StudentsService,
    StudentsAnalyticsService,
    StudentsAcademicService,
  ],
})
export class StudentsModule {}
