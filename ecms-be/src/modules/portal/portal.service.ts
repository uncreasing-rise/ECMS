import { AppErrorCode } from '../../common/api/app-error-code.enum.js';
import { AppException } from '../../common/api/app-exception.js';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { RedisService } from '../../common/redis/redis.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import {
  NotificationRefType,
  NotificationType,
} from '../notifications/notification.constants.js';

export type Actor = {
  id: string;
  roles: string[];
};

export type CreateLessonDto = {
  title: string;
  content: string;
  order_index: number;
  is_published?: boolean;
};

export type UploadClassDocumentDto = {
  title: string;
  description?: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  tags?: string[];
};

export type CreateTeacherAssignmentDto = {
  title: string;
  description?: string;
  due_at?: string | Date;
  max_score: number;
  allow_resubmit?: boolean;
};

export type GradeSubmissionDto = {
  score: number;
  feedback?: string;
};

export type CreateTeacherExamDto = {
  title: string;
  description?: string;
  exam_type: string;
  subject?: string;
  duration_minutes: number;
  total_score?: number;
  passing_score?: number;
  max_attempts?: number;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  show_result_after?: boolean;
  show_answer_after?: boolean;
  available_from?: string | Date;
  available_until?: string | Date;
  instructions?: string;
  questions?: Array<{
    question_id: string;
    order_index?: number;
    score?: number;
  }>;
};

export type SendCenterMessageDto = {
  to_user_id: string;
  message: string;
  subject?: string;
};

type TeacherDashboardPayload = {
  classes_teaching: unknown[];
  sessions_today: unknown[];
  pending_assignment_grading: number;
};

type ChildOverviewPayload = {
  child: { id: string; full_name: string | null; email: string | null };
  schedule: Array<{
    class_id: string;
    class_name: string | null;
    next_sessions: Array<{
      starts_at: Date;
      ends_at: Date;
      note: string | null;
    }>;
  }>;
  attendance: { total: number; present: number; rate: number };
  grades: Array<{
    class_id: string;
    class_name: string | null;
    final_score: number;
  }>;
  progress: {
    completed_lessons: number;
    total_lessons_tracked: number;
    completion_percent: number;
  };
  invoices: Array<{
    invoice_id: string;
    amount: number;
    paid_amount: number;
    status: string | null;
    due_date: Date | null;
  }>;
};

@Injectable()
export class PortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly notifications: NotificationsService,
  ) {}

  async getTeacherDashboard(
    teacherId: string,
  ): Promise<TeacherDashboardPayload> {
    const cacheKey = `portal:teacher:dashboard:${teacherId}`;
    const cached = await this.redis.cacheGet(cacheKey);
    if (cached) {
      return this.parseCached<TeacherDashboardPayload>(cached);
    }

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const [classes, todaySessions, pendingSubmissions] = await Promise.all([
      this.prisma.classes.findMany({
        where: {
          teacher_id: teacherId,
          status: { in: ['active', 'ongoing'] },
        },
        select: {
          id: true,
          name: true,
          status: true,
          start_date: true,
          end_date: true,
          _count: {
            select: { enrollments: true },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.class_schedules.findMany({
        where: {
          starts_at: { gte: startOfDay, lte: endOfDay },
          classes: { teacher_id: teacherId },
        },
        select: {
          id: true,
          class_id: true,
          starts_at: true,
          ends_at: true,
          note: true,
          classes: {
            select: { name: true },
          },
        },
        orderBy: { starts_at: 'asc' },
      }),
      this.prisma.submissions.count({
        where: {
          graded_at: null,
          assignments: {
            classes: {
              teacher_id: teacherId,
            },
          },
        },
      }),
    ]);

    const payload = {
      classes_teaching: classes,
      sessions_today: todaySessions,
      pending_assignment_grading: pendingSubmissions,
    };

    await this.redis.cacheSet(cacheKey, JSON.stringify(payload), 60);
    return payload;
  }

  async getTeacherClassManagement(teacherId: string, classId: string) {
    const classInfo = await this.prisma.classes.findFirst({
      where: { id: classId, teacher_id: teacherId },
      select: { id: true, name: true },
    });

    if (!classInfo) {
      throw new AppException({
        code: AppErrorCode.NOT_FOUND,
        errorKey: 'portal.not_found',
        message: 'Không tìm thấy lớp học hoặc không có quyền truy cập',
      });
    }

    const [students, schedules, assignments] = await Promise.all([
      this.prisma.enrollments.findMany({
        where: { class_id: classId, status: 'active' },
        include: {
          users: {
            select: { id: true, full_name: true, email: true, status: true },
          },
        },
        orderBy: { enrolled_at: 'asc' },
      }),
      this.prisma.class_schedules.findMany({
        where: { class_id: classId },
        select: { id: true },
      }),
      this.prisma.assignments.findMany({
        where: { class_id: classId },
        select: {
          id: true,
          title: true,
          max_score: true,
          submissions: {
            select: { student_id: true, score: true, submitted_at: true },
          },
        },
      }),
    ]);

    const scheduleIds = schedules.map((item) => item.id);
    const attendances = scheduleIds.length
      ? await this.prisma.attendances.findMany({
          where: { schedule_id: { in: scheduleIds } },
          select: { student_id: true, status: true },
        })
      : [];

    const attendanceMap = new Map<string, { total: number; present: number }>();
    for (const row of attendances) {
      const current = attendanceMap.get(row.student_id) ?? {
        total: 0,
        present: 0,
      };
      current.total += 1;
      const status = (row.status ?? '').toLowerCase();
      if (status === 'present' || status === 'late' || status === 'excused') {
        current.present += 1;
      }
      attendanceMap.set(row.student_id, current);
    }

    const assignmentScoreByStudent = new Map<
      string,
      { sum: number; count: number }
    >();
    for (const assignment of assignments) {
      const maxScore = Number(assignment.max_score ?? 10);
      for (const submission of assignment.submissions) {
        if (submission.score == null) continue;
        const normalized =
          maxScore > 0 ? (Number(submission.score) / maxScore) * 100 : 0;
        const current = assignmentScoreByStudent.get(submission.student_id) ?? {
          sum: 0,
          count: 0,
        };
        current.sum += normalized;
        current.count += 1;
        assignmentScoreByStudent.set(submission.student_id, current);
      }
    }

    const studentProgress = students.map((enrollment) => {
      const attendance = attendanceMap.get(enrollment.student_id) ?? {
        total: 0,
        present: 0,
      };
      const assignment = assignmentScoreByStudent.get(
        enrollment.student_id,
      ) ?? {
        sum: 0,
        count: 0,
      };
      const assignmentAvg =
        assignment.count > 0
          ? Number((assignment.sum / assignment.count).toFixed(2))
          : 0;
      const attendanceRate =
        attendance.total > 0
          ? Number(((attendance.present / attendance.total) * 100).toFixed(2))
          : 0;

      return {
        student_id: enrollment.student_id,
        student_name: enrollment.users.full_name,
        email: enrollment.users.email,
        status: enrollment.users.status,
        attendance_rate: attendanceRate,
        assignment_progress: assignmentAvg,
      };
    });

    return {
      class: classInfo,
      students: studentProgress,
      attendance_records: attendances.length,
    };
  }

  async createLesson(
    teacherId: string,
    classId: string,
    moduleId: string,
    dto: CreateLessonDto,
  ) {
    await this.assertTeacherClassAccess(teacherId, classId);

    const moduleInfo = await this.prisma.course_modules.findUnique({
      where: { id: moduleId },
      select: { id: true, course_id: true },
    });

    if (!moduleInfo) {
      throw new AppException({
        code: AppErrorCode.NOT_FOUND,
        errorKey: 'portal.not_found',
        message: 'Không tìm thấy module',
      });
    }

    const classInfo = await this.prisma.classes.findUnique({
      where: { id: classId },
      select: { course_id: true },
    });

    if (!classInfo || classInfo.course_id !== moduleInfo.course_id) {
      throw new AppException({
        code: AppErrorCode.BAD_REQUEST,
        errorKey: 'portal.bad_request',
        message: 'Module không thuộc khóa học của lớp này',
      });
    }

    const lesson = await this.prisma.lessons.create({
      data: {
        id: randomUUID(),
        module_id: moduleId,
        title: dto.title,
        content: dto.content,
        order_index: dto.order_index,
        is_published: dto.is_published ?? true,
        published_at: dto.is_published === false ? null : new Date(),
        created_by: teacherId,
      },
    });

    await this.redis.invalidateTeacherDashboardCache(teacherId);
    return lesson;
  }

  async uploadClassDocument(
    teacherId: string,
    classId: string,
    dto: UploadClassDocumentDto,
  ) {
    await this.assertTeacherClassAccess(teacherId, classId);

    const document = await this.prisma.documents.create({
      data: {
        id: randomUUID(),
        scope: 'class',
        scope_id: classId,
        title: dto.title,
        description: dto.description,
        file_url: dto.file_url,
        file_name: dto.file_name,
        file_type: dto.file_type,
        file_size: dto.file_size,
        tags: dto.tags ?? [],
        uploaded_by: teacherId,
        uploaded_at: new Date(),
      },
    });

    await this.redis.invalidateTeacherDashboardCache(teacherId);
    return document;
  }

  async createTeacherAssignment(
    teacherId: string,
    classId: string,
    dto: CreateTeacherAssignmentDto,
  ) {
    await this.assertTeacherClassAccess(teacherId, classId);

    const assignment = await this.prisma.assignments.create({
      data: {
        id: randomUUID(),
        class_id: classId,
        created_by: teacherId,
        title: dto.title,
        description: dto.description,
        due_at: dto.due_at ? new Date(dto.due_at) : null,
        max_score: dto.max_score,
        allow_resubmit: dto.allow_resubmit ?? false,
        created_at: new Date(),
      },
    });

    await this.redis.invalidateTeacherDashboardCache(teacherId);
    return assignment;
  }

  async getPendingSubmissionGrading(teacherId: string, classId?: string) {
    const where: Prisma.submissionsWhereInput = {
      graded_at: null,
      assignments: {
        classes: {
          teacher_id: teacherId,
          ...(classId ? { id: classId } : {}),
        },
      },
    };

    return this.prisma.submissions.findMany({
      where,
      include: {
        assignments: {
          select: {
            id: true,
            title: true,
            class_id: true,
            classes: { select: { name: true } },
          },
        },
        users_submissions_student_idTousers: {
          select: { id: true, full_name: true, email: true },
        },
      },
      orderBy: { submitted_at: 'asc' },
    });
  }

  async gradeSubmission(
    teacherId: string,
    submissionId: string,
    dto: GradeSubmissionDto,
  ) {
    const submission = await this.prisma.submissions.findUnique({
      where: { id: submissionId },
      include: {
        assignments: {
          include: {
            classes: { select: { teacher_id: true } },
          },
        },
      },
    });

    if (!submission) {
      throw new AppException({
        code: AppErrorCode.NOT_FOUND,
        errorKey: 'portal.not_found',
        message: 'Không tìm thấy bài nộp',
      });
    }

    if (submission.assignments.classes.teacher_id !== teacherId) {
      throw new AppException({
        code: AppErrorCode.BAD_REQUEST,
        errorKey: 'portal.bad_request',
        message: 'Bạn không có quyền chấm bài này',
      });
    }

    const graded = await this.prisma.submissions.update({
      where: { id: submissionId },
      data: {
        score: dto.score,
        feedback: dto.feedback,
        graded_by: teacherId,
        graded_at: new Date(),
      },
    });

    await this.redis.invalidateTeacherDashboardCache(teacherId);
    return graded;
  }

  async createTeacherExam(teacherId: string, dto: CreateTeacherExamDto) {
    const exam = await this.prisma.exams.create({
      data: {
        id: randomUUID(),
        created_by: teacherId,
        title: dto.title,
        description: dto.description,
        exam_type: dto.exam_type,
        subject: dto.subject,
        duration_minutes: dto.duration_minutes,
        total_score: dto.total_score,
        passing_score: dto.passing_score,
        max_attempts: dto.max_attempts,
        shuffle_questions: dto.shuffle_questions,
        shuffle_options: dto.shuffle_options,
        show_result_after: dto.show_result_after,
        show_answer_after: dto.show_answer_after,
        available_from: dto.available_from
          ? new Date(dto.available_from)
          : null,
        available_until: dto.available_until
          ? new Date(dto.available_until)
          : null,
        instructions: dto.instructions,
        created_at: new Date(),
      },
    });

    if (Array.isArray(dto.questions) && dto.questions.length > 0) {
      await this.prisma.exam_questions.createMany({
        data: dto.questions.map((q, idx) => ({
          id: randomUUID(),
          exam_id: exam.id,
          question_id: q.question_id,
          order_index: q.order_index ?? idx + 1,
          score: q.score ?? 1,
        })),
      });
    }

    return exam;
  }

  async getTeacherClassReport(teacherId: string, classId: string) {
    await this.assertTeacherClassAccess(teacherId, classId);

    const [students, grades, attendance] = await Promise.all([
      this.prisma.enrollments.findMany({
        where: { class_id: classId, status: 'active' },
        include: { users: { select: { id: true, full_name: true } } },
      }),
      this.prisma.grades.findMany({ where: { class_id: classId } }),
      this.prisma.attendances.findMany({
        where: { class_schedules: { class_id: classId } },
        select: { student_id: true, status: true },
      }),
    ]);

    const gradeByStudent = new Map(
      grades.map((g) => [g.student_id, Number(g.final_score ?? 0)]),
    );
    const attendanceByStudent = new Map<
      string,
      { total: number; present: number }
    >();

    for (const row of attendance) {
      const current = attendanceByStudent.get(row.student_id) ?? {
        total: 0,
        present: 0,
      };
      current.total += 1;
      const status = (row.status ?? '').toLowerCase();
      if (status === 'present' || status === 'late' || status === 'excused') {
        current.present += 1;
      }
      attendanceByStudent.set(row.student_id, current);
    }

    const studentRows = students.map((student) => {
      const finalScore = gradeByStudent.get(student.student_id) ?? 0;
      const at = attendanceByStudent.get(student.student_id) ?? {
        total: 0,
        present: 0,
      };
      const attendanceRate =
        at.total > 0 ? Number(((at.present / at.total) * 100).toFixed(2)) : 0;
      return {
        student_id: student.student_id,
        student_name: student.users.full_name,
        final_score: finalScore,
        attendance_rate: attendanceRate,
        is_at_risk: finalScore < 50 || attendanceRate < 75,
      };
    });

    return {
      class_id: classId,
      total_students: studentRows.length,
      average_score:
        studentRows.length === 0
          ? 0
          : Number(
              (
                studentRows.reduce((sum, row) => sum + row.final_score, 0) /
                studentRows.length
              ).toFixed(2),
            ),
      weak_students: studentRows.filter((row) => row.is_at_risk),
      students: studentRows,
    };
  }

  async getChildOverview(
    actor: Actor,
    studentId: string,
  ): Promise<ChildOverviewPayload> {
    this.assertParentActor(actor);

    const cacheKey = `portal:parent:overview:${studentId}`;
    const cached = await this.redis.cacheGet(cacheKey);
    if (cached) {
      return this.parseCached<ChildOverviewPayload>(cached);
    }

    const [student, classes, attendance, grades, progress, invoices] =
      await Promise.all([
        this.prisma.users.findUnique({
          where: { id: studentId },
          select: { id: true, full_name: true, email: true },
        }),
        this.prisma.enrollments.findMany({
          where: {
            student_id: studentId,
            status: { in: ['active', 'completed'] },
          },
          include: {
            classes: {
              select: {
                id: true,
                name: true,
                class_schedules: {
                  where: { starts_at: { gte: new Date() } },
                  take: 5,
                  orderBy: { starts_at: 'asc' },
                  select: { starts_at: true, ends_at: true, note: true },
                },
              },
            },
          },
        }),
        this.prisma.attendances.findMany({
          where: { student_id: studentId },
          select: { status: true },
        }),
        this.prisma.grades.findMany({
          where: { student_id: studentId },
          include: { classes: { select: { id: true, name: true } } },
        }),
        this.prisma.lesson_progress.findMany({
          where: { student_id: studentId },
          select: { is_completed: true },
        }),
        this.prisma.invoices.findMany({
          where: { enrollments: { student_id: studentId } },
          include: { payments: true },
          orderBy: [{ status: 'asc' }, { due_date: 'asc' }],
        }),
      ]);

    if (!student) {
      throw new AppException({
        code: AppErrorCode.NOT_FOUND,
        errorKey: 'portal.not_found',
        message: 'Không tìm thấy học sinh',
      });
    }

    const totalAttendance = attendance.length;
    const presentAttendance = attendance.filter((row) => {
      const status = (row.status ?? '').toLowerCase();
      return status === 'present' || status === 'late' || status === 'excused';
    }).length;

    const completedLessons = progress.filter((row) => row.is_completed).length;
    const totalLessonsTracked = progress.length;

    const payload = {
      child: student,
      schedule: classes.map((enrollment) => ({
        class_id: enrollment.class_id,
        class_name: enrollment.classes.name,
        next_sessions: enrollment.classes.class_schedules,
      })),
      attendance: {
        total: totalAttendance,
        present: presentAttendance,
        rate:
          totalAttendance === 0
            ? 0
            : Number(((presentAttendance / totalAttendance) * 100).toFixed(2)),
      },
      grades: grades.map((grade) => ({
        class_id: grade.class_id,
        class_name: grade.classes.name,
        final_score: Number(grade.final_score ?? 0),
      })),
      progress: {
        completed_lessons: completedLessons,
        total_lessons_tracked: totalLessonsTracked,
        completion_percent:
          totalLessonsTracked === 0
            ? 0
            : Number(
                ((completedLessons / totalLessonsTracked) * 100).toFixed(2),
              ),
      },
      invoices: invoices.map((invoice) => ({
        invoice_id: invoice.id,
        amount: Number(invoice.amount),
        paid_amount: Number(invoice.paid_amount ?? 0),
        status: invoice.status,
        due_date: invoice.due_date,
      })),
    };

    await this.redis.cacheSet(cacheKey, JSON.stringify(payload), 60);
    return payload;
  }

  async getChildNotifications(actor: Actor, studentId: string) {
    this.assertParentActor(actor);

    return this.prisma.notifications.findMany({
      where: {
        user_id: studentId,
        type: {
          in: [
            NotificationType.ATTENDANCE_ALERT,
            NotificationType.ASSIGNMENT_GRADED,
            NotificationType.EXAM_SUBMITTED,
            NotificationType.INVOICE_CREATED,
            'exam_result',
            'invoice_due',
          ],
        },
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
  }

  async sendCenterMessage(actor: Actor, dto: SendCenterMessageDto) {
    this.assertParentActor(actor);

    if (!dto.to_user_id || !dto.message) {
      throw new AppException({
        code: AppErrorCode.BAD_REQUEST,
        errorKey: 'portal.bad_request',
        message: 'to_user_id và message là bắt buộc',
      });
    }

    return this.notifications.create({
      user_id: dto.to_user_id,
      type: NotificationType.PARENT_MESSAGE,
      title: dto.subject ?? 'Tin nhắn từ phụ huynh',
      body: dto.message,
      ref_type: NotificationRefType.PARENT_CONTACT,
      ref_id: actor.id,
    });
  }

  async createOnlinePaymentIntent(
    actor: Actor,
    studentId: string,
    invoiceId: string,
  ) {
    this.assertParentActor(actor);

    const invoice = await this.prisma.invoices.findFirst({
      where: {
        id: invoiceId,
        enrollments: { student_id: studentId },
      },
      include: {
        payments: true,
      },
    });

    if (!invoice) {
      throw new AppException({
        code: AppErrorCode.NOT_FOUND,
        errorKey: 'portal.not_found',
        message: 'Không tìm thấy hóa đơn của học sinh này',
      });
    }

    const paid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = Number(invoice.amount) - paid;

    return {
      invoice_id: invoice.id,
      amount_due: Number(Math.max(0, remaining).toFixed(2)),
      gateway: 'mock_gateway',
      payment_url: `https://payments.local/checkout?invoice_id=${invoice.id}`,
      note: 'Cần tích hợp cổng thanh toán thật cho production',
    };
  }

  private async assertTeacherClassAccess(teacherId: string, classId: string) {
    const found = await this.prisma.classes.findFirst({
      where: { id: classId, teacher_id: teacherId },
      select: { id: true },
    });

    if (!found) {
      throw new AppException({
        code: AppErrorCode.BAD_REQUEST,
        errorKey: 'portal.bad_request',
        message: 'Không có quyền truy cập lớp học này',
      });
    }
  }

  private assertParentActor(actor: Actor) {
    const allowed =
      actor.roles.includes('parent') || actor.roles.includes('admin');
    if (!allowed) {
      throw new AppException({
        code: AppErrorCode.BAD_REQUEST,
        errorKey: 'portal.bad_request',
        message: 'Tính năng này chỉ dành cho phụ huynh',
      });
    }
  }

  private parseCached<T>(cached: string): T {
    return JSON.parse(cached) as T;
  }
}
