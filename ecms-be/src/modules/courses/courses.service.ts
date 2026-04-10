import { AppErrorCode } from '../../common/api/app-error-code.enum.js';
import { AppException } from '../../common/api/app-exception.js';
import {
  Injectable,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { CreateCourseDto } from './dto/create-course.dto.js';
import { UpdateCourseDto } from './dto/update-course.dto.js';
import {
  NotificationRefType,
  NotificationType,
} from '../notifications/notification.constants.js';

export interface GetCoursesParams {
  search?: string;
  includeInactive?: boolean;
  skip: number;
  take: number;
}

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async createCourse(dto: CreateCourseDto) {
    const created = await this.prisma.courses.create({
      data: {
        id: randomUUID(),
        name: dto.name,
        description: dto.description,
        level: dto.level,
        total_sessions: dto.total_sessions,
        price: dto.price,
        is_active: dto.is_active ?? true,
        created_at: new Date(),
      },
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
    });

    await this.notifyAdminsCourseCreated(created.id, created.name);

    return created;
  }

  async updateCourse(courseId: string, dto: UpdateCourseDto) {
    const existing = await this.prisma.courses.findUnique({
      where: { id: courseId },
      select: { id: true },
    });

    if (!existing) {
      throw new AppException({ code: AppErrorCode.NOT_FOUND, errorKey: 'course.not_found', message: 'Không tìm thấy khóa học' });
    }

    const updated = await this.prisma.courses.update({
      where: { id: courseId },
      data: {
        name: dto.name,
        description: dto.description,
        level: dto.level,
        total_sessions: dto.total_sessions,
        price: dto.price,
        is_active: dto.is_active,
      },
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
    });

    await this.notifyTeachersCourseUpdated(updated.id, updated.name);

    return updated;
  }

  async deleteCourse(courseId: string) {
    const existing = await this.prisma.courses.findUnique({
      where: { id: courseId },
      select: { id: true, is_active: true },
    });

    if (!existing) {
      throw new AppException({ code: AppErrorCode.NOT_FOUND, errorKey: 'course.not_found', message: 'Không tìm thấy khóa học' });
    }

    if (existing.is_active === false) {
      return { message: 'Khóa học đã được tắt trước đó' };
    }

    const deactivated = await this.prisma.courses.update({
      where: { id: courseId },
      data: { is_active: false },
      select: {
        id: true,
        name: true,
        is_active: true,
      },
    });

    await this.notifyTeachersCourseDeactivated(deactivated.id, deactivated.name);

    return deactivated;
  }

  async getCourses(params: GetCoursesParams) {
    const where: Prisma.coursesWhereInput = {};

    if (!params.includeInactive) {
      where.is_active = true;
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
        { level: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.courses.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { created_at: 'desc' },
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
      }),
      this.prisma.courses.count({ where }),
    ]);

    return {
      data: items,
      total,
      skip: params.skip,
      take: params.take,
      hasMore: params.skip + params.take < total,
    };
  }

  async getCourseById(courseId: string) {
    const course = await this.prisma.courses.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        name: true,
        description: true,
        level: true,
        total_sessions: true,
        price: true,
        is_active: true,
        created_at: true,
        _count: {
          select: {
            classes: true,
            course_modules: true,
          },
        },
      },
    });

    if (!course) {
      throw new AppException({ code: AppErrorCode.NOT_FOUND, errorKey: 'course.not_found', message: 'Không tìm thấy khóa học' });
    }

    return course;
  }

  private async notifyAdminsCourseCreated(courseId: string, courseName: string) {
    try {
      const admins = await this.prisma.user_roles.findMany({
        where: {
          roles: {
            name: 'admin',
          },
        },
        select: {
          user_id: true,
        },
      });

      const adminIds = Array.from(new Set(admins.map((item) => item.user_id)));
      if (!adminIds.length) {
        return;
      }

      await this.notifications.createBulk(
        adminIds.map((userId) => ({
          user_id: userId,
          type: NotificationType.COURSE_CREATED,
          title: 'Khoa hoc moi duoc tao',
          body: `Khoa hoc "${courseName}" vua duoc tao trong he thong.`,
          ref_type: NotificationRefType.COURSE,
          ref_id: courseId,
        })),
      );
    } catch {
      // Course creation must not fail because notification delivery failed.
    }
  }

  private async notifyTeachersCourseUpdated(courseId: string, courseName: string) {
    try {
      const classes = await this.prisma.classes.findMany({
        where: {
          course_id: courseId,
          teacher_id: {
            not: null,
          },
        },
        select: {
          teacher_id: true,
        },
      });

      const teacherIds = Array.from(
        new Set(classes.map((item) => item.teacher_id).filter((id): id is string => Boolean(id))),
      );

      if (!teacherIds.length) {
        return;
      }

      await this.notifications.createBulk(
        teacherIds.map((userId) => ({
          user_id: userId,
          type: NotificationType.COURSE_UPDATED,
          title: 'Khoa hoc da duoc cap nhat',
          body: `Khoa hoc "${courseName}" da duoc cap nhat. Vui long kiem tra cac lop lien quan.`,
          ref_type: NotificationRefType.COURSE,
          ref_id: courseId,
        })),
      );
    } catch {
      // Course update must not fail because notification delivery failed.
    }
  }

  private async notifyTeachersCourseDeactivated(
    courseId: string,
    courseName: string,
  ) {
    try {
      const classes = await this.prisma.classes.findMany({
        where: {
          course_id: courseId,
          teacher_id: {
            not: null,
          },
        },
        select: {
          teacher_id: true,
        },
      });

      const teacherIds = Array.from(
        new Set(classes.map((item) => item.teacher_id).filter((id): id is string => Boolean(id))),
      );

      if (!teacherIds.length) {
        return;
      }

      await this.notifications.createBulk(
        teacherIds.map((userId) => ({
          user_id: userId,
          type: NotificationType.COURSE_DEACTIVATED,
          title: 'Khoa hoc da tam ngung',
          body: `Khoa hoc "${courseName}" da duoc tam ngung kich hoat.`,
          ref_type: NotificationRefType.COURSE,
          ref_id: courseId,
        })),
      );
    } catch {
      // Course deactivation must not fail because notification delivery failed.
    }
  }
}





