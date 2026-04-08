import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import {
  ensureStudentSelfAccess,
} from '../../common/helpers/request-validation.helper.js';
import { OptionalDatePipe, RequiredDatePipe } from '../../common/pipes/date-query.pipe.js';
import { AttendancesService } from './attendances.service.js';
import { AcceptMakeupSessionDto } from './dto/accept-makeup-session.dto.js';
import { RecordAttendanceDto } from './dto/record-attendance.dto.js';

/**
 * FR-ECM-040: Per-session attendance recording
 * FR-ECM-041: Attendance reporting (by student/class/period)
 * FR-ECM-042: Consecutive absence alerts
 * FR-ECM-043: Makeup session tracking
 */
@Controller('attendances')
@UseGuards(AuthGuard)
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  /**
   * FR-ECM-040: Record attendance for a student in a session
   * POST /attendances/record
   */
  @Post('record')
  @UseGuards(RolesGuard)
  @Roles('admin', 'teacher')
  async recordAttendance(
    @Body() dto: RecordAttendanceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attendancesService.recordAttendance(dto, user.id);
  }

  /**
   * FR-ECM-041: Get attendance report for a student
   * GET /attendances/student/:studentId/report
   * Query: ?class_id=xxx&from_date=2024-01-01&to_date=2024-12-31
   */
  @Get('student/:studentId/report')
  @UseGuards(RolesGuard)
  @Roles('admin', 'teacher', 'student')
  async getStudentAttendanceReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId') studentId: string,
    @Query('class_id') classId: string = '',
    @Query('from_date', new OptionalDatePipe('from_date'))
    fromDate?: Date,
    @Query('to_date', new OptionalDatePipe('to_date'))
    toDate?: Date,
  ) {
    ensureStudentSelfAccess(
      user,
      studentId,
      'Bạn chỉ có thể xem báo cáo của chính mình',
    );

    return this.attendancesService.getStudentAttendanceReport({
      student_id: studentId,
      class_id: classId || undefined,
      from_date: fromDate,
      to_date: toDate,
    });
  }

  /**
   * FR-ECM-041: Get attendance report for a class
   * GET /attendances/class/:classId/report
   * Query: ?from_date=2024-01-01&to_date=2024-12-31
   */
  @Get('class/:classId/report')
  @UseGuards(RolesGuard)
  @Roles('admin', 'teacher')
  async getClassAttendanceReport(
    @Param('classId') classId: string,
    @Query('from_date', new OptionalDatePipe('from_date')) fromDate?: Date,
    @Query('to_date', new OptionalDatePipe('to_date')) toDate?: Date,
  ) {
    return this.attendancesService.getClassAttendanceReport({
      class_id: classId,
      from_date: fromDate,
      to_date: toDate,
    });
  }

  /**
   * FR-ECM-041: Get attendance report by period
   * GET /attendances/report/period
   * Query: ?from_date=2024-01-01&to_date=2024-12-31&class_id=xxx&student_id=xxx
   */
  @Get('report/period')
  @UseGuards(RolesGuard)
  @Roles('admin', 'teacher')
  async getAttendanceReportByPeriod(
    @Query('from_date', new RequiredDatePipe('from_date'))
    fromDate: Date,
    @Query('to_date', new RequiredDatePipe('to_date')) toDate: Date,
    @Query('class_id') classId?: string,
    @Query('student_id') studentId?: string,
  ) {
    return this.attendancesService.getAttendanceReportByPeriod({
      from_date: fromDate,
      to_date: toDate,
      class_id: classId,
      student_id: studentId,
    });
  }

  /**
   * FR-ECM-042: Get consecutive absence count for a student
   * GET /attendances/student/:studentId/absence-streak
   * Query: ?class_id=xxx
   */
  @Get('student/:studentId/absence-streak')
  @UseGuards(RolesGuard)
  @Roles('admin', 'teacher')
  async getConsecutiveAbsenceCount(
    @Param('studentId') studentId: string,
    @Query('class_id') classId: string,
  ) {
    if (!classId) {
      throw new BadRequestException('class_id là bắt buộc');
    }

    const count = await this.attendancesService.getConsecutiveAbsenceCount(
      studentId,
      classId,
    );

    return {
      student_id: studentId,
      class_id: classId,
      consecutive_absences: count,
      alert_threshold: 3,
      is_alerted: count >= 3,
    };
  }

  /**
   * FR-ECM-043: Accept makeup session for a student
   * POST /attendances/makeup-sessions/accept
   */
  @Post('makeup-sessions/accept')
  @UseGuards(RolesGuard)
  @Roles('admin', 'teacher', 'student')
  async acceptMakeupSession(
    @Body() body: AcceptMakeupSessionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    ensureStudentSelfAccess(
      user,
      body.student_id,
      'Bạn chỉ có thể đăng ký bù giờ cho chính mình',
    );

    return this.attendancesService.acceptMakeupSession(
      body.student_id,
      body.original_session_id,
      body.makeup_session_id,
    );
  }

  /**
   * FR-ECM-043: Get makeup sessions for a student
   * GET /attendances/student/:studentId/makeup-sessions
   */
  @Get('student/:studentId/makeup-sessions')
  @UseGuards(RolesGuard)
  @Roles('admin', 'teacher', 'student')
  async getStudentMakeupSessions(
    @Param('studentId') studentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    ensureStudentSelfAccess(
      user,
      studentId,
      'Bạn chỉ có thể xem danh sách bù giờ của chính mình',
    );

    return this.attendancesService.getStudentMakeupSessions(studentId);
  }
}
