import { describe, expect, it, jest } from '@jest/globals';
import { TeacherPortalController } from './teacher-portal.controller';

describe('TeacherPortalController', () => {
  const portalService = {
    getTeacherDashboard: jest.fn(),
    getTeacherClassManagement: jest.fn(),
    createLesson: jest.fn(),
    uploadClassDocument: jest.fn(),
    createTeacherAssignment: jest.fn(),
    getPendingSubmissionGrading: jest.fn(),
    gradeSubmission: jest.fn(),
    createTeacherExam: jest.fn(),
    getTeacherClassReport: jest.fn(),
  };

  const controller = new TeacherPortalController(portalService as never);

  it('delegates teacher dashboard', async () => {
    await controller.getDashboard({ id: 't1', roles: ['teacher'] } as never);
    expect(portalService.getTeacherDashboard).toHaveBeenCalledWith('t1');
  });

  it('delegates class report', async () => {
    await controller.getClassReport(
      { id: 't1', roles: ['teacher'] } as never,
      'c1',
    );
    expect(portalService.getTeacherClassReport).toHaveBeenCalledWith(
      't1',
      'c1',
    );
  });
});
