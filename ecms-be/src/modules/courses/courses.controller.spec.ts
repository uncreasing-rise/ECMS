import { Test, TestingModule } from '@nestjs/testing';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

describe('CoursesController', () => {
  let controller: CoursesController;
  let service: CoursesService;

  const mockCoursesService = {
    getCourses: jest.fn(),
    createCourse: jest.fn(),
    updateCourse: jest.fn(),
    deleteCourse: jest.fn(),
    getCourseById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [
        {
          provide: CoursesService,
          useValue: mockCoursesService,
        },
      ],
    }).compile();

    controller = module.get<CoursesController>(CoursesController);
    service = module.get<CoursesService>(CoursesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCourses', () => {
    it('should call service.getCourses with correct params', async () => {
      await controller.getCourses('math', true, 10, 5);
      expect(service.getCourses).toHaveBeenCalledWith({
        search: 'math',
        includeInactive: true,
        skip: 10,
        take: 5,
      });
    });

    it('should call service.getCourses with default params when undefined', async () => {
      // The controller delegates to pipes for undefined, but since we are calling it as a function here
      // we just simulate passing undefined which NestJS would eventually pass (or the pipe defaults it).
      // Since default pipes resolve in the framework layer, calling controller directly bypasses pipes.
      // But we can unit test that whatever it receives, it passes down properly mapped.
      await controller.getCourses(undefined, undefined, undefined, undefined);
      expect(service.getCourses).toHaveBeenCalledWith({
        search: undefined,
        includeInactive: undefined,
        skip: undefined,
        take: undefined,
      });
    });
  });

  describe('createCourse', () => {
    it('should call service.createCourse', async () => {
      const dto: CreateCourseDto = {
        name: 'IELTS Foundation',
        level: 'A1',
        total_sessions: 24,
        price: 4800000,
        description: 'Mô tả',
        is_active: true,
      };

      await controller.createCourse(dto);
      expect(service.createCourse).toHaveBeenCalledWith(dto);
    });
  });

  describe('updateCourse', () => {
    it('should call service.updateCourse', async () => {
      const dto: UpdateCourseDto = { name: 'Updated' };
      await controller.updateCourse('course-1', dto);
      expect(service.updateCourse).toHaveBeenCalledWith('course-1', dto);
    });
  });

  describe('deleteCourse', () => {
    it('should call service.deleteCourse', async () => {
      await controller.deleteCourse('course-2');
      expect(service.deleteCourse).toHaveBeenCalledWith('course-2');
    });
  });

  describe('getCourseById', () => {
    it('should call service.getCourseById', async () => {
      await controller.getCourseById('course-3');
      expect(service.getCourseById).toHaveBeenCalledWith('course-3');
    });
  });
});
