import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { AttendancesService } from './attendances.service.js';
import { AttendancesController } from './attendances.controller.js';

@Module({
  imports: [PrismaModule, NotificationsModule],
  providers: [AttendancesService],
  controllers: [AttendancesController],
  exports: [AttendancesService],
})
export class AttendancesModule {}
