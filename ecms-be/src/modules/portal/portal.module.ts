import { Module } from '@nestjs/common';
import { RedisModule } from '../../common/redis/redis.module.js';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { PortalService } from './portal.service.js';
import { TeacherPortalController } from './teacher-portal.controller.js';
import { ParentPortalController } from './parent-portal.controller.js';

@Module({
  imports: [PrismaModule, RedisModule, NotificationsModule],
  providers: [PortalService],
  controllers: [TeacherPortalController, ParentPortalController],
  exports: [PortalService],
})
export class PortalModule {}
