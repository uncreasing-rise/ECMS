import { describe, expect, it, jest } from '@jest/globals';
import { StudentsController } from './students.controller';

describe('StudentsController', () => {
  const studentsService = {
    getMyProfile: jest.fn(),
    getStudents: jest.fn(),
    getStudentDetail: jest.fn(),
    getStudentHistory: jest.fn(),
    updateStudentStatus: jest.fn(),
    getMyClasses: jest.fn(),
  };

  const controller = new StudentsController(studentsService as never);

  it('getMyProfile delegates user id', async () => {
    await controller.getMyProfile({ id: 'u1' } as never);

    expect(studentsService.getMyProfile).toHaveBeenCalledWith('u1');
  });

  it('getStudents parses admin filters', async () => {
    await controller.getStudents(
      'search term',
      'active',
      'class-1',
      'course-2',
      'true',
      '7',
      '11',
    );

    expect(studentsService.getStudents).toHaveBeenCalledWith({
      search: 'search term',
      status: 'active',
      classId: 'class-1',
      courseId: 'course-2',
      leadOnly: true,
      skip: 7,
      take: 11,
    });
  });

  it('getLeads forces leadOnly mode', async () => {
    await controller.getLeads('lead', 'class-1', 'course-2', '4', '9');

    expect(studentsService.getStudents).toHaveBeenCalledWith({
      search: 'lead',
      classId: 'class-1',
      courseId: 'course-2',
      leadOnly: true,
      skip: 4,
      take: 9,
    });
  });

  it('getStudentDetail delegates id', async () => {
    await controller.getStudentDetail('student-1');

    expect(studentsService.getStudentDetail).toHaveBeenCalledWith('student-1');
  });

  it('getStudentHistory delegates id', async () => {
    await controller.getStudentHistory('student-2');

    expect(studentsService.getStudentHistory).toHaveBeenCalledWith('student-2');
  });

  it('updateStudentStatus delegates status payload', async () => {
    await controller.updateStudentStatus('student-3', {
      status: 'graduated',
    } as never);

    expect(studentsService.updateStudentStatus).toHaveBeenCalledWith(
      'student-3',
      'graduated',
    );
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
