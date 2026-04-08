import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import { PortalService, type SendCenterMessageDto } from './portal.service.js';

@ApiTags('Parent Portal')
@Controller('parent-portal')
@UseGuards(AuthGuard, RolesGuard)
@Roles('parent', 'admin')
@ApiBearerAuth()
export class ParentPortalController {
  constructor(private readonly portalService: PortalService) {}

  @Get('children/:studentId/overview')
  @ApiOperation({
    summary: 'FR-POR-030: Theo dõi con (lịch học, chuyên cần, điểm, tiến độ)',
  })
  getChildOverview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId') studentId: string,
  ) {
    return this.portalService.getChildOverview(
      { id: user.id, roles: user.roles },
      studentId,
    );
  }

  @Get('children/:studentId/notifications')
  @ApiOperation({ summary: 'FR-POR-031: Nhận thông báo liên quan con' })
  getChildNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId') studentId: string,
  ) {
    return this.portalService.getChildNotifications(
      { id: user.id, roles: user.roles },
      studentId,
    );
  }

  @Post('contact-center')
  @ApiOperation({ summary: 'FR-POR-032: Liên hệ trung tâm/GV' })
  sendCenterMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendCenterMessageDto,
  ) {
    return this.portalService.sendCenterMessage(
      { id: user.id, roles: user.roles },
      dto,
    );
  }

  @Post('children/:studentId/invoices/:invoiceId/payment-intent')
  @ApiOperation({
    summary: 'FR-POR-033: Tạo yêu cầu thanh toán online học phí',
  })
  createPaymentIntent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId') studentId: string,
    @Param('invoiceId') invoiceId: string,
  ) {
    return this.portalService.createOnlinePaymentIntent(
      { id: user.id, roles: user.roles },
      studentId,
      invoiceId,
    );
  }
}
