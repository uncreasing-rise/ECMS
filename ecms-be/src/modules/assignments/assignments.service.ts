import { AppErrorCode } from '../../common/api/app-error-code.enum.js';
import { AppException } from '../../common/api/app-exception.js';
import { Injectable } from '@nestjs/common';
import { Prisma, submissions } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { RedisService } from '../../common/redis/redis.service';
import { NotificationsService } from '../notifications/notifications.service.js';
import {
  NotificationRefType,
  NotificationType,
} from '../notifications/notification.constants.js';
import {
  CreateAssignmentDto,
  RubricCriterionDto,
} from './dto/create-assignment.dto.js';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto.js';
import { GradeSubmissionDto } from './dto/grade-submission.dto.js';

type AssignmentMetadata = {
  description?: string;
  submission_instructions?: string;
  attachment_urls?: string[];
  rubric?: RubricCriterionDto[];
};

type SubmissionContent = {
  submission_text?: string;
  submission_link?: string;
  files?: string[];
};

type FeedbackPayload = {
  feedback?: string;
  rubric_scores?: GradeSubmissionDto['rubric_scores'];
  annotations?: GradeSubmissionDto['annotations'];
};

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createAssignment(
    classId: string,
    dto: CreateAssignmentDto,
    teacherId: string,
  ) {
    const classInfo = await this.prisma.classes.findUnique({
      where: { id: classId },
      select: { id: true, name: true, teacher_id: true },
    });

    if (!classInfo) {
      throw new AppException({
        code: AppErrorCode.NOT_FOUND,
        errorKey: 'assignment.not_found',
        message: 'Không tìm thấy lớp học',
      });
    }

    const metadata: AssignmentMetadata = {
      description: dto.description,
      submission_instructions: dto.submission_instructions,
      attachment_urls: dto.attachment_urls,
      rubric: dto.rubric,
    };

    const assignment = await this.prisma.assignments.create({
      data: {
        id: randomUUID(),
        class_id: classId,
        created_by: teacherId,
        title: dto.title,
        description: JSON.stringify(metadata),
        due_at: new Date(dto.due_at),
        max_score: dto.max_score,
        allow_resubmit: dto.allow_resubmit ?? false,
        created_at: new Date(),
      },
      select: {
        id: true,
        class_id: true,
        title: true,
        due_at: true,
        max_score: true,
        allow_resubmit: true,
        created_at: true,
      },
    });

    const enrolledStudents = await this.prisma.enrollments.findMany({
      where: { class_id: classId, status: 'active' },
      select: { student_id: true },
    });

    await Promise.all(
      enrolledStudents.map((student) =>
        this.notificationsService.create({
          user_id: student.student_id,
          type: NotificationType.ASSIGNMENT_CREATED,
          title: 'Bài tập mới',
          body: `Lớp ${classInfo.name ?? ''} vừa có bài tập mới: ${dto.title}`,
          ref_type: NotificationRefType.ASSIGNMENT,
          ref_id: assignment.id,
        }),
      ),
    );

    return {
      ...assignment,
      details: metadata,
    };
  }

  async getAssignmentsByClass(classId: string, studentId?: string) {
    const assignments = await this.prisma.assignments.findMany({
      where: { class_id: classId },
      orderBy: { created_at: 'desc' },
      include: {
        submissions: studentId
          ? {
              where: { student_id: studentId },
              orderBy: { submitted_at: 'desc' },
              take: 1,
              select: {
                id: true,
                submitted_at: true,
                score: true,
                graded_at: true,
              },
            }
          : false,
      },
    });

    return assignments.map((assignment) => {
      const details = this.parseAssignmentMetadata(assignment.description);
      return {
        id: assignment.id,
        class_id: assignment.class_id,
        title: assignment.title,
        due_at: assignment.due_at,
        max_score: assignment.max_score,
        allow_resubmit: assignment.allow_resubmit,
        created_at: assignment.created_at,
        details,
        my_latest_submission: studentId
          ? (assignment.submissions[0] ?? null)
          : undefined,
      };
    });
  }

  async submitAssignment(
    assignmentId: string,
    studentId: string,
    dto: SubmitAssignmentDto,
  ) {
    if (
      !dto.submission_text &&
      !dto.submission_link &&
      (!dto.files || dto.files.length === 0)
    ) {
      throw new AppException({
        code: AppErrorCode.BAD_REQUEST,
        errorKey: 'assignment.bad_request',
        message: 'Cần ít nhất một dạng nộp bài: text, link hoặc file',
      });
    }

    const assignment = await this.prisma.assignments.findUnique({
      where: { id: assignmentId },
      select: {
        id: true,
        class_id: true,
        due_at: true,
        allow_resubmit: true,
        title: true,
      },
    });

    if (!assignment) {
      throw new AppException({
        code: AppErrorCode.NOT_FOUND,
        errorKey: 'assignment.not_found',
        message: 'Không tìm thấy bài tập',
      });
    }

    if (assignment.due_at && assignment.due_at.getTime() < Date.now()) {
      throw new AppException({
        code: AppErrorCode.BAD_REQUEST,
        errorKey: 'assignment.bad_request',
        message: 'Đã quá hạn nộp bài',
      });
    }

    const enrollment = await this.prisma.enrollments.findFirst({
      where: {
        class_id: assignment.class_id,
        student_id: studentId,
        status: 'active',
      },
      select: { id: true },
    });

    if (!enrollment) {
      throw new AppException({
        code: AppErrorCode.BAD_REQUEST,
        errorKey: 'assignment.bad_request',
        message: 'Bạn không thuộc lớp học của bài tập này',
      });
    }

    const latestSubmission = await this.prisma.submissions.findFirst({
      where: {
        assignment_id: assignmentId,
        student_id: studentId,
      },
      orderBy: { submitted_at: 'desc' },
      select: { id: true },
    });

    if (latestSubmission && !assignment.allow_resubmit) {
      throw new AppException({
        code: AppErrorCode.BAD_REQUEST,
        errorKey: 'assignment.bad_request',
        message: 'Bài tập này không cho phép nộp lại',
      });
    }

    const contentPayload: SubmissionContent = {
      submission_text: dto.submission_text,
      submission_link: dto.submission_link,
      files: dto.files,
    };

    const submission = await this.prisma.submissions.create({
      data: {
        id: randomUUID(),
        assignment_id: assignmentId,
        student_id: studentId,
        content: JSON.stringify(contentPayload),
        file_url: dto.files?.[0],
        submitted_at: new Date(),
      },
      select: {
        id: true,
        assignment_id: true,
        student_id: true,
        content: true,
        submitted_at: true,
      },
    });

    await this.invalidateTeacherDashboardByClass(assignment.class_id);

    return {
      ...submission,
      content: contentPayload,
    };
  }

  async getMySubmissionHistory(assignmentId: string, studentId: string) {
    const submissions = await this.prisma.submissions.findMany({
      where: {
        assignment_id: assignmentId,
        student_id: studentId,
      },
      orderBy: { submitted_at: 'desc' },
    });

    return {
      assignment_id: assignmentId,
      student_id: studentId,
      total_attempts: submissions.length,
      attempts: submissions.map((item) => this.toSubmissionResponse(item)),
    };
  }

  async getSubmissionsByAssignment(assignmentId: string) {
    const assignment = await this.prisma.assignments.findUnique({
      where: { id: assignmentId },
      select: { id: true, title: true, class_id: true },
    });

    if (!assignment) {
      throw new AppException({
        code: AppErrorCode.NOT_FOUND,
        errorKey: 'assignment.not_found',
        message: 'Không tìm thấy bài tập',
      });
    }

    const submissions = await this.prisma.submissions.findMany({
      where: { assignment_id: assignmentId },
      orderBy: { submitted_at: 'desc' },
      include: {
        users_submissions_student_idTousers: {
          select: { id: true, full_name: true, email: true },
        },
      },
    });

    return {
      assignment,
      total_submissions: submissions.length,
      submissions: submissions.map((item) => ({
        ...this.toSubmissionResponse(item),
        student: item.users_submissions_student_idTousers,
      })),
    };
  }

  async gradeSubmission(
    submissionId: string,
    teacherId: string,
    dto: GradeSubmissionDto,
  ) {
    const submission = await this.prisma.submissions.findUnique({
      where: { id: submissionId },
      include: {
        assignments: {
          select: {
            id: true,
            title: true,
            max_score: true,
            class_id: true,
          },
        },
      },
    });

    if (!submission) {
      throw new AppException({
        code: AppErrorCode.NOT_FOUND,
        errorKey: 'assignment.not_found',
        message: 'Không tìm thấy bài nộp',
      });
    }

    const effectiveScore = this.resolveScore(dto);
    const maxScore = Number(submission.assignments.max_score ?? 10);

    if (effectiveScore !== undefined && effectiveScore > maxScore) {
      throw new AppException({
        code: AppErrorCode.BAD_REQUEST,
        errorKey: 'assignment.bad_request',
        message: `Điểm không được vượt quá thang điểm ${maxScore}`,
      });
    }

    const feedbackPayload: FeedbackPayload = {
      feedback: dto.feedback,
      rubric_scores: dto.rubric_scores,
      annotations: dto.annotations,
    };

    const graded = await this.prisma.submissions.update({
      where: { id: submissionId },
      data: {
        score: effectiveScore,
        feedback: JSON.stringify(feedbackPayload),
        graded_by: teacherId,
        graded_at: new Date(),
      },
      include: {
        users_submissions_graded_byTousers: {
          select: { id: true, full_name: true },
        },
      },
    });

    await this.notificationsService.create({
      user_id: graded.student_id,
      type: NotificationType.ASSIGNMENT_GRADED,
      title: 'Bài nộp đã được chấm',
      body: `Bài nộp cho bài tập \"${submission.assignments.title}\" đã có điểm và nhận xét mới.`,
      ref_type: NotificationRefType.SUBMISSION,
      ref_id: graded.id,
    });

    await this.invalidateTeacherDashboardByClass(
      submission.assignments.class_id,
    );

    return {
      ...this.toSubmissionResponse(graded),
      graded_by_user: graded.users_submissions_graded_byTousers,
    };
  }

  async getSubmissionDetail(
    submissionId: string,
    requester: { id: string; roles?: string[]; role?: string },
  ) {
    const submission = await this.prisma.submissions.findUnique({
      where: { id: submissionId },
      include: {
        assignments: {
          select: {
            id: true,
            title: true,
            class_id: true,
            max_score: true,
            description: true,
          },
        },
      },
    });

    if (!submission) {
      throw new AppException({
        code: AppErrorCode.NOT_FOUND,
        errorKey: 'assignment.not_found',
        message: 'Không tìm thấy bài nộp',
      });
    }

    const isStudent =
      requester.roles?.includes('student') ?? requester.role === 'student';

    if (isStudent && requester.id !== submission.student_id) {
      throw new AppException({
        code: AppErrorCode.BAD_REQUEST,
        errorKey: 'assignment.bad_request',
        message: 'Bạn không có quyền xem bài nộp này',
      });
    }

    return {
      ...this.toSubmissionResponse(submission),
      assignment: {
        id: submission.assignments.id,
        title: submission.assignments.title,
        class_id: submission.assignments.class_id,
        max_score: submission.assignments.max_score,
        details: this.parseAssignmentMetadata(
          submission.assignments.description,
        ),
      },
    };
  }

  private resolveScore(dto: GradeSubmissionDto): number | undefined {
    if (dto.score !== undefined) {
      return dto.score;
    }

    if (!dto.rubric_scores || dto.rubric_scores.length === 0) {
      return undefined;
    }

    return Number(
      dto.rubric_scores
        .reduce((sum, criterion) => sum + criterion.score, 0)
        .toFixed(2),
    );
  }

  private toSubmissionResponse(item: submissions) {
    return {
      id: item.id,
      assignment_id: item.assignment_id,
      student_id: item.student_id,
      content: this.parseJson<SubmissionContent>(item.content),
      file_url: item.file_url,
      score: item.score,
      feedback: this.parseJson<FeedbackPayload>(item.feedback),
      graded_by: item.graded_by,
      graded_at: item.graded_at,
      submitted_at: item.submitted_at,
    };
  }

  private parseAssignmentMetadata(
    description: string | null,
  ): AssignmentMetadata {
    const parsed = this.parseJson<AssignmentMetadata>(description);
    if (parsed) {
      return parsed;
    }

    return {
      description: description ?? undefined,
    };
  }

  private parseJson<T>(raw: string | null): T | null {
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  private async invalidateTeacherDashboardByClass(classId: string) {
    const classItem = await this.prisma.classes.findUnique({
      where: { id: classId },
      select: { teacher_id: true },
    });

    if (!classItem?.teacher_id) {
      return;
    }

    await this.redis.invalidateTeacherDashboardCache(classItem.teacher_id);
  }
}
