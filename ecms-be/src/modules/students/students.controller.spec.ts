import { describe, expect, it, jest } from '@jest/globals';
import { StudentsController } from './students.controller';

describe('StudentsController', () => {
  const studentsService = {
    getMyProfile: jest.fn(),
    getMyClasses: jest.fn(),
  };

  const controller = new StudentsController(studentsService as never);

  it('getMyProfile delegates user id', async () => {
    await controller.getMyProfile({ id: 'u1' } as never);

    expect(studentsService.getMyProfile).toHaveBeenCalledWith('u1');
  });

  it('getMyClasses parses pagination params', async () => {
    await controller.getMyClasses({ id: 'u1' } as never, 'active', '2', '3');

    expect(studentsService.getMyClasses).toHaveBeenCalledWith({
      studentId: 'u1',
      status: 'active',
      skip: 2,
      take: 3,
    });
  });
});
