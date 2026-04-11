import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppErrorCode } from '../../common/api/app-error-code.enum';
import { AppException } from '../../common/api/app-exception';
import { StudentsAcademicService } from './students-academic.service';

@Injectable()
export class StudentsAnalyticsService {
  private readonly logger = new Logger(StudentsAnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly academicService: StudentsAcademicService,
  ) {}

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
      throw new AppException({
        code: AppErrorCode.NOT_FOUND,
        errorKey: 'student.not_found',
        message: 'Không tìm thấy lớp học',
      });
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
          this.academicService.calculateAttendanceRateForClass(
            enrollment.student_id,
            classId,
          ),
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
}
