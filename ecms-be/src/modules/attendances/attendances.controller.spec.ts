import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AttendancesController } from './attendances.controller';
import { AttendancesService } from './attendances.service';
import { RecordAttendanceDto } from './dto/record-attendance.dto';

// ──── Test Constants ────────────────────────────────────────────
const TEST_IDS = {
  SCHEDULE_1: 'schedule-001',
  SCHEDULE_2: 'schedule-002',
  STUDENT_1: 'student-001',
  STUDENT_2: 'student-002',
  TEACHER_1: 'teacher-001',
  CLASS_1: 'class-001',
  ATTENDANCE_1: 'attendance-001',
  SESSION_1: 'session-001',
  SESSION_2: 'session-002',
  ABSENCE_1: 'absence-001',
} as const;

const TEST_DATES = {
  START_2024: new Date('2024-01-01'),
  END_2024: new Date('2024-12-31'),
  RECORDED: new Date('2024-06-15T10:30:00Z'),
} as const;

enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused',
}

const ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'excused'] as const;

// ──── Test Data Factories ────────────────────────────────────────
class TestDataFactory {
  static createRecordAttendanceDto(
    overrides?: Partial<RecordAttendanceDto>,
  ): RecordAttendanceDto {
    return {
      schedule_id: TEST_IDS.SCHEDULE_1,
      student_id: TEST_IDS.STUDENT_1,
      status: AttendanceStatus.PRESENT,
      note: 'On time',
      ...overrides,
    };
  }

  static createAttendanceRecord(overrides?: Record<string, unknown>) {
    return {
      id: TEST_IDS.ATTENDANCE_1,
      schedule_id: TEST_IDS.SCHEDULE_1,
      student_id: TEST_IDS.STUDENT_1,
      status: AttendanceStatus.PRESENT,
      note: 'On time',
      recorded_by: TEST_IDS.TEACHER_1,
      recorded_at: TEST_DATES.RECORDED,
      ...overrides,
    };
  }

  static createStudentAttendanceReport(overrides?: Record<string, unknown>) {
    return {
      student_id: TEST_IDS.STUDENT_1,
      attendance_rate: 85.5,
      stats: {
        total_sessions: 10,
        present: 7,
        absent: 2,
        late: 1,
        excused: 0,
      },
      records: [],
      ...overrides,
    };
  }

  static createClassAttendanceReport(overrides?: Record<string, unknown>) {
    return {
      class_id: TEST_IDS.CLASS_1,
      class_stats: {
        total_students: 30,
        total_sessions: 10,
        avg_attendance_rate: 85.5,
      },
      students: [
        {
          student_id: TEST_IDS.STUDENT_1,
          student_name: 'John Doe',
          attendance_rate: 90,
          stats: {
            present: 9,
            absent: 0,
            late: 1,
            excused: 0,
          },
          missing_sessions: 0,
        },
      ],
      ...overrides,
    };
  }

  static createMakeupSessionRecord(overrides?: Record<string, unknown>) {
    return {
      id: TEST_IDS.ATTENDANCE_1,
      schedule_id: TEST_IDS.SESSION_2,
      student_id: TEST_IDS.STUDENT_1,
      status: AttendanceStatus.PRESENT,
      note: '[Bù giờ] Dự buổi bù từ buổi vắng khác',
      recorded_at: TEST_DATES.RECORDED,
      ...overrides,
    };
  }

  static createAuthenticatedRequest(
    userId: string = TEST_IDS.STUDENT_1,
    role = 'student',
  ) {
    return {
      id: userId,
      email: `${userId}@example.com`,
      roles: [role],
    } satisfies AuthenticatedUser;
  }
}

// ──── Test Suite ────────────────────────────────────────────────
describe('AttendancesController', () => {
  let controller: AttendancesController;
  let mockAttendancesService: jest.Mocked<
    Pick<
      AttendancesService,
      | 'recordAttendance'
      | 'getStudentAttendanceReport'
      | 'getClassAttendanceReport'
      | 'getAttendanceReportByPeriod'
      | 'getConsecutiveAbsenceCount'
      | 'acceptMakeupSession'
      | 'getStudentMakeupSessions'
    >
  >;

  beforeEach(async () => {
    mockAttendancesService = {
      recordAttendance: jest.fn(),
      getStudentAttendanceReport: jest.fn(),
      getClassAttendanceReport: jest.fn(),
      getAttendanceReportByPeriod: jest.fn(),
      getConsecutiveAbsenceCount: jest.fn(),
      acceptMakeupSession: jest.fn(),
      getStudentMakeupSessions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendancesController],
      providers: [
        {
          provide: AttendancesService,
          useValue: mockAttendancesService,
        },
      ],
    }).compile();

    controller = module.get<AttendancesController>(AttendancesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('controller initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have all required methods', () => {
      expect(controller.recordAttendance).toBeDefined();
      expect(controller.getStudentAttendanceReport).toBeDefined();
      expect(controller.getClassAttendanceReport).toBeDefined();
      expect(controller.getAttendanceReportByPeriod).toBeDefined();
      expect(controller.getConsecutiveAbsenceCount).toBeDefined();
      expect(controller.acceptMakeupSession).toBeDefined();
      expect(controller.getStudentMakeupSessions).toBeDefined();
    });
  });

  describe('recordAttendance (FR-ECM-040)', () => {
    it('should record attendance for a student with valid data', async () => {
      const dto = TestDataFactory.createRecordAttendanceDto();
      const expectedResult = TestDataFactory.createAttendanceRecord();

      mockAttendancesService.recordAttendance.mockResolvedValueOnce(
        expectedResult,
      );

      const request = TestDataFactory.createAuthenticatedRequest(
        TEST_IDS.TEACHER_1,
        'teacher',
      );
      const result = await controller.recordAttendance(dto, request);

      expect(result).toEqual(expectedResult);
      expect(mockAttendancesService.recordAttendance).toHaveBeenCalledTimes(1);
      expect(mockAttendancesService.recordAttendance).toHaveBeenCalledWith(
        dto,
        TEST_IDS.TEACHER_1,
      );
    });

    it.each(ATTENDANCE_STATUSES)(
      'should record attendance with status: %s',
      async (status) => {
        const dto = TestDataFactory.createRecordAttendanceDto({ status });
        const expectedResult = TestDataFactory.createAttendanceRecord({
          status,
        });

        mockAttendancesService.recordAttendance.mockResolvedValueOnce(
          expectedResult,
        );

        const request = TestDataFactory.createAuthenticatedRequest(
          TEST_IDS.TEACHER_1,
          'teacher',
        );
        const result = await controller.recordAttendance(dto, request);

        expect(result.status).toBe(status);
      },
    );

    it('should record attendance with optional note', async () => {
      const note = 'Arrived 5 minutes late due to traffic';
      const dto = TestDataFactory.createRecordAttendanceDto({ note });
      const expectedResult = TestDataFactory.createAttendanceRecord({ note });

      mockAttendancesService.recordAttendance.mockResolvedValueOnce(
        expectedResult,
      );

      const request = TestDataFactory.createAuthenticatedRequest(
        TEST_IDS.TEACHER_1,
        'teacher',
      );
      const result = await controller.recordAttendance(dto, request);

      expect(result.note).toBe(note);
    });

    it('should include recorder and timestamp in result', async () => {
      const dto = TestDataFactory.createRecordAttendanceDto();
      const expectedResult = TestDataFactory.createAttendanceRecord();

      mockAttendancesService.recordAttendance.mockResolvedValueOnce(
        expectedResult,
      );

      const request = TestDataFactory.createAuthenticatedRequest(
        TEST_IDS.TEACHER_1,
        'teacher',
      );
      const result = await controller.recordAttendance(dto, request);

      expect(result.recorded_by).toBe(TEST_IDS.TEACHER_1);
      expect(result.recorded_at).toBeDefined();
      expect(result.recorded_at instanceof Date).toBe(true);
    });
  });

  describe('getStudentAttendanceReport (FR-ECM-041)', () => {
    it('should return student attendance report with valid parameters', async () => {
      const mockReport = TestDataFactory.createStudentAttendanceReport();
      mockAttendancesService.getStudentAttendanceReport.mockResolvedValueOnce(
        mockReport,
      );

      const request = TestDataFactory.createAuthenticatedRequest(
        TEST_IDS.STUDENT_1,
        'student',
      );
      const result = await controller.getStudentAttendanceReport(
        request,
        TEST_IDS.STUDENT_1,
        TEST_IDS.CLASS_1,
        TEST_DATES.START_2024,
        TEST_DATES.END_2024,
      );

      expect(result).toEqual(mockReport);
      expect(
        mockAttendancesService.getStudentAttendanceReport,
      ).toHaveBeenCalledWith({
        student_id: TEST_IDS.STUDENT_1,
        class_id: TEST_IDS.CLASS_1,
        from_date: TEST_DATES.START_2024,
        to_date: TEST_DATES.END_2024,
      });
    });

    it('should return correct attendance statistics', async () => {
      const mockReport = TestDataFactory.createStudentAttendanceReport({
        attendance_rate: 92.5,
        stats: {
          total_sessions: 40,
          present: 37,
          absent: 1,
          late: 2,
          excused: 0,
        },
      });
      mockAttendancesService.getStudentAttendanceReport.mockResolvedValueOnce(
        mockReport,
      );

      const request = TestDataFactory.createAuthenticatedRequest(
        TEST_IDS.STUDENT_1,
        'student',
      );
      const result = await controller.getStudentAttendanceReport(
        request,
        TEST_IDS.STUDENT_1,
        TEST_IDS.CLASS_1,
        TEST_DATES.START_2024,
        TEST_DATES.END_2024,
      );

      expect(result.attendance_rate).toBe(92.5);
      expect(result.stats.present).toBe(37);
      expect(result.stats.absent).toBe(1);
    });

    it('should prevent student from viewing others attendance', async () => {
      const request = TestDataFactory.createAuthenticatedRequest(
        TEST_IDS.STUDENT_1,
        'student',
      );

      await expect(
        controller.getStudentAttendanceReport(
          request,
          TEST_IDS.STUDENT_2, // Different student
          TEST_IDS.CLASS_1,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow teacher to view any student attendance', async () => {
      const mockReport = TestDataFactory.createStudentAttendanceReport({
        student_id: TEST_IDS.STUDENT_2,
      });
      mockAttendancesService.getStudentAttendanceReport.mockResolvedValueOnce(
        mockReport,
      );

      const request = TestDataFactory.createAuthenticatedRequest(
        TEST_IDS.TEACHER_1,
        'teacher',
      );
      const result = await controller.getStudentAttendanceReport(
        request,
        TEST_IDS.STUDENT_2,
        TEST_IDS.CLASS_1,
      );

      expect(result.student_id).toBe(TEST_IDS.STUDENT_2);
    });

    it('should allow admin to view any student attendance', async () => {
      const mockReport = TestDataFactory.createStudentAttendanceReport({
        student_id: TEST_IDS.STUDENT_2,
      });
      mockAttendancesService.getStudentAttendanceReport.mockResolvedValueOnce(
        mockReport,
      );

      const request = TestDataFactory.createAuthenticatedRequest(
        TEST_IDS.STUDENT_2,
        'admin',
      );
      const result = await controller.getStudentAttendanceReport(
        request,
        TEST_IDS.STUDENT_2,
        TEST_IDS.CLASS_1,
      );

      expect(result.student_id).toBe(TEST_IDS.STUDENT_2);
    });

    it('should call service with correct date objects', async () => {
      const mockReport = TestDataFactory.createStudentAttendanceReport();
      mockAttendancesService.getStudentAttendanceReport.mockResolvedValueOnce(
        mockReport,
      );

      const request = TestDataFactory.createAuthenticatedRequest(
        TEST_IDS.STUDENT_1,
        'student',
      );
      await controller.getStudentAttendanceReport(
        request,
        TEST_IDS.STUDENT_1,
        TEST_IDS.CLASS_1,
        TEST_DATES.START_2024,
        TEST_DATES.END_2024,
      );

      const callArgs = mockAttendancesService.getStudentAttendanceReport.mock
        .calls[0][0] as {
        from_date?: Date;
        to_date?: Date;
      };
      expect(callArgs.from_date instanceof Date).toBe(true);
      expect(callArgs.to_date instanceof Date).toBe(true);
    });
  });

  describe('getClassAttendanceReport (FR-ECM-041)', () => {
    it('should return class attendance report with valid parameters', async () => {
      const mockReport = TestDataFactory.createClassAttendanceReport();
      mockAttendancesService.getClassAttendanceReport.mockResolvedValueOnce(
        mockReport,
      );

      const result = await controller.getClassAttendanceReport(
        TEST_IDS.CLASS_1,
        TEST_DATES.START_2024,
        TEST_DATES.END_2024,
      );

      expect(result).toEqual(mockReport);
      expect(
        mockAttendancesService.getClassAttendanceReport,
      ).toHaveBeenCalledWith({
        class_id: TEST_IDS.CLASS_1,
        from_date: TEST_DATES.START_2024,
        to_date: TEST_DATES.END_2024,
      });
    });

    it('should return class-level statistics', async () => {
      const mockReport = TestDataFactory.createClassAttendanceReport();
      mockAttendancesService.getClassAttendanceReport.mockResolvedValueOnce(
        mockReport,
      );

      const result = await controller.getClassAttendanceReport(
        TEST_IDS.CLASS_1,
        TEST_DATES.START_2024,
        TEST_DATES.END_2024,
      );

      expect(result.class_stats.total_students).toBe(30);
      expect(result.class_stats.total_sessions).toBe(10);
      expect(result.class_stats.avg_attendance_rate).toBeDefined();
    });

    it('should return per-student attendance details', async () => {
      const mockReport = TestDataFactory.createClassAttendanceReport();
      mockAttendancesService.getClassAttendanceReport.mockResolvedValueOnce(
        mockReport,
      );

      const result = await controller.getClassAttendanceReport(
        TEST_IDS.CLASS_1,
      );

      expect(Array.isArray(result.students)).toBe(true);
      expect(result.students.length).toBeGreaterThan(0);
      expect(result.students[0]).toHaveProperty('student_id');
      expect(result.students[0]).toHaveProperty('attendance_rate');
      expect(result.students[0]).toHaveProperty('stats');
    });

    it('should identify students with low attendance', async () => {
      const mockReport = TestDataFactory.createClassAttendanceReport({
        students: [
          {
            student_id: TEST_IDS.STUDENT_1,
            student_name: 'Low Attendance Student',
            attendance_rate: 50,
            missing_sessions: 5,
          },
        ],
      });
      mockAttendancesService.getClassAttendanceReport.mockResolvedValueOnce(
        mockReport,
      );

      const result = await controller.getClassAttendanceReport(
        TEST_IDS.CLASS_1,
      );

      expect(result.students[0].attendance_rate).toBe(50);
      expect(result.students[0].attendance_rate < 75).toBe(true);
    });
  });

  describe('getAttendanceReportByPeriod (FR-ECM-041)', () => {
    it('should return period-based attendance report', async () => {
      const mockReport = {
        period: {
          from: TEST_DATES.START_2024,
          to: TEST_DATES.END_2024,
        },
        total_records: 100,
        data: [
          {
            date: '2024-01-15',
            count: 5,
            records: [],
          },
        ],
      };

      mockAttendancesService.getAttendanceReportByPeriod.mockResolvedValueOnce(
        mockReport,
      );

      const result = await controller.getAttendanceReportByPeriod(
        TEST_DATES.START_2024,
        TEST_DATES.END_2024,
        TEST_IDS.CLASS_1,
      );

      expect(result).toEqual(mockReport);
      expect(
        mockAttendancesService.getAttendanceReportByPeriod,
      ).toHaveBeenCalled();
    });

    it('should default to class-wide report when no student specified', async () => {
      const mockReport = {
        period: {
          from: TEST_DATES.START_2024,
          to: TEST_DATES.END_2024,
        },
        total_records: 300,
        data: [],
      };

      mockAttendancesService.getAttendanceReportByPeriod.mockResolvedValueOnce(
        mockReport,
      );

      const result = await controller.getAttendanceReportByPeriod(
        TEST_DATES.START_2024,
        TEST_DATES.END_2024,
        TEST_IDS.CLASS_1,
      );

      expect(result.total_records).toBe(300);
    });

    it('should filter by student when provided', async () => {
      const mockReport = {
        period: {
          from: TEST_DATES.START_2024,
          to: TEST_DATES.END_2024,
        },
        total_records: 50,
        data: [],
      };

      mockAttendancesService.getAttendanceReportByPeriod.mockResolvedValueOnce(
        mockReport,
      );

      const result = await controller.getAttendanceReportByPeriod(
        TEST_DATES.START_2024,
        TEST_DATES.END_2024,
        TEST_IDS.CLASS_1,
        TEST_IDS.STUDENT_1,
      );

      expect(result.total_records).toBeLessThanOrEqual(300);
    });

    it('should pass through dates even if from_date is after to_date (service validates)', async () => {
      const mockReport = {
        period: { from: TEST_DATES.END_2024, to: TEST_DATES.START_2024 },
        total_records: 0,
        data: [],
      };
      mockAttendancesService.getAttendanceReportByPeriod.mockResolvedValueOnce(
        mockReport,
      );

      const result = await controller.getAttendanceReportByPeriod(
        TEST_DATES.END_2024,
        TEST_DATES.START_2024,
      );

      expect(result).toEqual(mockReport);
    });
  });

  describe('getConsecutiveAbsenceCount (FR-ECM-042)', () => {
    const ABSENCE_ALERT_THRESHOLD = 3;

    it('should return consecutive absence count', async () => {
      mockAttendancesService.getConsecutiveAbsenceCount.mockResolvedValueOnce(
        ABSENCE_ALERT_THRESHOLD - 1,
      );

      const result = await controller.getConsecutiveAbsenceCount(
        TEST_IDS.STUDENT_1,
        TEST_IDS.CLASS_1,
      );

      expect(result).toEqual({
        student_id: TEST_IDS.STUDENT_1,
        class_id: TEST_IDS.CLASS_1,
        consecutive_absences: ABSENCE_ALERT_THRESHOLD - 1,
        alert_threshold: ABSENCE_ALERT_THRESHOLD,
        is_alerted: false,
      });
    });

    it('should flag alert when absence reaches threshold', async () => {
      mockAttendancesService.getConsecutiveAbsenceCount.mockResolvedValueOnce(
        ABSENCE_ALERT_THRESHOLD,
      );

      const result = await controller.getConsecutiveAbsenceCount(
        TEST_IDS.STUDENT_1,
        TEST_IDS.CLASS_1,
      );

      expect(result.is_alerted).toBe(true);
      expect(result.consecutive_absences).toBe(ABSENCE_ALERT_THRESHOLD);
    });

    it('should flag alert when absence exceeds threshold', async () => {
      mockAttendancesService.getConsecutiveAbsenceCount.mockResolvedValueOnce(
        5,
      );

      const result = await controller.getConsecutiveAbsenceCount(
        TEST_IDS.STUDENT_1,
        TEST_IDS.CLASS_1,
      );

      expect(result.is_alerted).toBe(true);
      expect(result.consecutive_absences).toBe(5);
    });

    it('should return zero consecutive absences when attendance is good', async () => {
      mockAttendancesService.getConsecutiveAbsenceCount.mockResolvedValueOnce(
        0,
      );

      const result = await controller.getConsecutiveAbsenceCount(
        TEST_IDS.STUDENT_1,
        TEST_IDS.CLASS_1,
      );

      expect(result.consecutive_absences).toBe(0);
      expect(result.is_alerted).toBe(false);
    });

    it('should throw error if class_id is missing', async () => {
      await expect(
        controller.getConsecutiveAbsenceCount(
          TEST_IDS.STUDENT_1,
          undefined as unknown as string,
        ),
      ).rejects.toThrow();
    });

    it('should pass student_id to service even if undefined (NestJS validates param)', async () => {
      mockAttendancesService.getConsecutiveAbsenceCount.mockResolvedValueOnce(
        0,
      );

      // studentId comes from URL param, so NestJS validates it's present
      // This test verifies that if somehow undefined was passed, service handles it
      const result = await controller.getConsecutiveAbsenceCount(
        undefined as unknown as string,
        TEST_IDS.CLASS_1,
      );

      expect(result).toBeDefined();
    });

    it('should call service with correct parameters', async () => {
      mockAttendancesService.getConsecutiveAbsenceCount.mockResolvedValueOnce(
        2,
      );

      await controller.getConsecutiveAbsenceCount(
        TEST_IDS.STUDENT_1,
        TEST_IDS.CLASS_1,
      );

      expect(
        mockAttendancesService.getConsecutiveAbsenceCount,
      ).toHaveBeenCalledWith(TEST_IDS.STUDENT_1, TEST_IDS.CLASS_1);
    });
  });

  describe('acceptMakeupSession (FR-ECM-043)', () => {
    it('should accept makeup session for student', async () => {
      const body = {
        student_id: TEST_IDS.STUDENT_1,
        original_session_id: TEST_IDS.SESSION_1,
        makeup_session_id: TEST_IDS.SESSION_2,
      };

      const mockMakeup = TestDataFactory.createMakeupSessionRecord();
      mockAttendancesService.acceptMakeupSession.mockResolvedValueOnce(
        mockMakeup,
      );

      const request = TestDataFactory.createAuthenticatedRequest(
        TEST_IDS.STUDENT_1,
        'student',
      );
      const result = await controller.acceptMakeupSession(body, request);

      expect(result).toEqual(mockMakeup);
      expect(mockAttendancesService.acceptMakeupSession).toHaveBeenCalledWith(
        TEST_IDS.STUDENT_1,
        TEST_IDS.SESSION_1,
        TEST_IDS.SESSION_2,
      );
    });

    it('should record makeup attendance as present', async () => {
      const body = {
        student_id: TEST_IDS.STUDENT_1,
        original_session_id: TEST_IDS.SESSION_1,
        makeup_session_id: TEST_IDS.SESSION_2,
      };

      const mockMakeup = TestDataFactory.createMakeupSessionRecord({
        status: AttendanceStatus.PRESENT,
      });
      mockAttendancesService.acceptMakeupSession.mockResolvedValueOnce(
        mockMakeup,
      );

      const request = TestDataFactory.createAuthenticatedRequest(
        TEST_IDS.STUDENT_1,
        'student',
      );
      const result = await controller.acceptMakeupSession(body, request);

      expect(result.status).toBe(AttendanceStatus.PRESENT);
      expect(result.note).toContain('[Bù giờ]');
    });

    it('should prevent student from accepting makeup for others', async () => {
      const body = {
        student_id: TEST_IDS.STUDENT_2,
        original_session_id: TEST_IDS.SESSION_1,
        makeup_session_id: TEST_IDS.SESSION_2,
      };

      const request = TestDataFactory.createAuthenticatedRequest(
        TEST_IDS.STUDENT_1,
        'student',
      );

      await expect(
        controller.acceptMakeupSession(body, request),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow teacher to accept makeup for any student', async () => {
      const body = {
        student_id: TEST_IDS.STUDENT_2,
        original_session_id: TEST_IDS.SESSION_1,
        makeup_session_id: TEST_IDS.SESSION_2,
      };

      const mockMakeup = TestDataFactory.createMakeupSessionRecord({
        student_id: TEST_IDS.STUDENT_2,
      });
      mockAttendancesService.acceptMakeupSession.mockResolvedValueOnce(
        mockMakeup,
      );

      const request = TestDataFactory.createAuthenticatedRequest(
        TEST_IDS.TEACHER_1,
        'teacher',
      );
      const result = await controller.acceptMakeupSession(body, request);

      expect(result.student_id).toBe(TEST_IDS.STUDENT_2);
    });

    it('should include timestamp in makeup record', async () => {
      const body = {
        student_id: TEST_IDS.STUDENT_1,
        original_session_id: TEST_IDS.SESSION_1,
        makeup_session_id: TEST_IDS.SESSION_2,
      };

      const mockMakeup = TestDataFactory.createMakeupSessionRecord();
      mockAttendancesService.acceptMakeupSession.mockResolvedValueOnce(
        mockMakeup,
      );

      const request = TestDataFactory.createAuthenticatedRequest(
        TEST_IDS.STUDENT_1,
        'student',
      );
      const result = await controller.acceptMakeupSession(body, request);

      expect(result.recorded_at).toBeDefined();
      expect(result.recorded_at instanceof Date).toBe(true);
    });

    it('should use correct session IDs in makeup record', async () => {
      const body = {
        student_id: TEST_IDS.STUDENT_1,
        original_session_id: TEST_IDS.SESSION_1,
        makeup_session_id: TEST_IDS.SESSION_2,
      };

      const mockMakeup = TestDataFactory.createMakeupSessionRecord({
        schedule_id: TEST_IDS.SESSION_2,
      });
      mockAttendancesService.acceptMakeupSession.mockResolvedValueOnce(
        mockMakeup,
      );

      const request = TestDataFactory.createAuthenticatedRequest(
        TEST_IDS.STUDENT_1,
        'student',
      );
      const result = await controller.acceptMakeupSession(body, request);

      expect(result.schedule_id).toBe(TEST_IDS.SESSION_2);
    });
  });

  describe('getStudentMakeupSessions (FR-ECM-043)', () => {
    it('should return makeup sessions for student', async () => {
      const mockMakups = {
        student_id: TEST_IDS.STUDENT_1,
        total_absences: 2,
        absences: [
          {
            absence_id: TEST_IDS.ABSENCE_1,
            session_id: TEST_IDS.SESSION_1,
            class_name: 'Advanced English',
            recorded_at: TEST_DATES.RECORDED,
            note: 'Absent',
          },
        ],
      };

      mockAttendancesService.getStudentMakeupSessions.mockResolvedValueOnce(
        mockMakups,
      );

      const request = TestDataFactory.createAuthenticatedRequest(
        TEST_IDS.STUDENT_1,
        'student',
      );
      const result = await controller.getStudentMakeupSessions(
        TEST_IDS.STUDENT_1,
        request,
      );

      expect(result).toEqual(mockMakups);
      expect(
        mockAttendancesService.getStudentMakeupSessions,
      ).toHaveBeenCalledWith(TEST_IDS.STUDENT_1);
    });

    it('should return empty absences when student has no makeup sessions', async () => {
      const mockMakups = {
        student_id: TEST_IDS.STUDENT_1,
        total_absences: 0,
        absences: [],
      };

      mockAttendancesService.getStudentMakeupSessions.mockResolvedValueOnce(
        mockMakups,
      );

      const request = TestDataFactory.createAuthenticatedRequest(
        TEST_IDS.STUDENT_1,
        'student',
      );
      const result = await controller.getStudentMakeupSessions(
        TEST_IDS.STUDENT_1,
        request,
      );

      expect(result.total_absences).toBe(0);
      expect(result.absences.length).toBe(0);
    });

    it('should prevent student from viewing others makeup sessions', async () => {
      const request = TestDataFactory.createAuthenticatedRequest(
        TEST_IDS.STUDENT_1,
        'student',
      );

      await expect(
        controller.getStudentMakeupSessions(TEST_IDS.STUDENT_2, request),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow teacher to view any student makeup sessions', async () => {
      const mockMakups = {
        student_id: TEST_IDS.STUDENT_2,
        total_absences: 1,
        absences: [],
      };

      mockAttendancesService.getStudentMakeupSessions.mockResolvedValueOnce(
        mockMakups,
      );

      const request = TestDataFactory.createAuthenticatedRequest(
        TEST_IDS.TEACHER_1,
        'teacher',
      );
      const result = await controller.getStudentMakeupSessions(
        TEST_IDS.STUDENT_2,
        request,
      );

      expect(result.student_id).toBe(TEST_IDS.STUDENT_2);
    });

    it('should include absence details in response', async () => {
      const mockMakups = {
        student_id: TEST_IDS.STUDENT_1,
        total_absences: 1,
        absences: [
          {
            absence_id: TEST_IDS.ABSENCE_1,
            session_id: TEST_IDS.SESSION_1,
            class_name: 'Math',
            recorded_at: TEST_DATES.RECORDED,
            note: 'Sick leave',
          },
        ],
      };

      mockAttendancesService.getStudentMakeupSessions.mockResolvedValueOnce(
        mockMakups,
      );

      const request = TestDataFactory.createAuthenticatedRequest(
        TEST_IDS.STUDENT_1,
        'student',
      );
      const result = await controller.getStudentMakeupSessions(
        TEST_IDS.STUDENT_1,
        request,
      );

      expect(result.absences[0]).toHaveProperty('absence_id');
      expect(result.absences[0]).toHaveProperty('session_id');
      expect(result.absences[0]).toHaveProperty('class_name');
      expect(result.absences[0]).toHaveProperty('recorded_at');
    });

    it('should count total absences correctly', async () => {
      const mockMakups = {
        student_id: TEST_IDS.STUDENT_1,
        total_absences: 5,
        absences: Array(5)
          .fill(null)
          .map((_, i) => ({
            absence_id: `absence-${i}`,
            session_id: `session-${i}`,
            class_name: 'Class',
            recorded_at: TEST_DATES.RECORDED,
            note: 'Absent',
          })),
      };

      mockAttendancesService.getStudentMakeupSessions.mockResolvedValueOnce(
        mockMakups,
      );

      const request = TestDataFactory.createAuthenticatedRequest(
        TEST_IDS.STUDENT_1,
        'student',
      );
      const result = await controller.getStudentMakeupSessions(
        TEST_IDS.STUDENT_1,
        request,
      );

      expect(result.total_absences).toBe(5);
      expect(result.absences.length).toBe(5);
    });
  });
});
