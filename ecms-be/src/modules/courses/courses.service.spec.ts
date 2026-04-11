import { Test, TestingModule } from '@nestjs/testing';
import { CoursesService } from './courses.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AppErrorCode } from '../../common/api/app-error-code.enum';
import { AppException } from '../../common/api/app-exception';
import {
  NotificationType,
  NotificationRefType,
} from '../notifications/notification.constants';
import { randomUUID } from 'node:crypto';

describe('CoursesService', () => {
  let service: CoursesService;
  let prisma: PrismaService;
  let notifications: NotificationsService;

  const mockPrismaService = {
    courses: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    user_roles: {
      findMany: jest.fn(),
    },
    classes: {
      findMany: jest.fn(),
    },
  };

  const mockNotificationsService = {
    createBulk: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
    prisma = module.get<PrismaService>(PrismaService);
    notifications = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCourse', () => {
    it('should create a course and notify admins', async () => {
      const dto = {
        name: 'Math 101',
        description: 'Basic Math',
        level: '1',
        total_sessions: 10,
        price: 100,
        is_active: true,
      };

      const mockCourse = { id: 'course-id', name: 'Math 101' };
      mockPrismaService.courses.create.mockResolvedValue(mockCourse);
      mockPrismaService.user_roles.findMany.mockResolvedValue([
        { user_id: 'admin-1' },
      ]);

      const result = await service.createCourse(dto);

      expect(mockPrismaService.courses.create).toHaveBeenCalled();
      expect(result).toEqual(mockCourse);
      expect(notifications.createBulk).toHaveBeenCalledWith([
        {
          user_id: 'admin-1',
          type: NotificationType.COURSE_CREATED,
          title: 'Khoa hoc moi duoc tao',
          body: `Khoa hoc "Math 101" vua duoc tao trong he thong.`,
          ref_type: NotificationRefType.COURSE,
          ref_id: 'course-id',
        },
      ]);
    });

    it('should not throw if notify admins fails', async () => {
      const dto = {
        name: 'Math 101',
        description: 'Basic Math',
        level: '1',
        total_sessions: 10,
        price: 100,
        is_active: true,
      };

      const mockCourse = { id: 'course-id', name: 'Math 101' };
      mockPrismaService.courses.create.mockResolvedValue(mockCourse);
      mockPrismaService.user_roles.findMany.mockResolvedValue([
        { user_id: 'admin-1' },
      ]);
      mockNotificationsService.createBulk.mockRejectedValue(
        new Error('Notification error'),
      );

      const result = await service.createCourse(dto);
      expect(result).toEqual(mockCourse);
    });
  });

  describe('updateCourse', () => {
    it('should update course and notify teachers', async () => {
      mockPrismaService.courses.findUnique.mockResolvedValue({
        id: 'course-id',
      });
      const mockUpdated = { id: 'course-id', name: 'Updated name' };
      mockPrismaService.courses.update.mockResolvedValue(mockUpdated);
      mockPrismaService.classes.findMany.mockResolvedValue([
        { teacher_id: 'teacher-1' },
      ]);

      const result = await service.updateCourse('course-id', {
        name: 'Updated name',
      });

      expect(result).toEqual(mockUpdated);
      expect(notifications.createBulk).toHaveBeenCalledWith([
        {
          user_id: 'teacher-1',
          type: NotificationType.COURSE_UPDATED,
          title: 'Khoa hoc da duoc cap nhat',
          body: `Khoa hoc "Updated name" da duoc cap nhat. Vui long kiem tra cac lop lien quan.`,
          ref_type: NotificationRefType.COURSE,
          ref_id: 'course-id',
        },
      ]);
    });

    it('should throw NOT_FOUND if course does not exist', async () => {
      mockPrismaService.courses.findUnique.mockResolvedValue(null);

      await expect(service.updateCourse('course-id', {})).rejects.toThrow(
        AppException,
      );
    });
  });

  describe('deleteCourse', () => {
    it('should deactivate course and notify teachers', async () => {
      mockPrismaService.courses.findUnique.mockResolvedValue({
        id: 'course-id',
        is_active: true,
      });
      const deactivated = {
        id: 'course-id',
        name: 'Course to Delete',
        is_active: false,
      };
      mockPrismaService.courses.update.mockResolvedValue(deactivated);
      mockPrismaService.classes.findMany.mockResolvedValue([
        { teacher_id: 'teacher-2' },
      ]);

      const result = await service.deleteCourse('course-id');

      expect(result).toEqual(deactivated);
      expect(notifications.createBulk).toHaveBeenCalledWith(expect.any(Array));
    });

    it('should return message if course already deactivated', async () => {
      mockPrismaService.courses.findUnique.mockResolvedValue({
        id: 'course-id',
        is_active: false,
      });

      const result = await service.deleteCourse('course-id');
      expect(result).toEqual({ message: 'Khóa học đã được tắt trước đó' });
    });

    it('should throw NOT_FOUND if course does not exist', async () => {
      mockPrismaService.courses.findUnique.mockResolvedValue(null);

      await expect(service.deleteCourse('course-id')).rejects.toThrow(
        AppException,
      );
    });
  });

  describe('getCourses', () => {
    it('should return paginated courses', async () => {
      const mockCourses = [{ id: '1' }];
      mockPrismaService.courses.findMany.mockResolvedValue(mockCourses);
      mockPrismaService.courses.count.mockResolvedValue(1);

      const result = await service.getCourses({
        skip: 0,
        take: 10,
        search: 'Math',
        includeInactive: true,
      });

      expect(result.data).toEqual(mockCourses);
      expect(result.total).toEqual(1);
      expect(result.hasMore).toEqual(false);
      expect(mockPrismaService.courses.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        }),
      );
    });
  });

  describe('getCourseById', () => {
    it('should return a valid course', async () => {
      const mockCourse = { id: 'c-1', name: 'Math' };
      mockPrismaService.courses.findUnique.mockResolvedValue(mockCourse);

      const result = await service.getCourseById('c-1');
      expect(result).toEqual(mockCourse);
    });

    it('should throw NOT_FOUND if not exist', async () => {
      mockPrismaService.courses.findUnique.mockResolvedValue(null);

      await expect(service.getCourseById('c-1')).rejects.toThrow(AppException);
    });
  });
});
