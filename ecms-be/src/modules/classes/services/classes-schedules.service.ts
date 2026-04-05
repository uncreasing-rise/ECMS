import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { RecordAttendanceDto } from '../dto/record-attendance.dto.js';
import { CreateClassScheduleDto } from '../dto/create-class-schedule.dto.js';
import { UpdateClassScheduleDto } from '../dto/update-class-schedule.dto.js';
import {
  CLASS_NOTIFICATION_PUBLISHER,
  type ClassNotificationPublisher,
} from '../contracts/class-notification.publisher.js';

@Injectable()
export class ClassesSchedulesService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    @Inject(CLASS_NOTIFICATION_PUBLISHER)
    private readonly notificationsService?: ClassNotificationPublisher,
  ) {}

  async getClassSchedules(
    classId: string,
    actorId: string,
    from?: string,
    to?: string,
  ) {
    await this.ensureCanViewClass(classId, actorId);

    const where: {
      class_id: string;
      starts_at?: {
        gte?: Date;
        lte?: Date;
      };
    } = { class_id: classId };

    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;

    if (fromDate || toDate) {
      where.starts_at = {};
      if (fromDate) where.starts_at.gte = fromDate;
      if (toDate) where.starts_at.lte = toDate;
    }

    return this.prisma.class_schedules.findMany({
      where,
      orderBy: { starts_at: 'asc' },
      include: {
        rooms: true,
      },
    });
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
      throw new NotFoundException('Khong tim thay slot hoc trong lop');
    }

    return this.prisma.attendances.findMany({
      where: { schedule_id: scheduleId },
      include: {
        users_attendances_student_idTousers: {
          select: { id: true, full_name: true, email: true },
        },
        users_attendances_recorded_byTousers: {
          select: { id: true, full_name: true, email: true },
        },
      },
      orderBy: { recorded_at: 'desc' },
    });
  }

  async recordScheduleAttendance(
    classId: string,
    scheduleId: string,
    dto: RecordAttendanceDto,
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
      throw new NotFoundException('Khong tim thay slot hoc trong lop');
    }

    if (!dto.records.length) {
      throw new BadRequestException('Danh sach diem danh khong duoc rong');
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
      throw new BadRequestException(
        `Cac student_id khong thuoc lop hoac khong active: ${invalidStudents.join(', ')}`,
      );
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
      type: 'attendance_updated',
      title: 'Diem danh da cap nhat',
      body: 'Diem danh buoi hoc vua duoc cap nhat.',
      ref_type: 'schedule',
      ref_id: scheduleId,
    });

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
        throw new BadRequestException('room_id khong ton tai');
      }
    }

    const startsAt = new Date(dto.starts_at);
    const endsAt = new Date(dto.ends_at);
    if (startsAt >= endsAt) {
      throw new BadRequestException('starts_at phai nho hon ends_at');
    }

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
      type: 'class_schedule_created',
      title: 'Co lich hoc moi',
      body: 'Lop cua ban vua duoc them lich hoc moi.',
      ref_type: 'class_schedule',
      ref_id: created.id,
    });

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
      select: { id: true, starts_at: true, ends_at: true },
    });
    if (!existing) {
      throw new NotFoundException('Khong tim thay lich hoc');
    }

    if (dto.room_id !== undefined && dto.room_id !== null) {
      const room = await this.prisma.rooms.findUnique({
        where: { id: dto.room_id },
        select: { id: true },
      });
      if (!room) {
        throw new BadRequestException('room_id khong ton tai');
      }
    }

    const newStartsAt = dto.starts_at
      ? new Date(dto.starts_at)
      : existing.starts_at;
    const newEndsAt = dto.ends_at ? new Date(dto.ends_at) : existing.ends_at;
    if (newStartsAt >= newEndsAt) {
      throw new BadRequestException('starts_at phai nho hon ends_at');
    }

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
      type: 'class_schedule_updated',
      title: 'Lich hoc duoc cap nhat',
      body: 'Lich hoc cua lop vua duoc cap nhat.',
      ref_type: 'class_schedule',
      ref_id: scheduleId,
    });

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
      throw new NotFoundException('Khong tim thay lich hoc');
    }

    try {
      await this.prisma.class_schedules.delete({ where: { id: scheduleId } });

      await this.notifyClassStudents(classId, {
        type: 'class_schedule_deleted',
        title: 'Lich hoc bi huy',
        body: 'Mot lich hoc cua lop vua bi huy.',
        ref_type: 'class_schedule',
        ref_id: scheduleId,
      });

      return { message: 'Xoa lich hoc thanh cong' };
    } catch {
      throw new BadRequestException(
        'Khong the xoa lich hoc vi da co du lieu lien quan',
      );
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
      throw new NotFoundException('Khong tim thay lop hoc');
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
      throw new ForbiddenException('Ban khong co quyen quan ly lop hoc');
    }

    if (!isAdmin && isTeacher && existing.teacher_id !== actorId) {
      throw new ForbiddenException(teacherMessage);
    }
  }

  private async ensureCanViewClass(classId: string, actorId: string) {
    const classItem = await this.prisma.classes.findUnique({
      where: { id: classId },
      select: { id: true, teacher_id: true },
    });

    if (!classItem) {
      throw new NotFoundException('Khong tim thay lop hoc');
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

    throw new ForbiddenException('Ban khong co quyen truy cap lop hoc nay');
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

  private async notifyClassStudents(
    classId: string,
    payload: {
      type: string;
      title: string;
      body: string;
      ref_type?: string;
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
}
