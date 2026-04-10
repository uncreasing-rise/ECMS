import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { CoursesController } from './courses.controller.js';
import { CoursesService } from './courses.service.js';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
