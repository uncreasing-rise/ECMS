import { AppErrorCode } from '../../common/api/app-error-code.enum.js';
import { AppException } from '../../common/api/app-exception.js';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
  ParseIntPipe,
  ParseBoolPipe,
  ParseFloatPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { StudentsService } from './students.service';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { UpdateStudentStatusDto } from './dto/update-student-status.dto';
import { StudentsAnalyticsService } from './students-analytics.service';
import { StudentsAcademicService } from './students-academic.service';

@ApiTags('Students')
@Controller('students')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly studentsAnalyticsService: StudentsAnalyticsService,
    private readonly studentsAcademicService: StudentsAcademicService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Lấy hồ sơ học sinh hiện tại' })
  getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.studentsService.getMyProfile(user.id);
  }

  @Get('me/dashboard')
  @ApiOperation({ summary: 'Tổng quan học sinh' })
  getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.studentsAnalyticsService.getDashboard(user.id);
  }

  @Get('me/classes')
  @ApiOperation({ summary: 'Lấy danh sách lớp học của học sinh' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  getMyClasses(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number = 0,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take: number = 20,
  ) {
    return this.studentsService.getMyClasses({
      studentId: user.id,
      status,
      skip,
      take,
    });
  }

  @Get('me/attendance/summary')
  @ApiOperation({ summary: 'Tổng hợp điểm danh theo lớp' })
  getAttendanceSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.studentsAcademicService.getAttendanceSummary(user.id);
  }

  @Get('me/progress')
  @ApiOperation({ summary: 'FR-LMS-020: Theo dõi tiến độ học tập' })
  getMyLearningProgress(@CurrentUser() user: AuthenticatedUser) {
    return this.studentsAnalyticsService.getMyLearningProgress(user.id);
  }

  @Get('me/gradebook')
  @ApiOperation({ summary: 'FR-LMS-022: Bảng điểm học viên và so sánh lớp' })
  getMyGradeBook(@CurrentUser() user: AuthenticatedUser) {
    return this.studentsAcademicService.getStudentGradeBook(user.id);
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

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Lấy danh sách học viên' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'class_id', required: false, type: String })
  @ApiQuery({ name: 'course_id', required: false, type: String })
  @ApiQuery({ name: 'lead_only', required: false, type: Boolean })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  getStudents(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('class_id') classId?: string,
    @Query('course_id') courseId?: string,
    @Query('lead_only', new DefaultValuePipe(false), ParseBoolPipe)
    leadOnly: boolean = false,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number = 0,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take: number = 20,
  ) {
    return this.studentsService.getStudents({
      search,
      status,
      classId,
      courseId,
      leadOnly,
      skip,
      take,
    });
  }

  @Get('leads')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Lấy danh sách lead/potential students' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'class_id', required: false, type: String })
  @ApiQuery({ name: 'course_id', required: false, type: String })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  getLeads(
    @Query('search') search?: string,
    @Query('class_id') classId?: string,
    @Query('course_id') courseId?: string,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number = 0,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take: number = 20,
  ) {
    return this.studentsService.getStudents({
      search,
      classId,
      courseId,
      leadOnly: true,
      skip,
      take,
    });
  }

  @Get('id/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Lấy hồ sơ học viên đầy đủ' })
  getStudentDetail(@Param('id') id: string) {
    return this.studentsService.getStudentDetail(id);
  }

  @Get('id/:id/history')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Lấy lịch sử học tập của học viên' })
  getStudentHistory(@Param('id') id: string) {
    return this.studentsService.getStudentHistory(id);
  }

  @Patch('id/:id/classes/:classId/final-score/recalculate')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  @ApiOperation({
    summary: 'FR-LMS-021: Tính điểm tổng kết tự động theo trọng số đã cấu hình',
  })
  recalculateFinalScore(
    @Param('id') studentId: string,
    @Param('classId') classId: string,
    @Query('assignment_weight', new DefaultValuePipe(0.4), ParseFloatPipe)
    assignmentWeight: number,
    @Query('exam_weight', new DefaultValuePipe(0.5), ParseFloatPipe)
    examWeight: number,
    @Query('attendance_weight', new DefaultValuePipe(0.1), ParseFloatPipe)
    attendanceWeight: number,
  ) {
    return this.studentsAcademicService.computeAndSaveClassFinalScore({
      studentId,
      classId,
      weights: {
        assignment: assignmentWeight,
        exam: examWeight,
        attendance: attendanceWeight,
      },
    });
  }

  @Get('classes/:classId/report')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  @ApiOperation({
    summary: 'FR-LMS-023: Báo cáo học tập theo lớp và từng học viên',
  })
  getClassLearningReport(@Param('classId') classId: string) {
    return this.studentsAnalyticsService.getClassLearningReport(classId);
  }

  @Patch('id/:id/status')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Cập nhật trạng thái học viên' })
  updateStudentStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStudentStatusDto,
  ) {
    return this.studentsService.updateStudentStatus(id, dto.status);
  }
}
