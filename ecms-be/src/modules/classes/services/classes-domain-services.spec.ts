import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ClassesAssignmentsService } from './classes-assignments.service';
import { ClassesCoreService } from '../classes.core.service';
import { ClassesExamsService } from './classes-exams.service';
import { ClassesGradingService } from './classes-grading.service';
import { ClassesLifecycleService } from './classes-lifecycle.service';
import { ClassesSchedulesService } from './classes-schedules.service';

describe('Classes Domain Services', () => {
  const getClassById = jest.fn();
  const createAssignment = jest.fn();
  const createClassTest = jest.fn();
  const gradeAssignmentSubmission = jest.fn();

  const core = {
    getClassById,
    createAssignment,
    createClassTest,
    gradeAssignmentSubmission,
  } as unknown as ClassesCoreService;

  const findCourse = jest.fn<() => Promise<{ id: string } | null>>();
  const findUser = jest.fn<() => Promise<{ id: string } | null>>();
  const createClassRecord =
    jest.fn<() => Promise<{ id: string; name: string | null }>>();
  const findUserRole = jest.fn<() => Promise<{ user_id: string } | null>>();

  const prisma = {
    courses: { findUnique: findCourse },
    users: { findUnique: findUser },
    classes: { create: createClassRecord },
    user_roles: { findFirst: findUserRole },
  };

  const schedulesPrisma = {
    classes: {
      findUnique:
        jest.fn<
          () => Promise<{ id: string; teacher_id: string | null } | null>
        >(),
    },
    user_roles: {
      findFirst: jest.fn<() => Promise<{ id: string } | null>>(),
    },
    enrollments: {
      findFirst: jest.fn<() => Promise<{ id: string } | null>>(),
      findMany: jest.fn<() => Promise<Array<{ student_id: string }>>>(),
    },
    class_schedules: {
      findMany: jest.fn<() => Promise<unknown[]>>(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lifecycle executes createClass use-case with prisma', async () => {
    findCourse.mockResolvedValue({ id: 'course-1' });
    createClassRecord.mockResolvedValue({
      id: 'class-1',
      name: 'Lop 1',
    });

    const service = new ClassesLifecycleService(
      prisma as never,
      core,
      undefined,
    );
    await service.createClass(
      {
        course_id: 'course-1',
        name: 'Lop 1',
      } as never,
      'u1',
    );

    expect(prisma.classes.create).toHaveBeenCalled();
  });

  it('lifecycle delegates getClassById to core', async () => {
    const service = new ClassesLifecycleService(
      prisma as never,
      core,
      undefined,
    );
    await service.getClassById('c1', 'u1');
    expect(getClassById).toHaveBeenCalledWith('c1', 'u1');
  });

  it('schedules executes getClassSchedules with authorization', async () => {
    schedulesPrisma.classes.findUnique.mockResolvedValue({
      id: 'c1',
      teacher_id: 't1',
    });
    schedulesPrisma.user_roles.findFirst.mockResolvedValue({
      id: 'r1',
    });
    schedulesPrisma.class_schedules.findMany.mockResolvedValue([]);

    const service = new ClassesSchedulesService(schedulesPrisma as never);
    await service.getClassSchedules('c1', 'admin-1');

    expect(schedulesPrisma.class_schedules.findMany).toHaveBeenCalled();
  });

  it('assignments delegates createAssignment to core', async () => {
    const service = new ClassesAssignmentsService(core);
    await service.createAssignment('c1', {} as never, 'u1');
    expect(createAssignment).toHaveBeenCalledWith('c1', {} as never, 'u1');
  });

  it('exams delegates createClassTest to core', async () => {
    const service = new ClassesExamsService(core);
    await service.createClassTest('c1', {} as never, 'u1');
    expect(createClassTest).toHaveBeenCalledWith('c1', {} as never, 'u1');
  });

  it('grading delegates gradeAssignmentSubmission to core', async () => {
    const service = new ClassesGradingService(core);
    await service.gradeAssignmentSubmission(
      'c1',
      'a1',
      's1',
      {} as never,
      'u1',
    );
    expect(gradeAssignmentSubmission).toHaveBeenCalledWith(
      'c1',
      'a1',
      's1',
      {} as never,
      'u1',
    );
  });
});
