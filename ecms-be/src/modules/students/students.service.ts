import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

interface GetMyClassesParams {
  studentId: string;
  status?: string;
  skip: number;
  take: number;
}

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(studentId: string) {
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
        status: true,
        created_at: true,
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
        },
      },
    });
  }
}
