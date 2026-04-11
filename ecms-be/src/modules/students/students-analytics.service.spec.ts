import { Test, TestingModule } from '@nestjs/testing';
import { StudentsAnalyticsService } from './students-analytics.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StudentsAcademicService } from './students-academic.service';
import { AppException } from '../../common/api/app-exception';

describe('StudentsAnalyticsService', () => {
  let service: StudentsAnalyticsService;
  let prisma: PrismaService;
  let academicService: StudentsAcademicService;

  const mockPrisma = {
    enrollments: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    notifications: {
      count: jest.fn(),
    },
    invoices: {
      count: jest.fn(),
    },
    lesson_progress: {
      findMany: jest.fn(),
    },
    classes: {
      findUnique: jest.fn(),
    },
    grades: {
      findFirst: jest.fn(),
    },
  };

  const mockAcademicService = {
    calculateAttendanceRateForClass: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsAnalyticsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StudentsAcademicService, useValue: mockAcademicService },
      ],
    }).compile();

    service = module.get<StudentsAnalyticsService>(StudentsAnalyticsService);
    prisma = module.get<PrismaService>(PrismaService);
    academicService = module.get<StudentsAcademicService>(
      StudentsAcademicService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboard', () => {
    it('should aggregate 4 key metrics', async () => {
      mockPrisma.enrollments.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(3);
      mockPrisma.notifications.count.mockResolvedValueOnce(2);
      mockPrisma.invoices.count.mockResolvedValueOnce(1);

      const res = await service.getDashboard('u1');
      expect(res).toEqual({
        total_classes: 5,
        active_classes: 3,
        unread_notifications: 2,
        unpaid_invoices: 1,
      });
    });
  });

  describe('getMyLearningProgress', () => {
    it('should calculate lesson progress safely when no enrollments exist', async () => {
      mockPrisma.enrollments.findMany.mockResolvedValue([]);

      const res = await service.getMyLearningProgress('u1');
      expect(res.overall.total_lessons).toBe(0);
      expect(res.overall.completed_lessons).toBe(0);
      expect(res.classes).toHaveLength(0);
    });

    it('should compute lesson percentage based on published lessons', async () => {
      mockPrisma.enrollments.findMany.mockResolvedValue([
        {
          class_id: 'c1',
          classes: {
            name: 'Class 1',
            courses: {
              id: 'crs1',
              name: 'Course 1',
              course_modules: [
                {
                  lessons: [
                    { id: 'l1', is_published: true },
                    { id: 'l2', is_published: false },
                  ],
                },
              ],
            },
          },
        },
      ]);
      mockPrisma.lesson_progress.findMany.mockResolvedValue([
        { lesson_id: 'l1' },
      ]);

      const res = await service.getMyLearningProgress('u1');
      expect(res.overall.total_lessons).toBe(1); // Since l2 is unpublished
      expect(res.overall.completed_lessons).toBe(1);
      expect(res.overall.completion_percent).toBe(100);
      expect(res.classes[0].completion_percent).toBe(100);
    });
  });

  describe('getClassLearningReport', () => {
    it('should throw NOT_FOUND if class does not exist', async () => {
      mockPrisma.classes.findUnique.mockResolvedValue(null);
      await expect(service.getClassLearningReport('bad')).rejects.toThrow(
        AppException,
      );
    });

    it('should calculate class learning report successfully', async () => {
      mockPrisma.classes.findUnique.mockResolvedValue({
        id: 'c1',
        name: 'Class 1',
        courses: {},
      });
      mockPrisma.enrollments.findMany.mockResolvedValue([
        {
          student_id: 'u1',
          users: { id: 'u1', full_name: 'John', email: 'j@j.com' },
        },
      ]);
      mockPrisma.grades.findFirst.mockResolvedValue({
        assignment_avg: 80,
        exam_avg: 70,
        final_score: 75,
      });
      mockPrisma.enrollments.findMany.mockResolvedValueOnce([
        { student_id: 'u1', users: { id: 'u1', full_name: 'John' } },
      ]);
      jest.spyOn(service, 'getMyLearningProgress').mockResolvedValue({
        overall: {} as any,
        classes: [
          {
            class_id: 'c1',
            completion_percent: 50,
            completed_lessons: 1,
            remaining_lessons: 1,
            class_name: '',
            course_id: '',
            course_name: '',
            total_lessons: 2,
          },
        ] as any,
        student_id: 'u1',
      });
      mockAcademicService.calculateAttendanceRateForClass.mockResolvedValue(90);

      const res = await service.getClassLearningReport('c1');
      expect(res.class.id).toBe('c1');
      expect(res.summary.total_students).toBe(1);
      expect(res.summary.average_final_score).toBe(75);
      expect(res.students[0].progress_percent).toBe(50);
      expect(res.students[0].attendance_rate).toBe(90); // because it falls back if grade doesn't specify or we mock grades to return it
    });
  });
});
