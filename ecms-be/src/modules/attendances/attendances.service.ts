import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { RecordAttendanceDto } from './dto/record-attendance.dto.js';

/**
 * FR-ECM-040: Per-session attendance recording (present/absent/excused/late)
 * FR-ECM-041: Attendance reporting by student, class, date range
 * FR-ECM-042: Auto-alert when student has >= N consecutive absences
 * FR-ECM-043: Makeup session tracking (foundation)
 */
@Injectable()
export class AttendancesService {
  private readonly CONSECUTIVE_ABSENCE_THRESHOLD = 3; // Alert after 3 consecutive absences

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * FR-ECM-040: Record attendance for a student in a session
   */
  async recordAttendance(dto: RecordAttendanceDto, recordedBy: string) {
    // Validate schedule exists
    const schedule = await this.prisma.class_schedules.findUnique({
      where: { id: dto.schedule_id },
      select: { id: true, class_id: true, starts_at: true },
    });

    if (!schedule) {
      throw new NotFoundException('Không tìm thấy buổi học');
    }

    // Validate student is enrolled in the class
    const enrollment = await this.prisma.enrollments.findFirst({
      where: {
        class_id: schedule.class_id,
        student_id: dto.student_id,
        status: 'active',
      },
      select: { id: true },
    });

    if (!enrollment) {
      throw new BadRequestException('Học viên không được đăng ký lớp này');
    }

    // Check if attendance already recorded
    const existing = await this.prisma.attendances.findFirst({
      where: {
        schedule_id: dto.schedule_id,
        student_id: dto.student_id,
      },
      select: { id: true },
    });

    if (existing) {
      // Update existing attendance
      return this.prisma.attendances.update({
        where: { id: existing.id },
        data: {
          status: dto.status,
          note: dto.note,
          recorded_by: recordedBy,
          recorded_at: new Date(),
        },
      });
    }

    // Create new attendance record
    const attendance = await this.prisma.attendances.create({
      data: {
        id: randomUUID(),
        schedule_id: dto.schedule_id,
        student_id: dto.student_id,
        status: dto.status,
        note: dto.note,
        recorded_by: recordedBy,
        recorded_at: new Date(),
      },
    });

    // FR-ECM-042: Check for consecutive absences
    if (
      dto.status === 'absent' ||
      dto.status === 'missing' ||
      (dto.status && !['present', 'late', 'excused'].includes(dto.status))
    ) {
      await this.checkAndAlertOnConsecutiveAbsences(
        dto.student_id,
        schedule.class_id,
      );
    }

    return attendance;
  }

  /**
   * FR-ECM-042: Get consecutive absence count for a student
   */
  async getConsecutiveAbsenceCount(
    studentId: string,
    classId: string,
  ): Promise<number> {
    const schedules = await this.prisma.class_schedules.findMany({
      where: { class_id: classId },
      orderBy: { starts_at: 'desc' },
      select: { id: true, starts_at: true },
      take: 10, // Check last 10 sessions
    });

    if (schedules.length === 0) return 0;

    const attendances = await this.prisma.attendances.findMany({
      where: {
        student_id: studentId,
        schedule_id: { in: schedules.map((s) => s.id) },
      },
      select: { schedule_id: true, status: true },
    });

    // Map attendance by schedule
    const attendanceMap = new Map(
      attendances.map((a) => [a.schedule_id, a.status]),
    );

    // Count consecutive absences from most recent
    let count = 0;
    for (const schedule of schedules) {
      const status = attendanceMap.get(schedule.id);
      if (
        !status ||
        (status !== 'present' && status !== 'late' && status !== 'excused')
      ) {
        count++;
      } else {
        break; // Streak broken
      }
    }

    return count;
  }

  /**
   * FR-ECM-042: Check for consecutive absences and send alert
   */
  private async checkAndAlertOnConsecutiveAbsences(
    studentId: string,
    classId: string,
  ) {
    const consecutiveAbsences = await this.getConsecutiveAbsenceCount(
      studentId,
      classId,
    );

    if (consecutiveAbsences >= this.CONSECUTIVE_ABSENCE_THRESHOLD) {
      // Get student info
      const student = await this.prisma.users.findUnique({
        where: { id: studentId },
        select: { id: true, full_name: true },
      });

      if (student) {
        // Notify student
        await this.notificationsService.create({
          user_id: studentId,
          type: 'attendance_alert',
          title: 'Cảnh báo chuyên cần',
          body: `Bạn đã vắng ${consecutiveAbsences} buổi liên tiếp. Vui lòng liên hệ giáo viên.`,
          ref_type: 'class',
          ref_id: classId,
        });

        // Notify class teachers/admins
        const classInfo = await this.prisma.classes.findUnique({
          where: { id: classId },
          select: { teacher_id: true, name: true },
        });

        if (classInfo?.teacher_id) {
          await this.notificationsService.create({
            user_id: classInfo.teacher_id,
            type: 'student_absence_alert',
            title: 'Cảnh báo học viên vắng nhiều',
            body: `Học viên ${student.full_name} đã vắng ${consecutiveAbsences} buổi liên tiếp trong lớp ${classInfo.name}.`,
            ref_type: 'student',
            ref_id: studentId,
          });
        }
      }
    }
  }

  /**
   * FR-ECM-041: Get attendance report by student
   */
  async getStudentAttendanceReport(params: {
    student_id: string;
    class_id?: string;
    from_date?: Date;
    to_date?: Date;
  }) {
    const where: Prisma.attendancesWhereInput = {
      student_id: params.student_id,
    };
    const scheduleFilter: Prisma.class_schedulesWhereInput = {};

    if (params.class_id) {
      scheduleFilter.class_id = params.class_id;
    }

    if (params.from_date || params.to_date) {
      scheduleFilter.starts_at = {
        ...(params.from_date && { gte: params.from_date }),
        ...(params.to_date && { lte: params.to_date }),
      };
    }

    if (Object.keys(scheduleFilter).length > 0) {
      where.class_schedules = scheduleFilter;
    }

    const attendances = await this.prisma.attendances.findMany({
      where,
      include: {
        class_schedules: {
          include: {
            classes: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { recorded_at: 'desc' },
    });

    // Aggregate statistics
    const stats = {
      total_sessions: attendances.length,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    };

    attendances.forEach((a) => {
      if (a.status === 'present') stats.present++;
      else if (a.status === 'absent' || a.status === 'missing') stats.absent++;
      else if (a.status === 'late') stats.late++;
      else if (a.status === 'excused') stats.excused++;
    });

    const attendanceRate =
      stats.total_sessions === 0
        ? 0
        : Number(
            (
              ((stats.present + stats.late) / stats.total_sessions) *
              100
            ).toFixed(2),
          );

    return {
      student_id: params.student_id,
      attendance_rate: attendanceRate,
      stats,
      records: attendances.map((a) => ({
        id: a.id,
        schedule_id: a.schedule_id,
        class_name: a.class_schedules.classes.name,
        status: a.status,
        recorded_at: a.recorded_at,
        note: a.note,
      })),
    };
  }

  /**
   * FR-ECM-041: Get attendance report by class
   */
  async getClassAttendanceReport(params: {
    class_id: string;
    from_date?: Date;
    to_date?: Date;
  }) {
    const schedules = await this.prisma.class_schedules.findMany({
      where: {
        class_id: params.class_id,
        ...(params.from_date || params.to_date
          ? {
              starts_at: {
                ...(params.from_date && { gte: params.from_date }),
                ...(params.to_date && { lte: params.to_date }),
              },
            }
          : {}),
      },
      select: { id: true },
    });

    const scheduleIds = schedules.map((s) => s.id);

    // Get all students in class
    const enrollments = await this.prisma.enrollments.findMany({
      where: { class_id: params.class_id, status: 'active' },
      include: {
        users: { select: { id: true, full_name: true } },
      },
    });

    // Get attendance records
    const attendances = await this.prisma.attendances.findMany({
      where: {
        schedule_id: { in: scheduleIds },
      },
    });

    // Compute per-student statistics
    const studentStats = enrollments.map((enrollment) => {
      const studentAttendances = attendances.filter(
        (a) => a.student_id === enrollment.student_id,
      );

      const stats = {
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
      };

      studentAttendances.forEach((a) => {
        if (a.status === 'present') stats.present++;
        else if (a.status === 'absent' || a.status === 'missing')
          stats.absent++;
        else if (a.status === 'late') stats.late++;
        else if (a.status === 'excused') stats.excused++;
      });

      const totalSessions = scheduleIds.length;
      const attendanceRate =
        totalSessions === 0
          ? 0
          : Number(
              (((stats.present + stats.late) / totalSessions) * 100).toFixed(2),
            );

      return {
        student_id: enrollment.student_id,
        student_name: enrollment.users.full_name,
        attendance_rate: attendanceRate,
        stats,
        missing_sessions: totalSessions - studentAttendances.length,
      };
    });

    // Overall class statistics
    const classStats = {
      total_students: enrollments.length,
      total_sessions: scheduleIds.length,
      avg_attendance_rate:
        enrollments.length === 0
          ? 0
          : Number(
              (
                studentStats.reduce((sum, s) => sum + s.attendance_rate, 0) /
                enrollments.length
              ).toFixed(2),
            ),
    };

    return {
      class_id: params.class_id,
      class_stats: classStats,
      students: studentStats.sort(
        (a, b) => b.attendance_rate - a.attendance_rate,
      ),
    };
  }

  /**
   * FR-ECM-041: Get attendance report by date range
   */
  async getAttendanceReportByPeriod(params: {
    from_date: Date;
    to_date: Date;
    class_id?: string;
    student_id?: string;
  }) {
    const where: Prisma.attendancesWhereInput = {
      recorded_at: {
        gte: params.from_date,
        lte: params.to_date,
      },
    };

    if (params.class_id) {
      where.class_schedules = {
        class_id: params.class_id,
      };
    }

    if (params.student_id) {
      where.student_id = params.student_id;
    }

    const attendances = await this.prisma.attendances.findMany({
      where,
      include: {
        users_attendances_student_idTousers: {
          select: { id: true, full_name: true },
        },
        class_schedules: {
          include: {
            classes: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { recorded_at: 'desc' },
    });

    // Group by date
    type PeriodAttendanceRecord = (typeof attendances)[number];
    const byDate = new Map<string, PeriodAttendanceRecord[]>();
    attendances.forEach((a) => {
      const dateKey = a.recorded_at
        ? a.recorded_at.toISOString().split('T')[0]
        : 'unknown';
      if (!byDate.has(dateKey)) {
        byDate.set(dateKey, []);
      }
      byDate.get(dateKey)!.push(a);
    });

    return {
      period: {
        from: params.from_date,
        to: params.to_date,
      },
      total_records: attendances.length,
      data: Array.from(byDate.entries())
        .map(([date, records]) => ({
          date,
          count: records.length,
          records: records.map((r) => ({
            student_name: r.users_attendances_student_idTousers.full_name,
            class_name: r.class_schedules.classes.name,
            status: r.status,
            note: r.note,
          })),
        }))
        .sort((a, b) => b.date.localeCompare(a.date)),
    };
  }

  /**
   * FR-ECM-043: Register student for makeup session (foundation)
   * Note: Requires makeup_sessions table in schema for full implementation
   */
  async acceptMakeupSession(
    studentId: string,
    originalSessionId: string,
    makeupSessionId: string,
  ) {
    // Validate original session exists and student is absent
    const originalAttendance = await this.prisma.attendances.findFirst({
      where: {
        schedule_id: originalSessionId,
        student_id: studentId,
      },
      select: { status: true },
    });

    if (!originalAttendance) {
      throw new NotFoundException(
        'Không tìm thấy bản ghi điểm danh cho buổi học này',
      );
    }

    if (
      originalAttendance.status === 'present' ||
      originalAttendance.status === 'late'
    ) {
      throw new BadRequestException(
        'Học viên đã có mặt buổi này, không cần dự bù giờ',
      );
    }

    // Validate makeup session exists
    const makeupSession = await this.prisma.class_schedules.findUnique({
      where: { id: makeupSessionId },
      include: {
        classes: { select: { id: true, name: true } },
      },
    });

    if (!makeupSession) {
      throw new NotFoundException('Không tìm thấy buổi học bù');
    }

    // For now, just mark attendance as present for makeup session
    // Full implementation would require makeup_sessions table
    // Find existing or create new
    const existing = await this.prisma.attendances.findFirst({
      where: {
        schedule_id: makeupSessionId,
        student_id: studentId,
      },
    });

    let makeup;
    if (existing) {
      makeup = await this.prisma.attendances.update({
        where: { id: existing.id },
        data: {
          status: 'present',
          note: `[Bù giờ] Dự buổi bù từ buổi vắng khác`,
        },
      });
    } else {
      makeup = await this.prisma.attendances.create({
        data: {
          id: randomUUID(),
          schedule_id: makeupSessionId,
          student_id: studentId,
          status: 'present',
          note: `[Bù giờ] Dự buổi bù từ buổi vắng khác`,
          recorded_at: new Date(),
        },
      });
    }

    return makeup;
  }

  /**
   * FR-ECM-043: Get makeup sessions for a student
   */
  async getStudentMakeupSessions(studentId: string) {
    const absences = await this.prisma.attendances.findMany({
      where: {
        student_id: studentId,
        status: { in: ['absent', 'missing'] },
      },
      include: {
        class_schedules: {
          include: {
            classes: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { recorded_at: 'desc' },
    });

    return {
      student_id: studentId,
      total_absences: absences.length,
      absences: absences.map((a) => ({
        absence_id: a.id,
        session_id: a.schedule_id,
        class_name: a.class_schedules.classes.name,
        recorded_at: a.recorded_at,
        note: a.note,
      })),
    };
  }
}
