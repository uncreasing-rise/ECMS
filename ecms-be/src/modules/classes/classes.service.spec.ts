import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ClassesService } from './classes.service';

describe('ClassesService facade', () => {
  const lifecycle = {
    getClasses: jest.fn(),
  };
  const schedules = {
    getClassSchedules: jest.fn(),
  };
  const assignments = {
    createAssignment: jest.fn(),
  };
  const exams = {
    startExamAttempt: jest.fn(),
  };
  const grading = {
    gradeAssignmentSubmission: jest.fn(),
  };

  const service = new ClassesService(
    lifecycle as never,
    schedules as never,
    assignments as never,
    exams as never,
    grading as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates getClasses to lifecycle domain service', async () => {
    await service.getClasses({} as never);
    expect(lifecycle.getClasses).toHaveBeenCalledWith({} as never);
  });

  it('delegates getClassSchedules to schedules domain service', async () => {
    await service.getClassSchedules('c1', 'u1');
    expect(schedules.getClassSchedules).toHaveBeenCalledWith('c1', 'u1');
  });

  it('delegates createAssignment to assignments domain service', async () => {
    await service.createAssignment('c1', {} as never, 'u1');
    expect(assignments.createAssignment).toHaveBeenCalledWith(
      'c1',
      {} as never,
      'u1',
    );
  });

  it('delegates startExamAttempt to exams domain service', async () => {
    await service.startExamAttempt('c1', 'e1', 'u1', {} as never);
    expect(exams.startExamAttempt).toHaveBeenCalledWith(
      'c1',
      'e1',
      'u1',
      {} as never,
    );
  });

  it('delegates gradeAssignmentSubmission to grading domain service', async () => {
    await service.gradeAssignmentSubmission(
      'c1',
      'a1',
      's1',
      {} as never,
      'u1',
    );
    expect(grading.gradeAssignmentSubmission).toHaveBeenCalledWith(
      'c1',
      'a1',
      's1',
      {} as never,
      'u1',
    );
  });
});
