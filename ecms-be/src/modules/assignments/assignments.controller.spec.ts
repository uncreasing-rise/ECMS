/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

describe('AssignmentsController', () => {
  let controller: AssignmentsController;

  const mockAssignmentsService = {
    createAssignment: jest.fn(),
    getAssignmentsByClass: jest.fn(),
    submitAssignment: jest.fn(),
    getMySubmissionHistory: jest.fn(),
    getSubmissionsByAssignment: jest.fn(),
    gradeSubmission: jest.fn(),
    getSubmissionDetail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssignmentsController],
      providers: [
        {
          provide: AssignmentsService,
          useValue: mockAssignmentsService,
        },
      ],
    }).compile();

    controller = module.get<AssignmentsController>(AssignmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('FR-LMS-010: should create assignment', async () => {
    const dto: CreateAssignmentDto = {
      title: 'Essay 01',
      description: 'Write 250 words',
      due_at: '2026-06-01T23:59:59.000Z',
      max_score: 10,
      submission_instructions: 'PDF or link',
      rubric: [{ id: 'content', name: 'Content', max_score: 5 }],
    };

    const expected = { id: 'a-1', ...dto };
    mockAssignmentsService.createAssignment.mockResolvedValue(expected);

    const user: AuthenticatedUser = {
      id: 'teacher-1',
      email: 'teacher@example.com',
      roles: ['teacher'],
    };
    const result = await controller.createAssignment('class-1', dto, user);

    expect(result).toEqual(expected);
    expect(mockAssignmentsService.createAssignment).toHaveBeenCalledWith(
      'class-1',
      dto,
      'teacher-1',
    );
  });

  it('FR-LMS-011: should submit assignment and return result', async () => {
    const dto = {
      submission_text: 'My answer',
      submission_link: 'https://docs.example.com/submission',
      files: ['https://cdn.example.com/submission.pdf'],
    };

    const expected = { id: 's-1', assignment_id: 'a-1' };
    mockAssignmentsService.submitAssignment.mockResolvedValue(expected);

    const user: AuthenticatedUser = {
      id: 'student-1',
      email: 'student@example.com',
      roles: ['student'],
    };
    const result = await controller.submitAssignment('a-1', dto, user);

    expect(result).toEqual(expected);
    expect(mockAssignmentsService.submitAssignment).toHaveBeenCalledWith(
      'a-1',
      'student-1',
      dto,
    );
  });

  it('FR-LMS-012/013/014: should grade submission with rubric and feedback', async () => {
    const dto: GradeSubmissionDto = {
      feedback: 'Good work',
      rubric_scores: [{ criterion_id: 'content', score: 4.5 }],
      annotations: [
        { target: 'paragraph-1', comment: 'Need stronger topic sentence' },
      ],
    };

    const expected = { id: 's-1', score: 4.5 };
    mockAssignmentsService.gradeSubmission.mockResolvedValue(expected);

    const user: AuthenticatedUser = {
      id: 'teacher-1',
      email: 'teacher@example.com',
      roles: ['teacher'],
    };
    const result = await controller.gradeSubmission('s-1', dto, user);

    expect(result).toEqual(expected);
    expect(mockAssignmentsService.gradeSubmission).toHaveBeenCalledWith(
      's-1',
      'teacher-1',
      dto,
    );
  });
});
