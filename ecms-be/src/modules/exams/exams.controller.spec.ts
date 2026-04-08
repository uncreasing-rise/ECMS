/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ExamsController } from './exams.controller';
import { ExamsService } from './exams.service';

describe('ExamsController', () => {
  let controller: ExamsController;

  const mockExamsService = {
    createQuestion: jest.fn(),
    createManualExam: jest.fn(),
    createAutoExam: jest.fn(),
    startOrResumeSession: jest.fn(),
    autosaveAnswer: jest.fn(),
    submitSession: jest.fn(),
    getSessionResult: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExamsController],
      providers: [
        {
          provide: ExamsService,
          useValue: mockExamsService,
        },
      ],
    }).compile();

    controller = module.get<ExamsController>(ExamsController);
    jest.clearAllMocks();
  });

  it('FR-EXM-001: should create question', async () => {
    mockExamsService.createQuestion.mockResolvedValue({ id: 'q-1' });
    const teacher: AuthenticatedUser = {
      id: 'teacher-1',
      email: 'teacher@example.com',
      roles: ['teacher'],
    };

    const result = await controller.createQuestion(
      teacher,
      {
        question_format: 'mcq',
        content: 'What is 2 + 2?',
      },
    );

    expect(result).toEqual({ id: 'q-1' });
    expect(mockExamsService.createQuestion).toHaveBeenCalledWith('teacher-1', {
      question_format: 'mcq',
      content: 'What is 2 + 2?',
    });
  });

  it('FR-EXM-011: should create auto exam', async () => {
    mockExamsService.createAutoExam.mockResolvedValue({ id: 'e-1' });
    const teacher: AuthenticatedUser = {
      id: 'teacher-1',
      email: 'teacher@example.com',
      roles: ['teacher'],
    };

    const result = await controller.createAutoExam(
      teacher,
      { title: 'Auto Test', matrix: [{ subject: 'Math', count: 10 }] },
    );

    expect(result).toEqual({ id: 'e-1' });
    expect(mockExamsService.createAutoExam).toHaveBeenCalled();
  });

  it('FR-EXM-022: should start or resume session', async () => {
    mockExamsService.startOrResumeSession.mockResolvedValue({
      resumed: false,
      session: { id: 's-1' },
    });

    const student: AuthenticatedUser = {
      id: 'student-1',
      email: 'student@example.com',
      roles: ['student'],
    };
    const request = {
      ip: '127.0.0.1',
      headers: { 'user-agent': 'jest', 'x-forwarded-for': '127.0.0.1' },
    } as unknown as Request;

    const result = await controller.startOrResumeSession(
      'exam-1',
      student,
      request,
    );

    expect(result.session.id).toBe('s-1');
  });

  it('FR-EXM-023: should submit exam session', async () => {
    mockExamsService.submitSession.mockResolvedValue({
      id: 's-1',
      final_score: 8,
    });
    const student: AuthenticatedUser = {
      id: 'student-1',
      email: 'student@example.com',
      roles: ['student'],
    };

    const result = await controller.submitSession('s-1', student);

    expect('final_score' in result ? result.final_score : null).toBe(8);
    expect(mockExamsService.submitSession).toHaveBeenCalledWith(
      's-1',
      'student-1',
    );
  });
});
