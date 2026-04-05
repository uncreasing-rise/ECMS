import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { StudentsService } from './students.service';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@ApiTags('Students')
@Controller('students')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Lấy hồ sơ học sinh hiện tại' })
  getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.studentsService.getMyProfile(user.id);
  }

  @Get('me/dashboard')
  @ApiOperation({ summary: 'Tổng quan học sinh' })
  getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.studentsService.getDashboard(user.id);
  }

  @Get('me/classes')
  @ApiOperation({ summary: 'Lấy danh sách lớp học của học sinh' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  getMyClasses(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.studentsService.getMyClasses({
      studentId: user.id,
      status,
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 20,
    });
  }

  @Get('me/attendance/summary')
  @ApiOperation({ summary: 'Tổng hợp điểm danh theo lớp' })
  getAttendanceSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.studentsService.getAttendanceSummary(user.id);
  }

  @Get('me/grades')
  @ApiOperation({ summary: 'Bảng điểm của học sinh' })
  getMyGrades(@CurrentUser() user: AuthenticatedUser) {
    return this.studentsService.getMyGrades(user.id);
  }

  @Get('me/invoices')
  @ApiOperation({ summary: 'Danh sách học phí/hóa đơn của học sinh' })
  @ApiQuery({ name: 'status', required: false, type: String })
  getMyInvoices(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
  ) {
    return this.studentsService.getMyInvoices(user.id, status);
  }
}
