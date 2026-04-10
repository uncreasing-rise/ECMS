import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { AuditLogsModule } from '../audit-logs/audit-logs.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { InvoicesService } from './invoices.service.js';
import { InvoicesController } from './invoices.controller.js';

@Module({
  imports: [PrismaModule, AuditLogsModule, NotificationsModule],
  providers: [InvoicesService],
  controllers: [InvoicesController],
  exports: [InvoicesService],
})
export class InvoicesModule {}
