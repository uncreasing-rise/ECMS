import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import { AssignExamClassesDto } from './dto/assign-exam-classes.dto.js';
import { GenerateExamVariantsDto } from './dto/generate-exam-variants.dto.js';
import { GradeEssayAnswerDto } from './dto/grade-essay-answer.dto.js';
import { LogViolationDto } from './dto/log-violation.dto.js';
import {
  ExamsService,
  type AutoExamDto,
  type AutosaveAnswerDto,
  type ImportQuestionsDto,
  type ManualExamDto,
  type QuestionDraft,
} from './exams.service.js';

@ApiTags('Exams')
@Controller('exams')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  private resolveRole(user: AuthenticatedUser): string {
    if (user.roles.includes('admin')) return 'admin';
    if (user.roles.includes('teacher')) return 'teacher';
    return 'student';
  }

  @Post('questions')
  @UseGuards(RolesGuard)
  @Roles('admin', 'teacher')
  @ApiOperation({
    summary: 'FR-EXM-001/002: Tạo câu hỏi nhiều loại và metadata',
  })
  createQuestion(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: QuestionDraft,
  ) {
    return this.examsService.createQuestion(user.id, dto);
  }

  @Post('questions/import')
  @UseGuards(RolesGuard)
  @Roles('admin', 'teacher')
  @ApiOperation({
    summary: 'FR-EXM-003: Import câu hỏi từ Excel/Word/QTI (adapter backend)',
  })
  importQuestions(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ImportQuestionsDto,
  ) {
    return this.examsService.importQuestions(user.id, dto);
  }

  @Get('questions')
  @UseGuards(RolesGuard)
  @Roles('admin', 'teacher')
  @ApiOperation({
    summary: 'FR-EXM-005: Danh sách câu hỏi theo phân quyền sở hữu/chung',
  })
  getQuestions(
    @CurrentUser() user: AuthenticatedUser,
    @Query('search') search?: string,
    @Query('subject') subject?: string,
    @Query('chapter') chapter?: string,
    @Query('difficulty') difficulty?: string,
    @Query('bloom_level') bloomLevel?: string,
    @Query('question_format') questionFormat?: string,
    @Query('created_by') createdBy?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.examsService.getQuestions(
      { id: user.id, role: this.resolveRole(user) },
      {
        search,
        subject,
        chapter,
        difficulty,
        bloom_level: bloomLevel,
        question_format: questionFormat,
        created_by: createdBy,
        skip,
        take,
      },
    );
  }

  @Post('questions/:questionId/review')
  @UseGuards(RolesGuard)
  @Roles('teacher')
  @ApiOperation({ summary: 'FR-EXM-006: Gửi câu hỏi vào quy trình review' })
  submitQuestionForReview(
    @Param('questionId') questionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.examsService.submitQuestionForReview(questionId, user.id);
  }

  @Patch('questions/:questionId/approve')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({
    summary: 'FR-EXM-006: Phê duyệt câu hỏi vào ngân hàng chung',
  })
  approveQuestion(
    @Param('questionId') questionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.examsService.approveQuestion(questionId, user.id);
  }

  @Get('questions/:questionId/stats')
  @UseGuards(RolesGuard)
  @Roles('admin', 'teacher')
  @ApiOperation({
    summary: 'FR-EXM-004: Thống kê đúng/sai và discrimination index',
  })
  getQuestionStats(@Param('questionId') questionId: string) {
    return this.examsService.getQuestionStats(questionId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'teacher')
  @ApiOperation({
    summary: 'FR-EXM-010/014: Tạo đề thi thủ công và cấu hình thi',
  })
  createManualExam(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ManualExamDto,
  ) {
    return this.examsService.createManualExam(user.id, dto);
  }

  @Post('auto')
  @UseGuards(RolesGuard)
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'FR-EXM-011/012: Tạo đề thi tự động theo ma trận' })
  createAutoExam(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AutoExamDto,
  ) {
    return this.examsService.createAutoExam(user.id, dto);
  }

  @Post(':examId/assign')
  @UseGuards(RolesGuard)
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'FR-EXM-016: Phân công đề thi cho nhiều lớp' })
  assignExamToClasses(
    @Param('examId') examId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AssignExamClassesDto,
  ) {
    return this.examsService.assignExamToClasses(
      examId,
      dto.class_ids,
      user.id,
    );
  }

  @Get(':examId/preview')
  @UseGuards(RolesGuard)
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'FR-EXM-015: Xem trước đề thi góc nhìn học sinh' })
  previewExam(@Param('examId') examId: string) {
    return this.examsService.previewExam(examId);
  }

  @Post(':examId/variants')
  @UseGuards(RolesGuard)
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'FR-EXM-013: Trộn đề thành nhiều mã đề' })
  generateExamVariants(
    @Param('examId') examId: string,
    @Body() dto: GenerateExamVariantsDto,
  ) {
    return this.examsService.generateExamVariants(
      examId,
      Number(dto.versions ?? 4),
    );
  }

  @Post(':examId/sessions/start')
  @UseGuards(RolesGuard)
  @Roles('student')
  @ApiOperation({
    summary: 'FR-EXM-020/022/036: Bắt đầu hoặc tiếp tục phiên thi',
  })
  startOrResumeSession(
    @Param('examId') examId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.examsService.startOrResumeSession(examId, user.id, {
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Patch('sessions/:sessionId/answers')
  @UseGuards(RolesGuard)
  @Roles('student')
  @ApiOperation({ summary: 'FR-EXM-021: Auto-save tiến độ đáp án' })
  autosaveAnswer(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AutosaveAnswerDto,
  ) {
    return this.examsService.autosaveAnswer(sessionId, user.id, dto);
  }

  @Patch('sessions/:sessionId/violations')
  @UseGuards(RolesGuard)
  @Roles('student')
  @ApiOperation({
    summary: 'FR-EXM-030/031/032/033/034: Ghi log vi phạm phiên thi',
  })
  logViolation(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: LogViolationDto,
  ) {
    return this.examsService.logViolation(
      sessionId,
      user.id,
      dto.type,
      dto.meta,
    );
  }

  @Post('sessions/:sessionId/submit')
  @UseGuards(RolesGuard)
  @Roles('student')
  @ApiOperation({
    summary: 'FR-EXM-023/040: Nộp bài và chấm tự động phần trắc nghiệm',
  })
  submitSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.examsService.submitSession(sessionId, user.id);
  }

  @Patch('sessions/:sessionId/questions/:questionId/grade')
  @UseGuards(RolesGuard)
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'FR-EXM-041: Chấm tự luận thủ công' })
  gradeEssayAnswer(
    @Param('sessionId') sessionId: string,
    @Param('questionId') questionId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: GradeEssayAnswerDto,
  ) {
    return this.examsService.gradeEssayAnswer(
      sessionId,
      questionId,
      user.id,
      dto,
    );
  }

  @Get('sessions/:sessionId/result')
  @UseGuards(RolesGuard)
  @Roles('admin', 'teacher', 'student')
  @ApiOperation({
    summary: 'FR-EXM-042: Hiển thị kết quả theo cấu hình đề thi',
  })
  getSessionResult(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.examsService.getSessionResult(sessionId, {
      id: user.id,
      role: this.resolveRole(user),
    });
  }

  @Get(':examId/violations/report')
  @UseGuards(RolesGuard)
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'FR-EXM-035: Báo cáo vi phạm theo đề thi' })
  getViolationReport(@Param('examId') examId: string) {
    return this.examsService.getViolationReport(examId);
  }
}
