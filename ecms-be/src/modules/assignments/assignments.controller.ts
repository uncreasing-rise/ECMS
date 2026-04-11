import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import { AssignmentsService } from './assignments.service.js';
import { CreateAssignmentDto } from './dto/create-assignment.dto.js';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto.js';
import { GradeSubmissionDto } from './dto/grade-submission.dto.js';

@ApiTags('Assignments')
@Controller('assignments')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post('class/:classId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'FR-LMS-010: Tạo bài tập cho lớp học' })
  createAssignment(
    @Param('classId') classId: string,
    @Body() dto: CreateAssignmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assignmentsService.createAssignment(classId, dto, user.id);
  }

  @Get('class/:classId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'teacher', 'student')
  @ApiOperation({ summary: 'Lấy danh sách bài tập theo lớp học' })
  getAssignmentsByClass(
    @Param('classId') classId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const studentId = user.roles.includes('student') ? user.id : undefined;
    return this.assignmentsService.getAssignmentsByClass(classId, studentId);
  }

  @Post('items/:assignmentId/submissions')
  @UseGuards(RolesGuard)
  @Roles('student')
  @ApiOperation({ summary: 'FR-LMS-011: Học sinh nộp bài' })
  submitAssignment(
    @Param('assignmentId') assignmentId: string,
    @Body() dto: SubmitAssignmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assignmentsService.submitAssignment(assignmentId, user.id, dto);
  }

  @Get('items/:assignmentId/submissions/me')
  @UseGuards(RolesGuard)
  @Roles('student')
  @ApiOperation({ summary: 'FR-LMS-011: Xem lịch sử các lần nộp bài' })
  getMySubmissionHistory(
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assignmentsService.getMySubmissionHistory(
      assignmentId,
      user.id,
    );
  }

  @Get('items/:assignmentId/submissions')
  @UseGuards(RolesGuard)
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'GV xem danh sách bài nộp theo bài tập' })
  getSubmissionsByAssignment(@Param('assignmentId') assignmentId: string) {
    return this.assignmentsService.getSubmissionsByAssignment(assignmentId);
  }

  @Patch('submissions/:submissionId/grade')
  @UseGuards(RolesGuard)
  @Roles('admin', 'teacher')
  @ApiOperation({
    summary: 'FR-LMS-012/013/014: Chấm điểm, rubric, phản hồi và annotation',
  })
  gradeSubmission(
    @Param('submissionId') submissionId: string,
    @Body() dto: GradeSubmissionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assignmentsService.gradeSubmission(submissionId, user.id, dto);
  }

  @Get('submissions/:submissionId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'teacher', 'student')
  @ApiOperation({ summary: 'Xem chi tiết bài nộp và phản hồi' })
  getSubmissionDetail(
    @Param('submissionId') submissionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assignmentsService.getSubmissionDetail(submissionId, user);
  }
}
