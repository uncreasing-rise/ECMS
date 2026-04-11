import { Test, TestingModule } from '@nestjs/testing';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { StudentsAnalyticsService } from './students-analytics.service';
import { StudentsAcademicService } from './students-academic.service';

describe('StudentsController', () => {
  let controller: StudentsController;
  let studentsService: StudentsService;
  let analyticsService: StudentsAnalyticsService;
  let academicService: StudentsAcademicService;

  const mockStudentsService = {
    getMyProfile: jest.fn(),
    getMyClasses: jest.fn(),
    getMyGrades: jest.fn(),
    getMyInvoices: jest.fn(),
    getStudents: jest.fn(),
    getStudentDetail: jest.fn(),
    getStudentHistory: jest.fn(),
    updateStudentStatus: jest.fn(),
  };

  const mockAnalyticsService = {
    getDashboard: jest.fn(),
    getMyLearningProgress: jest.fn(),
    getClassLearningReport: jest.fn(),
  };

  const mockAcademicService = {
    getAttendanceSummary: jest.fn(),
    getStudentGradeBook: jest.fn(),
    computeAndSaveClassFinalScore: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentsController],
      providers: [
        {
          provide: StudentsService,
          useValue: mockStudentsService,
        },
        {
          provide: StudentsAnalyticsService,
          useValue: mockAnalyticsService,
        },
        {
          provide: StudentsAcademicService,
          useValue: mockAcademicService,
        },
      ],
    }).compile();

    controller = module.get<StudentsController>(StudentsController);
    studentsService = module.get<StudentsService>(StudentsService);
    analyticsService = module.get<StudentsAnalyticsService>(
      StudentsAnalyticsService,
    );
    academicService = module.get<StudentsAcademicService>(
      StudentsAcademicService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDashboard', () => {
    it('should delegate to analytics service', async () => {
      await controller.getDashboard({ id: 'u-1' } as any);
      expect(analyticsService.getDashboard).toHaveBeenCalledWith('u-1');
    });
  });

  describe('recalculateFinalScore', () => {
    it('should delegate to academic service', async () => {
      await controller.recalculateFinalScore('u-1', 'c-1', 0.4, 0.5, 0.1);
      expect(
        academicService.computeAndSaveClassFinalScore,
      ).toHaveBeenCalledWith({
        studentId: 'u-1',
        classId: 'c-1',
        weights: {
          assignment: 0.4,
          exam: 0.5,
          attendance: 0.1,
        },
      });
    });
  });

  describe('getStudents', () => {
    it('should cast booleans and numbers properly to the service', async () => {
      await controller.getStudents(
        'search',
        'active',
        'c-1',
        'co-1',
        true,
        10,
        5,
      );
      expect(studentsService.getStudents).toHaveBeenCalledWith({
        search: 'search',
        status: 'active',
        classId: 'c-1',
        courseId: 'co-1',
        leadOnly: true,
        skip: 10,
        take: 5,
      });
    });
  });
});
