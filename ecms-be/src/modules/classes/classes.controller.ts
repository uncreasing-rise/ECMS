import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
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
import { ClassesService } from './classes.service.js';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { CreateClassScheduleDto } from './dto/create-class-schedule.dto';
import { UpdateClassScheduleDto } from './dto/update-class-schedule.dto';
import { EnrollStudentDto } from './dto/enroll-student.dto';
import { CreateClassResourceDto } from './dto/create-class-resource.dto';
import { ClassCreateAssignmentDto } from './dto/create-assignment.dto';
import { ClassRecordAttendanceDto } from './dto/record-attendance.dto';
import { CreateClassTestDto } from './dto/create-class-test.dto';
import { ClassSubmitAssignmentDto } from './dto/submit-assignment.dto';
import { ClassGradeSubmissionDto } from './dto/grade-submission.dto';
import { StartExamAttemptDto } from './dto/start-exam-attempt.dto';
import { UpsertExamAnswerDto } from './dto/upsert-exam-answer.dto';
import { SubmitExamAttemptDto } from './dto/submit-exam-attempt.dto';
import { CreateBlueprintTemplateDto } from './dto/create-blueprint-template.dto';
import { UpdateBlueprintTemplateDto } from './dto/update-blueprint-template.dto';
import { CreateBlueprintSectionDto } from './dto/create-blueprint-section.dto';
import { UpdateBlueprintSectionDto } from './dto/update-blueprint-section.dto';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { OptionalDatePipe } from '../../common/pipes/date-query.pipe.js';

@ApiTags('Classes')
@Controller('classes')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo lớp học mới (admin/teacher)' })
  createClass(
    @Body() dto: CreateClassDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.classesService.createClass(dto, user.id);
  }

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Lấy danh sách lớp học' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'course_id', required: false, type: String })
  @ApiQuery({ name: 'teacher_id', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  getClasses(
    @CurrentUser() user: AuthenticatedUser,
    @Query('search') search?: string,
    @Query('course_id') courseId?: string,
    @Query('teacher_id') teacherId?: string,
    @Query('status') status?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.classesService.getClasses({
      actorId: user.id,
      search,
      courseId,
      teacherId,
      status,
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 20,
    });
  }

  @Get('me')
  @ApiOperation({
    summary: 'Lấy các lớp liên quan user hiện tại (học hoặc dạy)',
  })
  getMyClasses(@CurrentUser() user: AuthenticatedUser) {
    return this.classesService.getMyClasses(user.id);
  }

  @Get('blueprint-templates')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin lấy danh sách blueprint templates' })
  @ApiQuery({ name: 'include_inactive', required: false, type: Boolean })
  getBlueprintTemplates(@Query('include_inactive') includeInactive?: string) {
    return this.classesService.getBlueprintTemplates(
      includeInactive === 'true',
    );
  }

  @Get('blueprint-templates/:templateId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin lấy chi tiết 1 blueprint template' })
  getBlueprintTemplateById(@Param('templateId') templateId: string) {
    return this.classesService.getBlueprintTemplateById(templateId);
  }

  @Post('blueprint-templates')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Admin tạo blueprint template + sections' })
  createBlueprintTemplate(
    @Body() dto: CreateBlueprintTemplateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.classesService.createBlueprintTemplate(dto, user.id);
  }

  @Patch('blueprint-templates/:templateId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin cập nhật blueprint template' })
  updateBlueprintTemplate(
    @Param('templateId') templateId: string,
    @Body() dto: UpdateBlueprintTemplateDto,
  ) {
    return this.classesService.updateBlueprintTemplate(templateId, dto);
  }

  @Delete('blueprint-templates/:templateId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin tắt blueprint template (soft delete)' })
  deleteBlueprintTemplate(@Param('templateId') templateId: string) {
    return this.classesService.deleteBlueprintTemplate(templateId);
  }

  @Post('blueprint-templates/:templateId/sections')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Admin thêm section vào blueprint template' })
  createBlueprintSection(
    @Param('templateId') templateId: string,
    @Body() dto: CreateBlueprintSectionDto,
  ) {
    return this.classesService.createBlueprintSection(templateId, dto);
  }

  @Patch('blueprint-templates/:templateId/sections/:sectionId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin cập nhật section của blueprint template' })
  updateBlueprintSection(
    @Param('templateId') templateId: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: UpdateBlueprintSectionDto,
  ) {
    return this.classesService.updateBlueprintSection(
      templateId,
      sectionId,
      dto,
    );
  }

  @Delete('blueprint-templates/:templateId/sections/:sectionId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin xóa section khỏi blueprint template' })
  deleteBlueprintSection(
    @Param('templateId') templateId: string,
    @Param('sectionId') sectionId: string,
  ) {
    return this.classesService.deleteBlueprintSection(templateId, sectionId);
  }

  @Get('class/:id')
  @ApiOperation({ summary: 'Lấy chi tiết lớp học' })
  getClassById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.classesService.getClassById(id, user.id);
  }

  @Get('class/:id/students')
  @ApiOperation({ summary: 'Lấy danh sách học viên của lớp' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  getClassStudents(
    @Param('id') classId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.classesService.getClassStudents({
      classId,
      actorId: user.id,
      status,
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 20,
    });
  }

  @Get('class/:id/resources')
  @ApiOperation({ summary: 'Lấy tài nguyên lớp học' })
  getClassResources(
    @Param('id') classId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.classesService.getClassResources(classId, user.id);
  }

  @Post('class/:id/resources')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo tài nguyên cho lớp (admin/teacher)' })
  createClassResource(
    @Param('id') classId: string,
    @Body() dto: CreateClassResourceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.classesService.createClassResource(classId, dto, user.id);
  }

  @Get('class/:id/assignments')
  @ApiOperation({ summary: 'Lấy danh sách assignment của lớp' })
  getClassAssignments(
    @Param('id') classId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.classesService.getClassAssignments(classId, user.id);
  }

  @Post('class/:id/assignments')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo assignment cho lớp (admin/teacher)' })
  createAssignment(
    @Param('id') classId: string,
    @Body() dto: ClassCreateAssignmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.classesService.createAssignment(classId, dto, user.id);
  }

  @Get('class/:id/assignments/:assignmentId/submissions')
  @ApiOperation({ summary: 'Lấy danh sách bài nộp assignment' })
  getAssignmentSubmissions(
    @Param('id') classId: string,
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.classesService.getAssignmentSubmissions(
      classId,
      assignmentId,
      user.id,
    );
  }

  @Post('class/:id/assignments/:assignmentId/submissions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Học viên nộp bài assignment' })
  submitAssignment(
    @Param('id') classId: string,
    @Param('assignmentId') assignmentId: string,
    @Body() dto: ClassSubmitAssignmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.classesService.submitAssignment(
      classId,
      assignmentId,
      dto,
      user.id,
    );
  }

  @Patch('class/:id/assignments/:assignmentId/submissions/:submissionId/grade')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Chấm điểm bài nộp assignment (admin/teacher)' })
  gradeAssignmentSubmission(
    @Param('id') classId: string,
    @Param('assignmentId') assignmentId: string,
    @Param('submissionId') submissionId: string,
    @Body() dto: ClassGradeSubmissionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.classesService.gradeAssignmentSubmission(
      classId,
      assignmentId,
      submissionId,
      dto,
      user.id,
    );
  }

  @Get('class/:id/schedules')
  @ApiOperation({ summary: 'Lấy lịch học của lớp' })
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    description: 'ISO date-time',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    type: String,
    description: 'ISO date-time',
  })
  getClassSchedules(
    @Param('id') classId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('from', new OptionalDatePipe('from')) from?: Date,
    @Query('to', new OptionalDatePipe('to')) to?: Date,
  ) {
    return this.classesService.getClassSchedules(classId, user.id, from, to);
  }

  @Get('class/:id/schedules/:scheduleId/attendance')
  @ApiOperation({ summary: 'Lấy điểm danh theo slot học' })
  getScheduleAttendance(
    @Param('id') classId: string,
    @Param('scheduleId') scheduleId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.classesService.getScheduleAttendance(
      classId,
      scheduleId,
      user.id,
    );
  }

  @Post('class/:id/schedules/:scheduleId/attendance')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Điểm danh theo slot học (admin/teacher)' })
  recordScheduleAttendance(
    @Param('id') classId: string,
    @Param('scheduleId') scheduleId: string,
    @Body() dto: ClassRecordAttendanceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.classesService.recordScheduleAttendance(
      classId,
      scheduleId,
      dto,
      user.id,
    );
  }

  @Post('class/:id/schedules')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo lịch học cho lớp (admin/teacher)' })
  createClassSchedule(
    @Param('id') classId: string,
    @Body() dto: CreateClassScheduleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.classesService.createClassSchedule(classId, dto, user.id);
  }

  @Patch('class/:id/schedules/:scheduleId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật lịch học (admin/teacher)' })
  updateClassSchedule(
    @Param('id') classId: string,
    @Param('scheduleId') scheduleId: string,
    @Body() dto: UpdateClassScheduleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.classesService.updateClassSchedule(
      classId,
      scheduleId,
      dto,
      user.id,
    );
  }

  @Delete('class/:id/schedules/:scheduleId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa lịch học (admin/teacher)' })
  deleteClassSchedule(
    @Param('id') classId: string,
    @Param('scheduleId') scheduleId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.classesService.deleteClassSchedule(
      classId,
      scheduleId,
      user.id,
    );
  }

  @Get('calendar')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Calendar view lịch học theo tuần/tháng' })
  @ApiQuery({ name: 'view', required: false, type: String })
  @ApiQuery({ name: 'date', required: false, type: String })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'class_id', required: false, type: String })
  @ApiQuery({ name: 'teacher_id', required: false, type: String })
  @ApiQuery({ name: 'room_id', required: false, type: String })
  getCalendar(
    @CurrentUser() user: AuthenticatedUser,
    @Query('view') view?: 'week' | 'month',
    @Query('date', new OptionalDatePipe('date')) date?: Date,
    @Query('from', new OptionalDatePipe('from')) from?: Date,
    @Query('to', new OptionalDatePipe('to')) to?: Date,
    @Query('class_id') classId?: string,
    @Query('teacher_id') teacherId?: string,
    @Query('room_id') roomId?: string,
  ) {
    return this.classesService.getClassCalendar({
      actorId: user.id,
      view,
      date,
      from,
      to,
      classId,
      teacherId,
      roomId,
    });
  }

  @Post('class/:id/enrollments')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enroll học viên vào lớp (admin/teacher)' })
  enrollStudent(@Param('id') classId: string, @Body() dto: EnrollStudentDto) {
    return this.classesService.enrollStudent(classId, dto);
  }

  @Get('class/:id/tests')
  @ApiOperation({ summary: 'Lấy danh sách bài kiểm tra của lớp' })
  getClassTests(
    @Param('id') classId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.classesService.getClassTests(classId, user.id);
  }

  @Post('class/:id/tests')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Tạo bài kiểm tra tiếng Anh nhiều dạng câu hỏi (admin/teacher)',
  })
  createClassTest(
    @Param('id') classId: string,
    @Body() dto: CreateClassTestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.classesService.createClassTest(classId, dto, user.id);
  }

  @Get('class/:id/tests/:examId/my-attempts')
  @ApiOperation({ summary: 'Lấy danh sách attempt của học viên hiện tại' })
  getMyExamAttempts(
    @Param('id') classId: string,
    @Param('examId') examId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.classesService.getMyExamAttempts(classId, examId, user.id);
  }

  @Post('class/:id/tests/:examId/attempts/start')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Bắt đầu 1 attempt làm bài thi' })
  startExamAttempt(
    @Param('id') classId: string,
    @Param('examId') examId: string,
    @Body() dto: StartExamAttemptDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.classesService.startExamAttempt(classId, examId, user.id, dto);
  }

  @Post('class/:id/tests/:examId/attempts/:sessionId/answers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lưu câu trả lời trong attempt' })
  upsertExamAnswers(
    @Param('id') classId: string,
    @Param('examId') examId: string,
    @Param('sessionId') sessionId: string,
    @Body() dto: UpsertExamAnswerDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.classesService.upsertExamAnswers(
      classId,
      examId,
      sessionId,
      user.id,
      dto,
    );
  }

  @Post('class/:id/tests/:examId/attempts/:sessionId/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Nộp bài thi và auto chấm' })
  submitExamAttempt(
    @Param('id') classId: string,
    @Param('examId') examId: string,
    @Param('sessionId') sessionId: string,
    @Body() dto: SubmitExamAttemptDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.classesService.submitExamAttempt(
      classId,
      examId,
      sessionId,
      user.id,
      dto,
    );
  }

  @Get('class/:id/tests/:examId/attempts/:sessionId')
  @ApiOperation({ summary: 'Lấy chi tiết attempt + answers + điểm' })
  getExamAttemptDetail(
    @Param('id') classId: string,
    @Param('examId') examId: string,
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.classesService.getExamAttemptDetail(
      classId,
      examId,
      sessionId,
      user.id,
    );
  }

  @Delete('class/:id/enrollments/:studentId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unenroll học viên khỏi lớp (admin/teacher)' })
  unenrollStudent(
    @Param('id') classId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.classesService.unenrollStudent(classId, studentId);
  }

  @Patch('class/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'teacher')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật lớp học (admin/teacher)' })
  updateClass(
    @Param('id') classId: string,
    @Body() dto: UpdateClassDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.classesService.updateClass(classId, dto, user.id);
  }

  @Delete('class/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa lớp học (admin)' })
  deleteClass(@Param('id') classId: string) {
    return this.classesService.deleteClass(classId);
  }
}
