import { AppErrorCode } from '../../../common/api/app-error-code.enum.js';
import { AppException } from '../../../common/api/app-exception.js';
import {
  Inject,
  Injectable,
  Optional,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { RedisService } from '../../../common/redis/redis.service';
import { CreateClassDto } from '../dto/create-class.dto.js';
import {
  CLASS_NOTIFICATION_PUBLISHER,
  type ClassNotificationPublisher,
} from '../contracts/class-notification.publisher.js';
import { type GetClassesParams } from '../contracts/classes-lifecycle.contract.js';
import {
  NotificationRefType,
  NotificationType,
} from '../../notifications/notification.constants.js';

@Injectable()
export class ClassesLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @Optional()
    @Inject(CLASS_NOTIFICATION_PUBLISHER)
    private readonly notificationPublisher?: ClassNotificationPublisher,
  ) {}

  async createClass(dto: CreateClassDto, actorId: string) {
    const course = await this.prisma.courses.findUnique({
      where: { id: dto.course_id },
      select: { id: true },
    });

    if (!course) {
      throw new AppException({ code: AppErrorCode.BAD_REQUEST, errorKey: 'class.bad_request', message: 'course_id không tồn tại' });
    }

    if (dto.teacher_id) {
      const teacher = await this.prisma.users.findUnique({
        where: { id: dto.teacher_id },
        select: { id: true },
      });
      if (!teacher) {
        throw new AppException({ code: AppErrorCode.BAD_REQUEST, errorKey: 'class.bad_request', message: 'teacher_id không tồn tại' });
      }
    }

    const created = await this.prisma.classes.create({
      data: {
        id: randomUUID(),
        course_id: dto.course_id,
        teacher_id: dto.teacher_id,
        name: dto.name,
        max_students: dto.max_students,
        start_date: dto.start_date ? new Date(dto.start_date) : null,
        end_date: dto.end_date ? new Date(dto.end_date) : null,
        status: dto.status ?? 'active',
        created_at: new Date(),
      } as unknown as Prisma.classesUncheckedCreateInput,
    });

    if (
      dto.teacher_id &&
      dto.teacher_id !== actorId &&
      this.notificationPublisher
    ) {
      await this.notificationPublisher.create({
        user_id: dto.teacher_id,
        type: NotificationType.CLASS_ASSIGNED_TEACHER,
        title: 'Bạn được phân công lớp mới',
        body: `Bạn được phân công phụ trách lớp: ${created.name ?? 'Lớp học mới'}`,
        ref_type: NotificationRefType.CLASS,
        ref_id: created.id,
      });
    }

    if (created.teacher_id) {
      await this.redis.invalidateTeacherDashboardCache(created.teacher_id);
    }

    return created;
  }

  async getClasses(params: GetClassesParams) {
    await this.ensureRole(params.actorId, ['admin', 'teacher']);

    const where: {
      course_id?: string;
      teacher_id?: string;
      status?: string;
      OR?: Array<
        | { name: { contains: string; mode: 'insensitive' } }
        | { courses: { name: { contains: string; mode: 'insensitive' } } }
      >;
    } = {};

    if (params.courseId) where.course_id = params.courseId;
    if (params.teacherId) where.teacher_id = params.teacherId;

    const isAdmin = await this.hasRole(params.actorId, 'admin');
    if (!isAdmin) {
      where.teacher_id = params.actorId;
    }

    if (params.status) where.status = params.status;
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { courses: { name: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.classes.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { created_at: 'desc' },
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
          _count: {
            select: {
              enrollments: true,
              class_schedules: true,
            },
          },
        },
      }),
      this.prisma.classes.count({ where }),
    ]);

    return {
      data: items,
      total,
      skip: params.skip,
      take: params.take,
      hasMore: params.skip + params.take < total,
    };
  }

  private async hasRole(userId: string, roleName: string) {
    const row = await this.prisma.user_roles.findFirst({
      where: {
        user_id: userId,
        roles: {
          name: roleName,
        },
      },
      select: { user_id: true },
    });
    return !!row;
  }

  private async ensureRole(userId: string, roles: string[]) {
    const checks = await Promise.all(roles.map((r) => this.hasRole(userId, r)));
    if (!checks.some(Boolean)) {
      throw new AppException({ code: AppErrorCode.FORBIDDEN, errorKey: 'class.forbidden', message: 'Bạn không có quyền truy cập' });
    }
  }
}





