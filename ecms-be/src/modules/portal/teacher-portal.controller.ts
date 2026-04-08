import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import {
  PortalService,
  type CreateLessonDto,
  type UploadClassDocumentDto,
  type CreateTeacherAssignmentDto,
  type GradeSubmissionDto,
  type CreateTeacherExamDto,
} from './portal.service.js';

@ApiTags('Teacher Portal')
@Controller('teacher-portal')
@UseGuards(AuthGuard, RolesGuard)
@Roles('teacher', 'admin')
@ApiBearerAuth()
export class TeacherPortalController {
  constructor(private readonly portalService: PortalService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'FR-POR-020: Dashboard giáo viên' })
  getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.portalService.getTeacherDashboard(user.id);
  }

  @Get('classes/:classId/management')
  @ApiOperation({ summary: 'FR-POR-021: Quản lý lớp dạy và tiến độ học sinh' })
  getClassManagement(
    @CurrentUser() user: AuthenticatedUser,
    @Param('classId') classId: string,
  ) {
    return this.portalService.getTeacherClassManagement(user.id, classId);
  }

  @Post('classes/:classId/modules/:moduleId/lessons')
  @ApiOperation({ summary: 'FR-POR-022: Soạn bài theo module' })
  createLesson(
    @CurrentUser() user: AuthenticatedUser,
    @Param('classId') classId: string,
    @Param('moduleId') moduleId: string,
    @Body() dto: CreateLessonDto,
  ) {
    return this.portalService.createLesson(user.id, classId, moduleId, dto);
  }

  @Post('classes/:classId/documents')
  @ApiOperation({ summary: 'FR-POR-022: Upload tài liệu lớp học' })
  uploadDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('classId') classId: string,
    @Body() dto: UploadClassDocumentDto,
  ) {
    return this.portalService.uploadClassDocument(user.id, classId, dto);
  }

  @Post('classes/:classId/assignments')
  @ApiOperation({ summary: 'FR-POR-023: Tạo bài tập' })
  createAssignment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('classId') classId: string,
    @Body() dto: CreateTeacherAssignmentDto,
  ) {
    return this.portalService.createTeacherAssignment(user.id, classId, dto);
  }

  @Get('submissions/pending')
  @ApiOperation({ summary: 'FR-POR-023: Danh sách bài nộp chờ chấm' })
  getPendingSubmissions(
    @CurrentUser() user: AuthenticatedUser,
    @Query('class_id') classId?: string,
  ) {
    return this.portalService.getPendingSubmissionGrading(user.id, classId);
  }

  @Patch('submissions/:submissionId/grade')
  @ApiOperation({ summary: 'FR-POR-023: Chấm bài và phản hồi' })
  gradeSubmission(
    @CurrentUser() user: AuthenticatedUser,
    @Param('submissionId') submissionId: string,
    @Body() dto: GradeSubmissionDto,
  ) {
    return this.portalService.gradeSubmission(user.id, submissionId, dto);
  }

  @Post('exams')
  @ApiOperation({ summary: 'FR-POR-024: Tạo đề thi và config bài thi' })
  createExam(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTeacherExamDto,
  ) {
    return this.portalService.createTeacherExam(user.id, dto);
  }

  @Get('classes/:classId/report')
  @ApiOperation({ summary: 'FR-POR-025: Báo cáo lớp học' })
  getClassReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('classId') classId: string,
  ) {
    return this.portalService.getTeacherClassReport(user.id, classId);
  }
}
