import { Test, TestingModule } from '@nestjs/testing';
import { StudentsService } from './students.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { StudentsAcademicService } from './students-academic.service';
import { AppErrorCode } from '../../common/api/app-error-code.enum';
import { AppException } from '../../common/api/app-exception';
import {
  NotificationRefType,
  NotificationType,
} from '../notifications/notification.constants';

describe('StudentsService', () => {
  let service: StudentsService;
  let prisma: PrismaService;
  let notifications: NotificationsService;
  let academicService: StudentsAcademicService;

  const mockPrisma = {
    users: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    user_roles: {
      findMany: jest.fn(),
    },
    enrollments: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    grades: {
      findMany: jest.fn(),
    },
    invoices: {
      findMany: jest.fn(),
    },
    user_roles: {
      findMany: jest.fn(),
    },
    exam_sessions: {
      findMany: jest.fn(),
    },
    mock_test_history: {
      findMany: jest.fn(),
    },
    student_targets: {
      findMany: jest.fn(),
    },
  };

  const mockNotifications = {
    create: jest.fn(),
  };

  const mockAcademicService = {
    getAttendanceSummary: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: StudentsAcademicService, useValue: mockAcademicService },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
    prisma = module.get<PrismaService>(PrismaService);
    notifications = module.get<NotificationsService>(NotificationsService);
    academicService = module.get<StudentsAcademicService>(
      StudentsAcademicService,
    );

    jest.spyOn(service['logger'], 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMyProfile', () => {
    it('should throw NOT_FOUND if student not found', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(null);
      await expect(service.getMyProfile('bad-id')).rejects.toThrow(
        AppException,
      );
      await expect(service.getMyProfile('bad-id')).rejects.toMatchObject({
        response: expect.objectContaining({ errorKey: 'student.not_found' }),
      });
    });

    it('should return profile successfully', async () => {
      const mockResult = { id: 'u1' };
      mockPrisma.users.findUnique.mockResolvedValue(mockResult);
      const res = await service.getMyProfile('u1');
      expect(res).toEqual(mockResult);
    });
  });

  describe('getStudentDetail', () => {
    it('should return combined detail', async () => {
      mockPrisma.users.findUnique.mockResolvedValue({
        id: 'u1',
        _count: {
          enrollments: 0,
          grades: 0,
          student_targets: 0,
          exam_sessions_exam_sessions_student_idTousers: 0,
          mock_test_history: 0,
        },
      });
      mockAcademicService.getAttendanceSummary.mockResolvedValue([{ test: 1 }]);
      mockPrisma.enrollments.findMany.mockResolvedValue([{ class_id: 'c1' }]);
      mockPrisma.exam_sessions.findMany.mockResolvedValue([]);
      mockPrisma.mock_test_history.findMany.mockResolvedValue([]);
      mockPrisma.student_targets.findMany.mockResolvedValue([]);

      const res = await service.getStudentDetail('u1');
      expect(res.profile.id).toBe('u1');
      expect(res.attendance_summary).toBeDefined();
      expect(res.enrollments).toBeDefined();
    });
  });

  describe('updateStudentStatus', () => {
    it('should update and notify', async () => {
      mockPrisma.users.findUnique.mockResolvedValue({
        id: 'u1',
        _count: { enrollments: 0, grades: 0 },
      });
      mockPrisma.users.update.mockResolvedValue({ id: 'u1' });
      const notifyMock = mockNotifications.create.mockResolvedValue({});

      await service.updateStudentStatus('u1', 'active');
      expect(mockPrisma.users.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u1' },
          data: expect.any(Object),
        }),
      );
      expect(notifyMock).toHaveBeenCalled();
    });

    it('should catch notification errors gracefully', async () => {
      mockPrisma.users.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrisma.users.update.mockResolvedValue({ id: 'u1' });
      mockNotifications.create.mockRejectedValue(new Error('fail'));

      const res = await service.updateStudentStatus('u1', 'inactive');
      expect(res.id).toBe('u1');
      expect(service['logger'].error).toHaveBeenCalled();
    });
  });

  describe('getStudents', () => {
    it('should query lead-only students', async () => {
      mockPrisma.users.findMany.mockResolvedValue([{ id: 'u1' }]);
      mockPrisma.users.count.mockResolvedValue(1);

      await service.getStudents({ leadOnly: true, skip: 0, take: 10 });
      expect(mockPrisma.users.findMany).toHaveBeenCalled();
    });

    it('should handle search, status, and course scopes', async () => {
      mockPrisma.users.findMany.mockResolvedValue([]);
      mockPrisma.users.count.mockResolvedValue(0);

      await service.getStudents({
        search: 'test',
        status: 'active',
        courseId: 'c1',
        classId: 'cls1',
        skip: 2,
        take: 5,
      });
      expect(mockPrisma.users.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 2,
          take: 5,
          where: expect.any(Object),
        }),
      );
    });
  });

  describe('getMyClasses', () => {
    it('should proxy enrollment query', async () => {
      mockPrisma.enrollments.findMany.mockResolvedValue([]);
      mockPrisma.enrollments.count.mockResolvedValue(0);

      await service.getMyClasses({
        studentId: 'u1',
        status: 'active',
        skip: 0,
        take: 5,
      });
      expect(mockPrisma.enrollments.findMany).toHaveBeenCalled();
    });
  });

  describe('getMyGrades', () => {
    it('should proxy grades findMany', async () => {
      mockPrisma.grades.findMany.mockResolvedValue([]);
      await service.getMyGrades('u1');
      expect(mockPrisma.grades.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('getMyInvoices', () => {
    it('should filter by status if provided', async () => {
      mockPrisma.invoices.findMany.mockResolvedValue([]);
      await service.getMyInvoices('u1', 'pending');
      expect(mockPrisma.invoices.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            enrollments: { student_id: 'u1' },
            status: 'pending',
          },
        }),
      );
    });
  });

  describe('getStudentHistory', () => {
    it('should return aggregated history', async () => {
      mockAcademicService.getAttendanceSummary.mockResolvedValue([]);
      mockPrisma.enrollments.findMany.mockResolvedValue([]);
      mockPrisma.exam_sessions.findMany.mockResolvedValue([]);
      mockPrisma.mock_test_history.findMany.mockResolvedValue([]);
      mockPrisma.student_targets.findMany.mockResolvedValue([]);
      const res = await service.getStudentHistory('u1');
      expect(res.enrollments).toBeDefined();
      expect(res.attendance_summary).toBeDefined();
    });
  });
});
