import { Test, TestingModule } from '@nestjs/testing';
import { StudentsAcademicService } from './students-academic.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppException } from '../../common/api/app-exception';

describe('StudentsAcademicService', () => {
  let service: StudentsAcademicService;
  let prisma: PrismaService;

  const mockPrisma = {
    attendances: {
      findMany: jest.fn(),
    },
    enrollments: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    grades: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    assignments: {
      findMany: jest.fn(),
    },
    exam_sessions: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsAcademicService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<StudentsAcademicService>(StudentsAcademicService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('resolveWeights', () => {
    it('should use default weights if undefined', () => {
      const w = service.resolveWeights();
      expect(w.assignment + w.exam + w.attendance).toBeCloseTo(1);
    });

    it('should throw BAD_REQUEST if weights do not sum to 1', () => {
      expect(() =>
        service.resolveWeights({ assignment: 0.8, exam: 0.8 }),
      ).toThrow(AppException);
    });

    it('should calculate cleanly when valid', () => {
      const w = service.resolveWeights({
        assignment: 0.3,
        exam: 0.5,
        attendance: 0.2,
      });
      expect(w.assignment).toBe(0.3);
    });
  });

  describe('calculateAttendanceRateForClass', () => {
    it('should return 0 if no records', async () => {
      mockPrisma.attendances.findMany.mockResolvedValue([]);
      const rate = await service.calculateAttendanceRateForClass('u1', 'c1');
      expect(rate).toBe(0);
    });

    it('should count present, late, excused as present', async () => {
      mockPrisma.attendances.findMany.mockResolvedValue([
        { status: 'present' },
        { status: 'late' },
        { status: 'excused' },
        { status: 'absent' },
      ]);
      const rate = await service.calculateAttendanceRateForClass('u1', 'c1');
      expect(rate).toBe(75); // 3/4
    });
  });

  describe('calculateAssignmentPercent', () => {
    it('should handle zero max score', async () => {
      mockPrisma.assignments.findMany.mockResolvedValue([
        { id: 'a1', max_score: 0, submissions: [{ score: 5 }] },
      ]);
      const percent = await service.calculateAssignmentPercent('u1', 'c1');
      expect(percent).toBe(0); // drops it
    });

    it('should calculate avg assignment score', async () => {
      mockPrisma.assignments.findMany.mockResolvedValue([
        { id: 'a1', max_score: 10, submissions: [{ score: 8 }] },
        { id: 'a2', max_score: 100, submissions: [{ score: 90 }] },
      ]);
      const percent = await service.calculateAssignmentPercent('u1', 'c1');
      // 8/10 = 80%, 90/100 = 90%. Avg = 85
      expect(percent).toBe(85);
    });
  });

  describe('calculateExamPercent', () => {
    it('should calculate avg exam score safely', async () => {
      mockPrisma.exam_sessions.findMany.mockResolvedValue([
        { exams: { total_score: 100 }, final_score: 80 },
      ]);
      const percent = await service.calculateExamPercent('u1', 'c1');
      expect(percent).toBe(80);
    });
  });

  describe('computeAndSaveClassFinalScore', () => {
    it('should throw BAD_REQUEST if student is not enrolled', async () => {
      mockPrisma.enrollments.findFirst.mockResolvedValue(null);
      await expect(
        service.computeAndSaveClassFinalScore({
          studentId: 'u1',
          classId: 'c1',
        }),
      ).rejects.toThrow(AppException);
    });

    it('should compute final score and update if grade exists', async () => {
      mockPrisma.enrollments.findFirst.mockResolvedValue({ id: 'en1' });
      jest.spyOn(service, 'calculateAssignmentPercent').mockResolvedValue(80);
      jest.spyOn(service, 'calculateExamPercent').mockResolvedValue(90);
      jest
        .spyOn(service, 'calculateAttendanceRateForClass')
        .mockResolvedValue(100);

      mockPrisma.grades.findFirst.mockResolvedValue({ id: 'g1' }); // Grade exists
      mockPrisma.grades.update.mockResolvedValue({ id: 'g1', final_score: 87 }); // 80*.4 + 90*.5 + 100*.1 = 32 + 45 + 10 = 87

      await service.computeAndSaveClassFinalScore({
        studentId: 'u1',
        classId: 'c1',
      });
      expect(mockPrisma.grades.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'g1' },
          data: expect.objectContaining({ final_score: 87 }),
        }),
      );
    });

    it('should compute final score and create if grade does not exist', async () => {
      mockPrisma.enrollments.findFirst.mockResolvedValue({ id: 'en1' });
      jest.spyOn(service, 'calculateAssignmentPercent').mockResolvedValue(0);
      jest.spyOn(service, 'calculateExamPercent').mockResolvedValue(0);
      jest
        .spyOn(service, 'calculateAttendanceRateForClass')
        .mockResolvedValue(0);

      mockPrisma.grades.findFirst.mockResolvedValue(null);
      mockPrisma.grades.create.mockResolvedValue({
        id: 'new-g',
        final_score: 0,
      });

      await service.computeAndSaveClassFinalScore({
        studentId: 'u1',
        classId: 'c1',
      });
      expect(mockPrisma.grades.create).toHaveBeenCalled();
    });
  });

  describe('getAttendanceSummary', () => {
    it('should map presence correctly', async () => {
      mockPrisma.attendances.findMany.mockResolvedValue([
        {
          status: 'present',
          class_schedules: { class_id: 'c1', classes: { name: 'C1' } },
        },
        {
          status: 'absent',
          class_schedules: { class_id: 'c1', classes: { name: 'C1' } },
        },
      ]);

      const res = await service.getAttendanceSummary('u1');
      expect(res).toHaveLength(1);
      expect(res[0].total).toBe(2);
      expect(res[0].present).toBe(1);
      expect(res[0].absent).toBe(1);
      expect(res[0].attendance_rate).toBe(50);
    });
  });

  describe('getStudentGradeBook', () => {
    it('should evaluate student rank and class performance', async () => {
      mockPrisma.enrollments.findMany.mockResolvedValue([
        {
          class_id: 'c1',
          classes: {
            name: 'Class 1',
            courses: { id: 'crs1', name: 'Course 1', level: 'Beginner' },
          },
        },
      ]);
      mockPrisma.grades.findMany.mockImplementation(async (args: any) => {
        if (args.where?.student_id === 'u1')
          return [{ class_id: 'c1', final_score: 80 }];
        return [
          { class_id: 'c1', student_id: 'u1', final_score: 80 },
          { class_id: 'c1', student_id: 'u2', final_score: 90 },
        ];
      });

      const res = await service.getStudentGradeBook('u1');
      expect(res.classes[0].class_size).toBe(2);
      expect(res.classes[0].class_average).toBe(85);
      expect(res.classes[0].rank_in_class).toBe(2); // Score 80 is 2nd compared to 90
    });
  });
});
