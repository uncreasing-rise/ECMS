import { AppErrorCode } from '../../../common/api/app-error-code.enum.js';
import { AppException } from '../../../common/api/app-exception.js';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { RedisService } from '../../../common/redis/redis.service';
import { ClassRecordAttendanceDto } from '../dto/record-attendance.dto.js';
import { CreateClassScheduleDto } from '../dto/create-class-schedule.dto.js';
import { UpdateClassScheduleDto } from '../dto/update-class-schedule.dto.js';
import {
  CLASS_NOTIFICATION_PUBLISHER,
  type ClassNotificationPublisher,
} from '../contracts/class-notification.publisher.js';
import {
  NotificationRefType,
  NotificationType,
} from '../../notifications/notification.constants.js';

interface GetClassCalendarParams {
  actorId: string;
  view?: 'week' | 'month';
  date?: Date;
  from?: Date;
  to?: Date;
  classId?: string;
  teacherId?: string;
  roomId?: string;
}

@Injectable()
export class ClassesSchedulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @Optional()
    @Inject(CLASS_NOTIFICATION_PUBLISHER)
    private readonly notificationsService?: ClassNotificationPublisher,
  ) {}

  async getClassSchedules(
    classId: string,
    actorId: string,
    from?: Date,
    to?: Date,
  ) {
    await this.ensureCanViewClass(classId, actorId);

    const where: {
      class_id: string;
      starts_at?: {
        gte?: Date;
        lte?: Date;
      };
    } = { class_id: classId };

    if (from || to) {
      where.starts_at = {};
      if (from) where.starts_at.gte = from;
      if (to) where.starts_at.lte = to;
    }

    return this.prisma.class_schedules.findMany({
      where,
      orderBy: { starts_at: 'asc' },
      include: {
        rooms: true,
      },
    });
  }

  async getClassCalendar(params: GetClassCalendarParams) {
    const isAdmin = await this.hasRole(params.actorId, 'admin');
    const isTeacher = await this.hasRole(params.actorId, 'teacher');

    if (!isAdmin && !isTeacher) {
      throw new AppException({
        code: AppErrorCode.FORBIDDEN,
        errorKey: 'class.forbidden',
        message: 'Bạn không có quyền truy cập lớp học này',
      });
    }

    const range = this.resolveCalendarRange(
      params.view,
      params.date,
      params.from,
      params.to,
    );

    const where: Prisma.class_schedulesWhereInput = {
      starts_at: { lt: range.end },
      ends_at: { gt: range.start },
    };

    if (!isAdmin) {
      where.classes = { teacher_id: params.actorId };
    }

    if (params.classId) {
      where.class_id = params.classId;
    }

    if (params.teacherId) {
      where.classes = {
        ...(where.classes ?? {}),
        teacher_id: params.teacherId,
      } as Prisma.classesWhereInput;
    }

    if (params.roomId) {
      where.room_id = params.roomId;
    }

    const data = await this.prisma.class_schedules.findMany({
      where,
      orderBy: [{ starts_at: 'asc' }, { ends_at: 'asc' }],
      include: {
        rooms: true,
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
    });

    return {
      view: params.view ?? 'month',
      range,
      total: data.length,
      data,
    };
  }

  async getScheduleAttendance(
    classId: string,
    scheduleId: string,
    actorId: string,
  ) {
    await this.ensureCanManageClass(
      classId,
      actorId,
      'Giao vien chi duoc xem diem danh lop cua minh',
    );

    const schedule = await this.prisma.class_schedules.findFirst({
      where: { id: scheduleId, class_id: classId },
      select: { id: true },
    });
    if (!schedule) {
      throw new AppException({
        code: AppErrorCode.NOT_FOUND,
        errorKey: 'class.not_found',
        message: 'Khong tim thay slot hoc trong lop',
      });
    }

    return this.prisma.attendances.findMany({
      where: { schedule_id: scheduleId },
      include: {
        users_attendances_student_idTousers: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
      orderBy: { recorded_at: 'desc' },
    });
  }

  async recordScheduleAttendance(
    classId: string,
    scheduleId: string,
    dto: ClassRecordAttendanceDto,
    actorId: string,
  ) {
    await this.ensureCanManageClass(
      classId,
      actorId,
      'Giao vien chi duoc diem danh lop cua minh',
    );

    const schedule = await this.prisma.class_schedules.findFirst({
      where: { id: scheduleId, class_id: classId },
      select: { id: true },
    });
    if (!schedule) {
      throw new AppException({
        code: AppErrorCode.NOT_FOUND,
        errorKey: 'class.not_found',
        message: 'Khong tim thay slot hoc trong lop',
      });
    }

    if (!dto.records.length) {
      throw new AppException({
        code: AppErrorCode.BAD_REQUEST,
        errorKey: 'class.bad_request',
        message: 'Danh sach diem danh khong duoc rong',
      });
    }

    const uniqueStudentIds = [
      ...new Set(dto.records.map((it) => it.student_id)),
    ];
    const enrolledStudents = await this.prisma.enrollments.findMany({
      where: {
        class_id: classId,
        student_id: { in: uniqueStudentIds },
        status: 'active',
      },
      select: { student_id: true },
    });

    const enrolledSet = new Set(enrolledStudents.map((it) => it.student_id));
    const invalidStudents = uniqueStudentIds.filter(
      (id) => !enrolledSet.has(id),
    );
    if (invalidStudents.length) {
      throw new AppException({
        code: AppErrorCode.BAD_REQUEST,
        errorKey: 'class.bad_request',
        message: `Cac student_id khong thuoc lop hoac khong active: ${invalidStudents.join(', ')}`,
      });
    }

    await this.prisma.$transaction(async (tx) => {
      for (const record of dto.records) {
        const existing = await tx.attendances.findFirst({
          where: { schedule_id: scheduleId, student_id: record.student_id },
          select: { id: true },
        });

        if (existing) {
          await tx.attendances.update({
            where: { id: existing.id },
            data: {
              status: record.status,
              note: record.note,
              recorded_by: actorId,
              recorded_at: new Date(),
            },
          });
        } else {
          await tx.attendances.create({
            data: {
              id: randomUUID(),
              schedule_id: scheduleId,
              student_id: record.student_id,
              status: record.status,
              note: record.note,
              recorded_by: actorId,
              recorded_at: new Date(),
            },
          });
        }
      }
    });

    await this.notifyClassStudents(classId, {
      type: NotificationType.ATTENDANCE_UPDATED,
      title: 'Diem danh da cap nhat',
      body: 'Diem danh buoi hoc vua duoc cap nhat.',
      ref_type: NotificationRefType.SCHEDULE,
      ref_id: scheduleId,
    });

    await this.invalidateTeacherDashboardByClass(classId);

    return {
      message: 'Diem danh thanh cong',
      schedule_id: scheduleId,
      processed_count: dto.records.length,
    };
  }

  async createClassSchedule(
    classId: string,
    dto: CreateClassScheduleDto,
    actorId: string,
  ) {
    await this.ensureCanManageClass(
      classId,
      actorId,
      'Giao vien chi duoc tao lich cho lop cua minh',
    );

    if (dto.room_id) {
      const room = await this.prisma.rooms.findUnique({
        where: { id: dto.room_id },
        select: { id: true },
      });
      if (!room) {
        throw new AppException({
          code: AppErrorCode.BAD_REQUEST,
          errorKey: 'class.bad_request',
          message: 'room_id khong ton tai',
        });
      }
    }

    const startsAt = new Date(dto.starts_at);
    const endsAt = new Date(dto.ends_at);
    if (startsAt >= endsAt) {
      throw new AppException({
        code: AppErrorCode.BAD_REQUEST,
        errorKey: 'class.bad_request',
        message: 'starts_at phai nho hon ends_at',
      });
    }

    const classItem = await this.prisma.classes.findUnique({
      where: { id: classId },
      select: { id: true, teacher_id: true },
    });

    if (!classItem) {
      throw new AppException({
        code: AppErrorCode.NOT_FOUND,
        errorKey: 'class.not_found',
        message: 'Không tìm thấy lớp học',
      });
    }

    await this.ensureNoScheduleConflict({
      classId,
      teacherId: classItem.teacher_id,
      roomId: dto.room_id,
      startsAt,
      endsAt,
    });

    const created = await this.prisma.class_schedules.create({
      data: {
        id: randomUUID(),
        class_id: classId,
        room_id: dto.room_id,
        session_number: dto.session_number,
        starts_at: startsAt,
        ends_at: endsAt,
        note: dto.note,
      },
    });

    await this.notifyClassStudents(classId, {
      type: NotificationType.CLASS_SCHEDULE_CREATED,
      title: 'Co lich hoc moi',
      body: 'Lop cua ban vua duoc them lich hoc moi.',
      ref_type: NotificationRefType.CLASS_SCHEDULE,
      ref_id: created.id,
    });

    await this.invalidateTeacherDashboardByClass(classId);

    return created;
  }

  async updateClassSchedule(
    classId: string,
    scheduleId: string,
    dto: UpdateClassScheduleDto,
    actorId: string,
  ) {
    await this.ensureCanManageClass(
      classId,
      actorId,
      'Giao vien chi duoc sua lich cua lop minh',
    );

    const existing = await this.prisma.class_schedules.findFirst({
      where: { id: scheduleId, class_id: classId },
      select: { id: true, room_id: true, starts_at: true, ends_at: true },
    });
    if (!existing) {
      throw new AppException({
        code: AppErrorCode.NOT_FOUND,
        errorKey: 'class.not_found',
        message: 'Khong tim thay lich hoc',
      });
    }

    const classItem = await this.prisma.classes.findUnique({
      where: { id: classId },
      select: { id: true, teacher_id: true },
    });

    if (!classItem) {
      throw new AppException({
        code: AppErrorCode.NOT_FOUND,
        errorKey: 'class.not_found',
        message: 'Khong tim thay lop hoc',
      });
    }

    if (dto.room_id !== undefined && dto.room_id !== null) {
      const room = await this.prisma.rooms.findUnique({
        where: { id: dto.room_id },
        select: { id: true },
      });
      if (!room) {
        throw new AppException({
          code: AppErrorCode.BAD_REQUEST,
          errorKey: 'class.bad_request',
          message: 'room_id khong ton tai',
        });
      }
    }

    const newStartsAt = dto.starts_at
      ? new Date(dto.starts_at)
      : existing.starts_at;
    const newEndsAt = dto.ends_at ? new Date(dto.ends_at) : existing.ends_at;
    if (newStartsAt >= newEndsAt) {
      throw new AppException({
        code: AppErrorCode.BAD_REQUEST,
        errorKey: 'class.bad_request',
        message: 'starts_at phai nho hon ends_at',
      });
    }

    await this.ensureNoScheduleConflict({
      classId,
      teacherId: classItem.teacher_id,
      roomId:
        dto.room_id === undefined
          ? (existing.room_id ?? undefined)
          : dto.room_id,
      startsAt: newStartsAt,
      endsAt: newEndsAt,
      excludeScheduleId: scheduleId,
    });

    const updated = await this.prisma.class_schedules.update({
      where: { id: scheduleId },
      data: {
        room_id: dto.room_id === undefined ? undefined : dto.room_id,
        session_number: dto.session_number,
        starts_at: dto.starts_at ? new Date(dto.starts_at) : undefined,
        ends_at: dto.ends_at ? new Date(dto.ends_at) : undefined,
        note: dto.note,
      },
    });

    await this.notifyClassStudents(classId, {
      type: NotificationType.CLASS_SCHEDULE_UPDATED,
      title: 'Lich hoc duoc cap nhat',
      body: 'Lich hoc cua lop vua duoc cap nhat.',
      ref_type: NotificationRefType.CLASS_SCHEDULE,
      ref_id: scheduleId,
    });

    await this.invalidateTeacherDashboardByClass(classId);

    return updated;
  }

  async deleteClassSchedule(
    classId: string,
    scheduleId: string,
    actorId: string,
  ) {
    await this.ensureCanManageClass(
      classId,
      actorId,
      'Giao vien chi duoc xoa lich cua lop minh',
    );

    const existing = await this.prisma.class_schedules.findFirst({
      where: { id: scheduleId, class_id: classId },
      select: { id: true },
    });
    if (!existing) {
      throw new AppException({
        code: AppErrorCode.NOT_FOUND,
        errorKey: 'class.not_found',
        message: 'Khong tim thay lich hoc',
      });
    }

    try {
      await this.prisma.class_schedules.delete({ where: { id: scheduleId } });

      await this.notifyClassStudents(classId, {
        type: NotificationType.CLASS_SCHEDULE_DELETED,
        title: 'Lich hoc bi huy',
        body: 'Mot lich hoc cua lop vua bi huy.',
        ref_type: NotificationRefType.CLASS_SCHEDULE,
        ref_id: scheduleId,
      });

      await this.invalidateTeacherDashboardByClass(classId);

      return { message: 'Xoa lich hoc thanh cong' };
    } catch {
      throw new AppException({
        code: AppErrorCode.BAD_REQUEST,
        errorKey: 'class.bad_request',
        message: 'Khong the xoa lich hoc vi da co du lieu lien quan',
      });
    }
  }

  private async ensureCanManageClass(
    classId: string,
    actorId: string,
    teacherMessage: string,
  ) {
    const existing = await this.prisma.classes.findUnique({
      where: { id: classId },
      select: { id: true, teacher_id: true },
    });

    if (!existing) {
      throw new AppException({
        code: AppErrorCode.NOT_FOUND,
        errorKey: 'class.not_found',
        message: 'Khong tim thay lop hoc',
      });
    }

    const actorRoles = await this.prisma.user_roles.findMany({
      where: { user_id: actorId },
      include: { roles: true },
    });
    const normalizedRoles = actorRoles
      .map((it) => it.roles?.name?.toLowerCase())
      .filter((it): it is string => !!it);

    const isAdmin = normalizedRoles.includes('admin');
    const isTeacher = normalizedRoles.includes('teacher');

    if (!isAdmin && !isTeacher) {
      throw new AppException({
        code: AppErrorCode.FORBIDDEN,
        errorKey: 'class.forbidden',
        message: 'Ban khong co quyen quan ly lop hoc',
      });
    }

    if (!isAdmin && isTeacher && existing.teacher_id !== actorId) {
      throw new AppException({
        code: AppErrorCode.FORBIDDEN,
        errorKey: 'class.forbidden',
        message: teacherMessage,
      });
    }
  }

  private async ensureCanViewClass(classId: string, actorId: string) {
    const classItem = await this.prisma.classes.findUnique({
      where: { id: classId },
      select: { id: true, teacher_id: true },
    });

    if (!classItem) {
      throw new AppException({
        code: AppErrorCode.NOT_FOUND,
        errorKey: 'class.not_found',
        message: 'Khong tim thay lop hoc',
      });
    }

    const isAdmin = await this.hasRole(actorId, 'admin');
    if (isAdmin) {
      return;
    }

    const isTeacher = await this.hasRole(actorId, 'teacher');
    if (isTeacher && classItem.teacher_id === actorId) {
      return;
    }

    const enrolled = await this.prisma.enrollments.findFirst({
      where: {
        class_id: classId,
        student_id: actorId,
        status: 'active',
      },
      select: { id: true },
    });

    if (enrolled) {
      return;
    }

    throw new AppException({
      code: AppErrorCode.FORBIDDEN,
      errorKey: 'class.forbidden',
      message: 'Ban khong co quyen truy cap lop hoc nay',
    });
  }

  private async hasRole(userId: string, roleName: string) {
    const role = await this.prisma.user_roles.findFirst({
      where: {
        user_id: userId,
        roles: {
          name: {
            equals: roleName,
            mode: 'insensitive',
          },
        },
      },
      select: { id: true },
    });

    return !!role;
  }

  private async ensureNoScheduleConflict(params: {
    classId: string;
    teacherId: string | null;
    roomId?: string | null;
    startsAt: Date;
    endsAt: Date;
    excludeScheduleId?: string;
  }) {
    const or: Prisma.class_schedulesWhereInput[] = [
      { class_id: params.classId },
    ];

    if (params.roomId) {
      or.push({ room_id: params.roomId });
    }

    if (params.teacherId) {
      or.push({ classes: { teacher_id: params.teacherId } });
    }

    const conflicts = await this.prisma.class_schedules.findMany({
      where: {
        ...(params.excludeScheduleId
          ? { id: { not: params.excludeScheduleId } }
          : {}),
        starts_at: { lt: params.endsAt },
        ends_at: { gt: params.startsAt },
        OR: or,
      },
      select: {
        id: true,
        class_id: true,
        room_id: true,
        starts_at: true,
        ends_at: true,
        classes: {
          select: {
            id: true,
            name: true,
            teacher_id: true,
          },
        },
        rooms: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!conflicts.length) {
      return;
    }

    const conflict = conflicts[0];
    const conflictType =
      conflict.room_id && params.roomId && conflict.room_id === params.roomId
        ? 'phong hoc'
        : conflict.classes?.teacher_id === params.teacherId
          ? 'giao vien'
          : 'lop hoc';

    throw new AppException({
      code: AppErrorCode.CONFLICT,
      errorKey: 'class.conflict',
      message: `Lich hoc bi trung ${conflictType} trong khoang thoi gian nay`,
    });
  }

  private resolveCalendarRange(
    view?: 'week' | 'month',
    date?: Date,
    from?: Date,
    to?: Date,
  ) {
    const start = from ?? this.getCalendarStart(view, date);
    const end = to ?? this.getCalendarEnd(view, start);

    return { start, end };
  }

  private getCalendarStart(view?: 'week' | 'month', date?: Date) {
    const anchor = date ? new Date(date) : new Date();

    if (view === 'month') {
      return new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    }

    const start = new Date(anchor);
    const day = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  private getCalendarEnd(view: 'week' | 'month' | undefined, start: Date) {
    const end = new Date(start);

    if (view === 'month') {
      end.setMonth(end.getMonth() + 1);
      end.setHours(0, 0, 0, 0);
      return end;
    }

    end.setDate(end.getDate() + 7);
    return end;
  }

  private async notifyClassStudents(
    classId: string,
    payload: {
      type: NotificationType;
      title: string;
      body: string;
      ref_type?: NotificationRefType;
      ref_id?: string;
    },
  ) {
    if (!this.notificationsService) {
      return;
    }

    const enrolled = await this.prisma.enrollments.findMany({
      where: { class_id: classId, status: 'active' },
      select: { student_id: true },
    });

    if (!enrolled.length) {
      return;
    }

    await this.notificationsService.createBulk(
      enrolled.map((it) => ({
        user_id: it.student_id,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        ref_type: payload.ref_type,
        ref_id: payload.ref_id,
      })),
    );
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
