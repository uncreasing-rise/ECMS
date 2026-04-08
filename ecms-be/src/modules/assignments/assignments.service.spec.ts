/// <reference types="jest" />
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import type { PrismaService } from '../../common/prisma/prisma.service';
import type { NotificationsService } from '../notifications/notifications.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';

describe('AssignmentsService', () => {
  let service: AssignmentsService;

  const mockPrismaService = {
    classes: { findUnique: jest.fn() },
    assignments: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    enrollments: { findMany: jest.fn(), findFirst: jest.fn() },
    submissions: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockNotificationsService = {
    create: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AssignmentsService(
      mockPrismaService as unknown as PrismaService,
      mockNotificationsService as unknown as NotificationsService,
    );
  });

  it('FR-LMS-010: should create assignment and notify students', async () => {
    mockPrismaService.classes.findUnique.mockResolvedValue({
      id: 'class-1',
      name: 'Class A',
      teacher_id: 'teacher-1',
    });
    mockPrismaService.assignments.create.mockResolvedValue({
      id: 'a-1',
      class_id: 'class-1',
      title: 'Essay',
      due_at: new Date('2026-06-01T00:00:00.000Z'),
      max_score: 10,
      allow_resubmit: false,
      created_at: new Date(),
    });
    mockPrismaService.enrollments.findMany.mockResolvedValue([
      { student_id: 'student-1' },
    ]);
    mockNotificationsService.create.mockResolvedValue({ id: 'n-1' });

    const dto: CreateAssignmentDto = {
      title: 'Essay',
      description: 'Write 250 words',
      due_at: '2026-06-01T00:00:00.000Z',
    };

    const result = await service.createAssignment(
      'class-1',
      dto,
      'teacher-1',
    );

    expect(result.id).toBe('a-1');
    expect(mockNotificationsService.create).toHaveBeenCalledTimes(1);
  });

  it('FR-LMS-011: should reject invalid empty submission payload', async () => {
    const invalidDto: SubmitAssignmentDto = {};
    await expect(
      service.submitAssignment('a-1', 'student-1', invalidDto),
    ).rejects.toThrow(BadRequestException);
  });

  it('FR-LMS-011: should reject resubmission when allow_resubmit is false', async () => {
    mockPrismaService.assignments.findUnique.mockResolvedValue({
      id: 'a-1',
      class_id: 'class-1',
      due_at: new Date(Date.now() + 100000),
      allow_resubmit: false,
      title: 'Essay',
    });
    mockPrismaService.enrollments.findFirst.mockResolvedValue({ id: 'en-1' });
    mockPrismaService.submissions.findFirst.mockResolvedValue({ id: 's-1' });

    await expect(
      service.submitAssignment('a-1', 'student-1', {
        submission_text: 'Attempt 2',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('FR-LMS-012: should grade submission and notify student', async () => {
    mockPrismaService.submissions.findUnique.mockResolvedValue({
      id: 's-1',
      student_id: 'student-1',
      assignments: {
        id: 'a-1',
        title: 'Essay',
        max_score: 10,
        class_id: 'class-1',
      },
    });
    mockPrismaService.submissions.update.mockResolvedValue({
      id: 's-1',
      assignment_id: 'a-1',
      student_id: 'student-1',
      content: '{}',
      file_url: null,
      score: 8.5,
      feedback: '{"feedback":"Good"}',
      graded_by: 'teacher-1',
      graded_at: new Date(),
      submitted_at: new Date(),
      users_submissions_graded_byTousers: {
        id: 'teacher-1',
        full_name: 'Teacher',
      },
    });
    mockNotificationsService.create.mockResolvedValue({ id: 'n-1' });

    const result = await service.gradeSubmission('s-1', 'teacher-1', {
      score: 8.5,
      feedback: 'Good',
    });

    expect(result.id).toBe('s-1');
    expect(mockNotificationsService.create).toHaveBeenCalledTimes(1);
  });

  it('FR-LMS-012: should throw when submission is not found', async () => {
    mockPrismaService.submissions.findUnique.mockResolvedValue(null);

    await expect(
      service.gradeSubmission('missing', 'teacher-1', { score: 7 }),
    ).rejects.toThrow(NotFoundException);
  });
});
