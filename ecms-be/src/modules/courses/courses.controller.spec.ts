import { describe, expect, it, jest } from '@jest/globals';
import { CoursesController } from './courses.controller';

describe('CoursesController', () => {
  const coursesService = {
    createCourse: jest.fn(),
    updateCourse: jest.fn(),
    deleteCourse: jest.fn(),
  };

  const controller = new CoursesController(coursesService as never);

  it('createCourse delegates payload', async () => {
    await controller.createCourse({
      name: 'IELTS Foundation',
      level: 'A1',
      total_sessions: 24,
      price: 4800000,
    } as never);

    expect(coursesService.createCourse).toHaveBeenCalledWith({
      name: 'IELTS Foundation',
      level: 'A1',
      total_sessions: 24,
      price: 4800000,
    });
  });

  it('updateCourse delegates course id and payload', async () => {
    await controller.updateCourse('course-1', { name: 'Updated' } as never);

    expect(coursesService.updateCourse).toHaveBeenCalledWith('course-1', {
      name: 'Updated',
    });
  });

  it('deleteCourse delegates course id', async () => {
    await controller.deleteCourse('course-2');

    expect(coursesService.deleteCourse).toHaveBeenCalledWith('course-2');
  });
});
