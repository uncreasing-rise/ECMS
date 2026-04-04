import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service.js';
import { DeviceTokensService } from '../../common/device-tokens/device-tokens.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly deviceTokensService: DeviceTokensService,
  ) {}

  // ─── Get Notifications ────────────────────────
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách thông báo' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Bỏ qua N thông báo' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Lấy N thông báo' })
  @ApiQuery({ name: 'ref_type', required: false, type: String, description: 'Lọc theo loại tham chiếu' })
  @ApiQuery({ name: 'unread_only', required: false, type: Boolean, description: 'Chỉ hiển thị chưa đọc' })
  getNotifications(
    @CurrentUser() user: any,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('ref_type') ref_type?: string,
    @Query('unread_only') unread_only?: string,
  ) {
    return this.notificationsService.getNotifications({
      user_id: user.id,
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 20,
      ref_type,
      unread_only: unread_only === 'true',
    });
  }

  // ─── Get Single Notification ──────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết thông báo' })
  getNotification(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.getNotification(id, user.id);
  }

  // ─── Get Unread Count ────────────────────────
  @Get('unread/count')
  @ApiOperation({ summary: 'Lấy số thông báo chưa đọc' })
  getUnreadCount(@CurrentUser() user: any) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  // ─── Mark Notification as Read ────────────────
  @Patch(':id/mark-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đánh dấu thông báo đã đọc' })
  markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  // ─── Mark All as Read ─────────────────────────
  @Patch('mark-all-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đánh dấu toàn bộ thông báo đã đọc' })
  markAllAsRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  // ─── Delete Notification ──────────────────────
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa thông báo' })
  delete(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.delete(id, user.id);
  }

  // ─── Delete All Notifications ─────────────────
  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa toàn bộ thông báo' })
  deleteAll(@CurrentUser() user: any) {
    return this.notificationsService.deleteAll(user.id);
  }

  // ──── DEVICE TOKENS ────────────────────────────

  // ─── Register/Update Device Token ─────────────
  @Post('device-tokens/register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng ký device token cho push notifications' })
  registerDeviceToken(
    @CurrentUser() user: any,
    @Body() dto: RegisterDeviceTokenDto,
  ) {
    return this.deviceTokensService.registerToken({
      user_id: user.id,
      fcm_token: dto.fcm_token,
      device_name: dto.device_name,
      platform: dto.platform,
    });
  }

  // ─── Get User's Devices ───────────────────────
  @Get('device-tokens')
  @ApiOperation({ summary: 'Lấy danh sách các devices' })
  @ApiQuery({ name: 'active_only', required: false, type: Boolean })
  getUserDevices(
    @CurrentUser() user: any,
    @Query('active_only') activeOnly?: string,
  ) {
    return this.deviceTokensService.getUserTokens(user.id, activeOnly !== 'false');
  }

  // ─── Check Device Health ──────────────────────
  @Get('device-tokens/health')
  @ApiOperation({ summary: 'Kiểm tra tình trạng devices' })
  checkDeviceHealth(@CurrentUser() user: any) {
    return this.deviceTokensService.checkTokenHealth(user.id);
  }

  // ─── Revoke Device Token ──────────────────────
  @Patch('device-tokens/:token_id/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Thu hồi device token' })
  revokeDevice(
    @CurrentUser() user: any,
    @Param('token_id') token_id: string,
  ) {
    return this.deviceTokensService.revokeToken(user.id, token_id);
  }

  // ─── Revoke All Devices ───────────────────────
  @Patch('device-tokens/revoke-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Thu hồi tất cả devices' })
  revokeAllDevices(@CurrentUser() user: any) {
    return this.deviceTokensService.revokeAllTokens(user.id);
  }
}
