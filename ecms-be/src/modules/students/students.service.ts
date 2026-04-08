import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../common/prisma/prisma.service';

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
  constructor(private readonly prisma: PrismaService) {}

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
        throw new BadRequestException('Trạng thái học viên không hợp lệ');
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
      this.getAttendanceSummary(studentId),
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
      this.getAttendanceSummary(studentId),
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
      throw new BadRequestException('Trạng thái học viên không hợp lệ');
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
      throw new NotFoundException('Không tìm thấy học sinh');
    }

    return this.prisma.users.update({
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
      throw new NotFoundException('Không tìm thấy học sinh');
    }

    return user;
  }

  async getDashboard(studentId: string) {
    const [totalClasses, activeClasses, unreadNotifications, unpaidInvoices] =
      await Promise.all([
        this.prisma.enrollments.count({ where: { student_id: studentId } }),
        this.prisma.enrollments.count({
          where: { student_id: studentId, status: 'active' },
        }),
        this.prisma.notifications.count({
          where: { user_id: studentId, is_read: false },
        }),
        this.prisma.invoices.count({
          where: {
            enrollments: { student_id: studentId },
            status: { in: ['pending', 'overdue'] },
          },
        }),
      ]);

    return {
      total_classes: totalClasses,
      active_classes: activeClasses,
      unread_notifications: unreadNotifications,
      unpaid_invoices: unpaidInvoices,
    };
  }

  async getMyLearningProgress(studentId: string) {
    const enrollments = await this.prisma.enrollments.findMany({
      where: {
        student_id: studentId,
        status: { in: ['active', 'completed'] },
      },
      include: {
        classes: {
          include: {
            courses: {
              include: {
                course_modules: {
                  include: {
                    lessons: {
                      select: {
                        id: true,
                        is_published: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const lessonIds = enrollments.flatMap((enrollment) =>
      enrollment.classes.courses.course_modules.flatMap((module) =>
        module.lessons
          .filter((lesson) => lesson.is_published !== false)
          .map((lesson) => lesson.id),
      ),
    );

    const uniqueLessonIds = Array.from(new Set(lessonIds));

    const completedRows =
      uniqueLessonIds.length === 0
        ? []
        : await this.prisma.lesson_progress.findMany({
            where: {
              student_id: studentId,
              lesson_id: { in: uniqueLessonIds },
              is_completed: true,
            },
            select: { lesson_id: true },
          });

    const completedSet = new Set(completedRows.map((row) => row.lesson_id));

    const classes = enrollments.map((enrollment) => {
      const classLessons = enrollment.classes.courses.course_modules.flatMap(
        (module) =>
          module.lessons.filter((lesson) => lesson.is_published !== false),
      );

      const totalLessons = classLessons.length;
      const completedLessons = classLessons.filter((lesson) =>
        completedSet.has(lesson.id),
      ).length;

      return {
        class_id: enrollment.class_id,
        class_name: enrollment.classes.name,
        course_id: enrollment.classes.courses.id,
        course_name: enrollment.classes.courses.name,
        total_lessons: totalLessons,
        completed_lessons: completedLessons,
        remaining_lessons: Math.max(0, totalLessons - completedLessons),
        completion_percent:
          totalLessons === 0
            ? 0
            : Number(((completedLessons / totalLessons) * 100).toFixed(2)),
      };
    });

    const totalLessons = classes.reduce(
      (sum, item) => sum + item.total_lessons,
      0,
    );
    const completedLessons = classes.reduce(
      (sum, item) => sum + item.completed_lessons,
      0,
    );

    return {
      student_id: studentId,
      overall: {
        total_lessons: totalLessons,
        completed_lessons: completedLessons,
        remaining_lessons: Math.max(0, totalLessons - completedLessons),
        completion_percent:
          totalLessons === 0
            ? 0
            : Number(((completedLessons / totalLessons) * 100).toFixed(2)),
      },
      classes,
    };
  }

  async computeAndSaveClassFinalScore(params: ComputeClassGradeParams) {
    const weights = this.resolveWeights(params.weights);

    const enrollment = await this.prisma.enrollments.findFirst({
      where: {
        student_id: params.studentId,
        class_id: params.classId,
      },
      select: { id: true },
    });

    if (!enrollment) {
      throw new BadRequestException('Học viên không thuộc lớp học này');
    }

    const assignmentPercent = await this.calculateAssignmentPercent(
      params.studentId,
      params.classId,
    );
    const examPercent = await this.calculateExamPercent(
      params.studentId,
      params.classId,
    );
    const attendanceRate = await this.calculateAttendanceRateForClass(
      params.studentId,
      params.classId,
    );

    const finalScore = Number(
      (
        assignmentPercent * weights.assignment +
        examPercent * weights.exam +
        attendanceRate * weights.attendance
      ).toFixed(2),
    );

    const existing = await this.prisma.grades.findFirst({
      where: {
        student_id: params.studentId,
        class_id: params.classId,
      },
      select: { id: true },
    });

    if (existing) {
      return this.prisma.grades.update({
        where: { id: existing.id },
        data: {
          assignment_avg: assignmentPercent,
          exam_avg: examPercent,
          attendance_rate: attendanceRate,
          final_score: finalScore,
          updated_at: new Date(),
        },
      });
    }

    return this.prisma.grades.create({
      data: {
        id: randomUUID(),
        student_id: params.studentId,
        class_id: params.classId,
        assignment_avg: assignmentPercent,
        exam_avg: examPercent,
        attendance_rate: attendanceRate,
        final_score: finalScore,
        updated_at: new Date(),
      },
    });
  }

  async getStudentGradeBook(studentId: string) {
    const enrollments = await this.prisma.enrollments.findMany({
      where: { student_id: studentId },
      include: {
        classes: {
          select: {
            id: true,
            name: true,
            courses: {
              select: {
                id: true,
                name: true,
                level: true,
              },
            },
          },
        },
      },
    });

    const classIds = enrollments.map((enrollment) => enrollment.class_id);

    const [myGrades, classGrades] = await Promise.all([
      this.prisma.grades.findMany({
        where: {
          student_id: studentId,
          class_id: { in: classIds },
        },
      }),
      this.prisma.grades.findMany({
        where: {
          class_id: { in: classIds },
        },
        select: {
          class_id: true,
          student_id: true,
          final_score: true,
        },
      }),
    ]);

    const myGradeMap = new Map(
      myGrades.map((grade) => [grade.class_id, grade]),
    );
    const gradeByClass = new Map<
      string,
      Array<{ student_id: string; final: number }>
    >();

    for (const row of classGrades) {
      const items = gradeByClass.get(row.class_id) ?? [];
      items.push({
        student_id: row.student_id,
        final: Number(row.final_score ?? 0),
      });
      gradeByClass.set(row.class_id, items);
    }

    const rows = enrollments.map((enrollment) => {
      const classId = enrollment.class_id;
      const my = myGradeMap.get(classId);
      const ranks = (gradeByClass.get(classId) ?? [])
        .slice()
        .sort((a, b) => b.final - a.final);
      const rank = ranks.findIndex((item) => item.student_id === studentId) + 1;
      const classAvg =
        ranks.length === 0
          ? 0
          : Number(
              (
                ranks.reduce((sum, item) => sum + item.final, 0) / ranks.length
              ).toFixed(2),
            );

      return {
        class_id: classId,
        class_name: enrollment.classes.name,
        course_id: enrollment.classes.courses.id,
        course_name: enrollment.classes.courses.name,
        level: enrollment.classes.courses.level,
        assignment_avg: Number(my?.assignment_avg ?? 0),
        exam_avg: Number(my?.exam_avg ?? 0),
        attendance_rate: Number(my?.attendance_rate ?? 0),
        final_score: Number(my?.final_score ?? 0),
        class_average: classAvg,
        rank_in_class: rank > 0 ? rank : null,
        class_size: ranks.length,
      };
    });

    return {
      student_id: studentId,
      classes: rows,
    };
  }

  async getClassLearningReport(classId: string) {
    const classInfo = await this.prisma.classes.findUnique({
      where: { id: classId },
      select: {
        id: true,
        name: true,
        courses: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!classInfo) {
      throw new NotFoundException('Không tìm thấy lớp học');
    }

    const enrollments = await this.prisma.enrollments.findMany({
      where: {
        class_id: classId,
        status: { in: ['active', 'completed'] },
      },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    const studentRows = await Promise.all(
      enrollments.map(async (enrollment) => {
        const [grade, progress, attendanceRate] = await Promise.all([
          this.prisma.grades.findFirst({
            where: {
              student_id: enrollment.student_id,
              class_id: classId,
            },
          }),
          this.getMyLearningProgress(enrollment.student_id),
          this.calculateAttendanceRateForClass(enrollment.student_id, classId),
        ]);

        const classProgress = progress.classes.find(
          (item) => item.class_id === classId,
        );

        return {
          student_id: enrollment.student_id,
          student_name: enrollment.users.full_name,
          email: enrollment.users.email,
          progress_percent: classProgress?.completion_percent ?? 0,
          completed_lessons: classProgress?.completed_lessons ?? 0,
          remaining_lessons: classProgress?.remaining_lessons ?? 0,
          assignment_avg: Number(grade?.assignment_avg ?? 0),
          exam_avg: Number(grade?.exam_avg ?? 0),
          attendance_rate: Number(grade?.attendance_rate ?? attendanceRate),
          final_score: Number(grade?.final_score ?? 0),
        };
      }),
    );

    const classAverage =
      studentRows.length === 0
        ? 0
        : Number(
            (
              studentRows.reduce(
                (sum, student) => sum + student.final_score,
                0,
              ) / studentRows.length
            ).toFixed(2),
          );

    return {
      class: classInfo,
      summary: {
        total_students: studentRows.length,
        average_final_score: classAverage,
        average_progress:
          studentRows.length === 0
            ? 0
            : Number(
                (
                  studentRows.reduce(
                    (sum, student) => sum + student.progress_percent,
                    0,
                  ) / studentRows.length
                ).toFixed(2),
              ),
      },
      students: studentRows.sort((a, b) => b.final_score - a.final_score),
    };
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

  async getAttendanceSummary(studentId: string) {
    const records = await this.prisma.attendances.findMany({
      where: { student_id: studentId },
      select: {
        status: true,
        class_schedules: {
          select: {
            class_id: true,
            classes: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const summaryMap = new Map<
      string,
      {
        class_id: string;
        class_name: string | null;
        total: number;
        present: number;
        absent: number;
        late: number;
      }
    >();

    for (const item of records) {
      const classId = item.class_schedules.class_id;
      const className = item.class_schedules.classes?.name ?? null;
      const existing = summaryMap.get(classId) ?? {
        class_id: classId,
        class_name: className,
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
      };

      existing.total += 1;
      const status = (item.status ?? '').toLowerCase();
      if (status === 'present') existing.present += 1;
      if (status === 'absent') existing.absent += 1;
      if (status === 'late') existing.late += 1;

      summaryMap.set(classId, existing);
    }

    return Array.from(summaryMap.values()).map((it) => ({
      ...it,
      attendance_rate:
        it.total > 0 ? Number(((it.present / it.total) * 100).toFixed(2)) : 0,
    }));
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

  private resolveWeights(
    weights?: Partial<GradeWeightConfig>,
  ): GradeWeightConfig {
    const merged: GradeWeightConfig = {
      assignment: weights?.assignment ?? DEFAULT_GRADE_WEIGHTS.assignment,
      exam: weights?.exam ?? DEFAULT_GRADE_WEIGHTS.exam,
      attendance: weights?.attendance ?? DEFAULT_GRADE_WEIGHTS.attendance,
    };

    const sum = merged.assignment + merged.exam + merged.attendance;
    if (Math.abs(sum - 1) > 0.0001) {
      throw new BadRequestException('Tổng trọng số phải bằng 1');
    }

    return merged;
  }

  private async calculateAssignmentPercent(studentId: string, classId: string) {
    const assignments = await this.prisma.assignments.findMany({
      where: { class_id: classId },
      select: {
        id: true,
        max_score: true,
        submissions: {
          where: {
            student_id: studentId,
            score: { not: null },
          },
          orderBy: { submitted_at: 'desc' },
          take: 1,
          select: { score: true },
        },
      },
    });

    const graded = assignments
      .map((assignment) => {
        const score = Number(assignment.submissions[0]?.score ?? 0);
        const max = Number(assignment.max_score ?? 10);
        if (max <= 0) {
          return null;
        }

        return Math.min(100, Number(((score / max) * 100).toFixed(2)));
      })
      .filter((item): item is number => item !== null);

    if (graded.length === 0) {
      return 0;
    }

    return Number(
      (graded.reduce((sum, value) => sum + value, 0) / graded.length).toFixed(
        2,
      ),
    );
  }

  private async calculateExamPercent(studentId: string, classId: string) {
    const sessions = await this.prisma.exam_sessions.findMany({
      where: {
        student_id: studentId,
        exams: {
          exam_classes: {
            some: { class_id: classId },
          },
        },
      },
      include: {
        exams: {
          select: {
            total_score: true,
          },
        },
      },
      orderBy: { started_at: 'desc' },
    });

    if (sessions.length === 0) {
      return 0;
    }

    const percents = sessions.map((session) => {
      const total = Number(session.exams.total_score ?? 100);
      const raw = Number(
        session.final_score ?? session.auto_score ?? session.manual_score ?? 0,
      );
      if (total <= 0) {
        return 0;
      }

      return Math.min(100, Number(((raw / total) * 100).toFixed(2)));
    });

    return Number(
      (
        percents.reduce((sum, value) => sum + value, 0) / percents.length
      ).toFixed(2),
    );
  }

  private async calculateAttendanceRateForClass(
    studentId: string,
    classId: string,
  ) {
    const records = await this.prisma.attendances.findMany({
      where: {
        student_id: studentId,
        class_schedules: { class_id: classId },
      },
      select: { status: true },
    });

    if (records.length === 0) {
      return 0;
    }

    const presentCount = records.filter((record) => {
      const status = (record.status ?? '').toLowerCase();
      return status === 'present' || status === 'late' || status === 'excused';
    }).length;

    return Number(((presentCount / records.length) * 100).toFixed(2));
  }
}
