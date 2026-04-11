import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { randomUUID } from 'node:crypto';
import { AppErrorCode } from '../../common/api/app-error-code.enum';
import { AppException } from '../../common/api/app-exception';

export interface GradeWeightConfig {
  assignment: number;
  exam: number;
  attendance: number;
}

export interface ComputeClassGradeParams {
  studentId: string;
  classId: string;
  weights?: Partial<GradeWeightConfig>;
}

const DEFAULT_GRADE_WEIGHTS: GradeWeightConfig = {
  assignment: 0.4,
  exam: 0.5,
  attendance: 0.1,
};

@Injectable()
export class StudentsAcademicService {
  private readonly logger = new Logger(StudentsAcademicService.name);

  constructor(private readonly prisma: PrismaService) {}

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
      throw new AppException({
        code: AppErrorCode.BAD_REQUEST,
        errorKey: 'student.bad_request',
        message: 'Học viên không thuộc lớp học này',
      });
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

  resolveWeights(weights?: Partial<GradeWeightConfig>): GradeWeightConfig {
    const merged: GradeWeightConfig = {
      assignment: weights?.assignment ?? DEFAULT_GRADE_WEIGHTS.assignment,
      exam: weights?.exam ?? DEFAULT_GRADE_WEIGHTS.exam,
      attendance: weights?.attendance ?? DEFAULT_GRADE_WEIGHTS.attendance,
    };

    const sum = merged.assignment + merged.exam + merged.attendance;
    if (Math.abs(sum - 1) > 0.0001) {
      throw new AppException({
        code: AppErrorCode.BAD_REQUEST,
        errorKey: 'student.bad_request',
        message: 'Tổng trọng số phải bằng 1',
      });
    }

    return merged;
  }

  async calculateAssignmentPercent(
    studentId: string,
    classId: string,
  ): Promise<number> {
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

  async calculateExamPercent(
    studentId: string,
    classId: string,
  ): Promise<number> {
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

  async calculateAttendanceRateForClass(
    studentId: string,
    classId: string,
  ): Promise<number> {
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
