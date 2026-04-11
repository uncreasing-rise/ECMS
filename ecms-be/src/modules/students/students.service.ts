import { AppErrorCode } from '../../common/api/app-error-code.enum.js';
import { AppException } from '../../common/api/app-exception.js';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  NotificationRefType,
  NotificationType,
} from '../notifications/notification.constants.js';
import { StudentsAcademicService } from './students-academic.service.js';

interface GetMyClassesParams {
  studentId: string;
  status?: string;
  skip: number;
  take: number;
}

interface GetStudentsParams {
  search?: string;
  status?: string;
  classId?: string;
  courseId?: string;
  leadOnly?: boolean;
  skip: number;
  take: number;
}

interface GradeWeightConfig {
  assignment: number;
  exam: number;
  attendance: number;
}

interface ComputeClassGradeParams {
  studentId: string;
  classId: string;
  weights?: Partial<GradeWeightConfig>;
}

const COURSE_SELECT = {
  id: true,
  name: true,
  description: true,
  level: true,
  total_sessions: true,
  price: true,
  is_active: true,
  created_at: true,
} as const;

const CLASS_SELECT = {
  id: true,
  name: true,
  status: true,
  start_date: true,
  end_date: true,
  created_at: true,
  courses: {
    select: COURSE_SELECT,
  },
  users: {
    select: {
      id: true,
      full_name: true,
      email: true,
    },
  },
} as const;

const STUDENT_STATUSES = new Set([
  'active',
  'inactive',
  'on_hold',
  'graduated',
]);
const LEAD_STATUSES = ['inactive', 'on_hold'] as const;
const DEFAULT_GRADE_WEIGHTS: GradeWeightConfig = {
  assignment: 0.4,
  exam: 0.5,
  attendance: 0.1,
};

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly academicService: StudentsAcademicService,
  ) {}

  async getMyProfile(studentId: string) {
    const user = await this.loadStudentProfile(studentId);

    return user;
  }

  async getStudents(params: GetStudentsParams) {
    const where: Prisma.usersWhereInput = {};

    if (params.search) {
      where.OR = [
        { full_name: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search, mode: 'insensitive' } },
        { address: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.status) {
      if (!STUDENT_STATUSES.has(params.status)) {
        throw new AppException({
          code: AppErrorCode.BAD_REQUEST,
          errorKey: 'student.bad_request',
          message: 'Trạng thái học viên không hợp lệ',
        });
      }

      where.status = params.status;
    } else if (params.leadOnly) {
      where.status = { in: [...LEAD_STATUSES] };
    }

    if (params.classId || params.courseId) {
      const enrollmentFilter: Prisma.enrollmentsWhereInput = {};

      if (params.classId) {
        enrollmentFilter.class_id = params.classId;
      }

      if (params.courseId) {
        enrollmentFilter.classes = {
          course_id: params.courseId,
        };
      }

      where.enrollments = {
        some: enrollmentFilter,
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.users.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: [{ created_at: 'desc' }, { full_name: 'asc' }],
        select: {
          id: true,
          full_name: true,
          email: true,
          phone: true,
          avatar_url: true,
          date_of_birth: true,
          gender: true,
          address: true,
          status: true,
          created_at: true,
          updated_at: true,
          _count: {
            select: {
              enrollments: true,
              grades: true,
              student_targets: true,
              exam_sessions_exam_sessions_student_idTousers: true,
              mock_test_history: true,
            },
          },
        },
      }),
      this.prisma.users.count({ where }),
    ]);

    return {
      data: items,
      total,
      skip: params.skip,
      take: params.take,
      hasMore: params.skip + params.take < total,
    };
  }

  async getStudentDetail(studentId: string) {
    const invoiceLimit = 100;
    const paymentPerInvoiceLimit = 20;
    const examSessionLimit = 100;
    const mockHistoryLimit = 100;
    const targetLimit = 50;

    const [
      profile,
      attendanceSummary,
      enrollments,
      grades,
      invoices,
      examSessions,
      mockTestHistory,
      targets,
    ] = await Promise.all([
      this.loadStudentProfile(studentId),
      this.academicService.getAttendanceSummary(studentId),
      this.prisma.enrollments.findMany({
        where: { student_id: studentId },
        orderBy: { enrolled_at: 'desc' },
        include: {
          classes: {
            select: CLASS_SELECT,
          },
        },
      }),
      this.prisma.grades.findMany({
        where: { student_id: studentId },
        orderBy: { updated_at: 'desc' },
        include: {
          classes: {
            select: CLASS_SELECT,
          },
        },
      }),
      this.prisma.invoices.findMany({
        where: {
          enrollments: {
            student_id: studentId,
          },
        },
        orderBy: [{ status: 'asc' }, { due_date: 'asc' }],
        take: invoiceLimit,
        include: {
          enrollments: {
            include: {
              classes: {
                select: CLASS_SELECT,
              },
            },
          },
          payments: {
            orderBy: { paid_at: 'desc' },
            take: paymentPerInvoiceLimit,
          },
        },
      }),
      this.prisma.exam_sessions.findMany({
        where: { student_id: studentId },
        orderBy: { started_at: 'desc' },
        take: examSessionLimit,
        include: {
          exams: {
            select: {
              id: true,
              title: true,
              exam_type: true,
              subject: true,
              duration_minutes: true,
              total_score: true,
              passing_score: true,
              available_from: true,
              available_until: true,
              show_result_after: true,
              show_answer_after: true,
            },
          },
        },
      }),
      this.prisma.mock_test_history.findMany({
        where: { student_id: studentId },
        orderBy: { taken_at: 'desc' },
        take: mockHistoryLimit,
        include: {
          exam_sessions: {
            include: {
              exams: {
                select: {
                  id: true,
                  title: true,
                  exam_type: true,
                  subject: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.student_targets.findMany({
        where: { student_id: studentId },
        orderBy: { updated_at: 'desc' },
        take: targetLimit,
      }),
    ]);

    return {
      profile,
      summary: {
        total_classes: profile._count.enrollments,
        total_grades: profile._count.grades,
        total_targets: profile._count.student_targets,
        total_exam_sessions:
          profile._count.exam_sessions_exam_sessions_student_idTousers,
        total_mock_tests: profile._count.mock_test_history,
        attendance_classes: attendanceSummary.length,
      },
      attendance_summary: attendanceSummary,
      enrollments,
      grades,
      invoices,
      exam_sessions: examSessions,
      mock_test_history: mockTestHistory,
      student_targets: targets,
    };
  }

  async getStudentHistory(studentId: string) {
    const [
      attendanceSummary,
      enrollments,
      grades,
      invoices,
      examSessions,
      mockTestHistory,
      targets,
    ] = await Promise.all([
      this.academicService.getAttendanceSummary(studentId),
      this.prisma.enrollments.findMany({
        where: { student_id: studentId },
        orderBy: { enrolled_at: 'desc' },
        include: {
          classes: {
            select: CLASS_SELECT,
          },
        },
      }),
      this.prisma.grades.findMany({
        where: { student_id: studentId },
        orderBy: { updated_at: 'desc' },
        include: {
          classes: {
            select: CLASS_SELECT,
          },
        },
      }),
      this.prisma.invoices.findMany({
        where: {
          enrollments: {
            student_id: studentId,
          },
        },
        orderBy: [{ status: 'asc' }, { due_date: 'asc' }],
        include: {
          enrollments: {
            include: {
              classes: {
                select: CLASS_SELECT,
              },
            },
          },
          payments: {
            orderBy: { paid_at: 'desc' },
          },
        },
      }),
      this.prisma.exam_sessions.findMany({
        where: { student_id: studentId },
        orderBy: { started_at: 'desc' },
        include: {
          exams: {
            select: {
              id: true,
              title: true,
              exam_type: true,
              subject: true,
              duration_minutes: true,
              total_score: true,
              passing_score: true,
              available_from: true,
              available_until: true,
              show_result_after: true,
              show_answer_after: true,
            },
          },
        },
      }),
      this.prisma.mock_test_history.findMany({
        where: { student_id: studentId },
        orderBy: { taken_at: 'desc' },
        include: {
          exam_sessions: {
            include: {
              exams: {
                select: {
                  id: true,
                  title: true,
                  exam_type: true,
                  subject: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.student_targets.findMany({
        where: { student_id: studentId },
        orderBy: { updated_at: 'desc' },
      }),
    ]);

    return {
      attendance_summary: attendanceSummary,
      enrollments,
      grades,
      invoices,
      exam_sessions: examSessions,
      mock_test_history: mockTestHistory,
      student_targets: targets,
    };
  }

  async updateStudentStatus(studentId: string, status: string) {
    if (!STUDENT_STATUSES.has(status)) {
      throw new AppException({
        code: AppErrorCode.BAD_REQUEST,
        errorKey: 'student.bad_request',
        message: 'Trạng thái học viên không hợp lệ',
      });
    }

    const existing = await this.prisma.users.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        full_name: true,
        email: true,
        status: true,
        updated_at: true,
      },
    });

    if (!existing) {
      throw new AppException({
        code: AppErrorCode.NOT_FOUND,
        errorKey: 'student.not_found',
        message: 'Không tìm thấy học sinh',
      });
    }

    const updated = await this.prisma.users.update({
      where: { id: studentId },
      data: { status },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        avatar_url: true,
        date_of_birth: true,
        gender: true,
        address: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
    });

    try {
      await this.notifications.create({
        user_id: studentId,
        type: NotificationType.STUDENT_STATUS_CHANGED,
        title: 'Trang thai tai khoan duoc cap nhat',
        body: `Trang thai hoc vien cua ban da duoc doi thanh "${status}".`,
        ref_type: NotificationRefType.STUDENT,
        ref_id: studentId,
      });
    } catch (error) {
      this.logger.error(
        `Failed to notify student status change: ${studentId}`,
        error,
      );
      // Status update should not fail because of notification issues.
    }

    return updated;
  }

  private async loadStudentProfile(studentId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        avatar_url: true,
        date_of_birth: true,
        gender: true,
        address: true,
        status: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: {
            enrollments: true,
            grades: true,
            student_targets: true,
            exam_sessions_exam_sessions_student_idTousers: true,
            mock_test_history: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppException({
        code: AppErrorCode.NOT_FOUND,
        errorKey: 'student.not_found',
        message: 'Không tìm thấy học sinh',
      });
    }

    return user;
  }

  async getMyClasses(params: GetMyClassesParams) {
    const where: Prisma.enrollmentsWhereInput = {
      student_id: params.studentId,
    };

    if (params.status) {
      where.status = params.status;
    }

    const [items, total] = await Promise.all([
      this.prisma.enrollments.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { enrolled_at: 'desc' },
        include: {
          classes: {
            include: {
              courses: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  level: true,
                  total_sessions: true,
                  price: true,
                  is_active: true,
                  created_at: true,
                },
              },
              users: {
                select: {
                  id: true,
                  full_name: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.enrollments.count({ where }),
    ]);

    return {
      data: items,
      total,
      skip: params.skip,
      take: params.take,
      hasMore: params.skip + params.take < total,
    };
  }

  async getMyGrades(studentId: string) {
    return this.prisma.grades.findMany({
      where: { student_id: studentId },
      orderBy: { updated_at: 'desc' },
      include: {
        classes: {
          include: {
            courses: {
              select: {
                id: true,
                name: true,
                description: true,
                level: true,
                total_sessions: true,
                price: true,
                is_active: true,
                created_at: true,
              },
            },
          },
        },
      },
    });
  }

  async getMyInvoices(studentId: string, status?: string) {
    const where: Prisma.invoicesWhereInput = {
      enrollments: {
        student_id: studentId,
      },
    };

    if (status) {
      where.status = status;
    }

    const COURSE_SELECT = {
      id: true,
      name: true,
      description: true,
      level: true,
      total_sessions: true,
      price: true,
      is_active: true,
      created_at: true,
    } as const;

    return this.prisma.invoices.findMany({
      where,
      orderBy: [{ status: 'asc' }, { due_date: 'asc' }],
      include: {
        enrollments: {
          include: {
            classes: {
              include: {
                courses: {
                  select: COURSE_SELECT,
                },
              },
            },
          },
        },
      },
    });
  }
}
