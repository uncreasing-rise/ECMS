import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../common/prisma/prisma.service.js';

type UserContext = {
  id: string;
  role: string;
};

type StartSessionContext = {
  ipAddress?: string;
  userAgent?: string;
};

export type QuestionDraft = {
  passage_id?: string;
  section_type?: string;
  question_format?: string;
  content?: string;
  options?: Prisma.InputJsonValue;
  correct_answer?: Prisma.InputJsonValue;
  match_pairs?: Prisma.InputJsonValue;
  order_items?: Prisma.InputJsonValue;
  explanation?: string;
  difficulty?: string;
  bloom_level?: string;
  subject?: string;
  chapter?: string;
  skill?: string;
  topic?: string;
  exam_type_tags?: string[];
  is_public?: boolean;
};

type QuestionQuery = {
  search?: string;
  subject?: string;
  chapter?: string;
  difficulty?: string;
  bloom_level?: string;
  question_format?: string;
  created_by?: string;
  skip?: string;
  take?: string;
};

export type ImportQuestionsDto = {
  format?: string;
  items?: QuestionDraft[];
  raw?: string;
};

export type ManualExamQuestionItem = {
  question_id: string;
  order_index?: number;
  score?: number;
};

export type ManualExamDto = {
  title?: string;
  description?: string;
  exam_type?: string;
  subject?: string;
  duration_minutes?: number;
  total_score?: number;
  passing_score?: number;
  max_attempts?: number;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  show_result_after?: boolean;
  show_answer_after?: boolean;
  available_from?: string;
  available_until?: string;
  instructions?: string;
  questions?: ManualExamQuestionItem[];
};

export type AutoExamRule = {
  subject?: string;
  chapter?: string;
  difficulty?: string;
  question_format?: string;
  tag?: string;
  count?: number;
  score?: number;
};

export type AutoExamDto = {
  title?: string;
  description?: string;
  exam_type?: string;
  subject?: string;
  duration_minutes?: number;
  total_score?: number;
  passing_score?: number;
  max_attempts?: number;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  show_result_after?: boolean;
  show_answer_after?: boolean;
  available_from?: string;
  available_until?: string;
  instructions?: string;
  matrix?: AutoExamRule[];
};

export type AutosaveAnswerDto = {
  question_id: string;
  answer?: Prisma.InputJsonValue;
};

export type ViolationMeta = Record<string, unknown>;

@Injectable()
export class ExamsService {
  constructor(private readonly prisma: PrismaService) {}

  async createQuestion(createdBy: string, dto: QuestionDraft) {
    if (!dto.question_format || !dto.content) {
      throw new BadRequestException('question_format và content là bắt buộc');
    }

    return this.prisma.questions.create({
      data: {
        id: randomUUID(),
        created_by: createdBy,
        passage_id: dto.passage_id,
        section_type: dto.section_type,
        question_format: dto.question_format,
        content: dto.content,
        options: dto.options as Prisma.InputJsonValue,
        correct_answer: dto.correct_answer as Prisma.InputJsonValue,
        match_pairs: dto.match_pairs as Prisma.InputJsonValue,
        order_items: dto.order_items as Prisma.InputJsonValue,
        explanation: dto.explanation,
        difficulty: dto.difficulty,
        bloom_level: dto.bloom_level,
        subject: dto.subject,
        chapter: dto.chapter,
        topic: dto.skill ?? dto.topic,
        exam_type_tags: dto.exam_type_tags ?? [],
        is_public: dto.is_public ?? false,
        created_at: new Date(),
      },
    });
  }

  async getQuestions(user: UserContext, query: QuestionQuery) {
    const where: Prisma.questionsWhereInput = {};
    const andFilters: Prisma.questionsWhereInput[] = [];

    if (user.role !== 'admin') {
      where.OR = [{ created_by: user.id }, { is_public: true }];
    }

    if (query.search) {
      andFilters.push({
        OR: [
          { content: { contains: query.search, mode: 'insensitive' } },
          { subject: { contains: query.search, mode: 'insensitive' } },
          { chapter: { contains: query.search, mode: 'insensitive' } },
          { topic: { contains: query.search, mode: 'insensitive' } },
        ],
      });
    }

    if (query.subject) where.subject = query.subject;
    if (query.chapter) where.chapter = query.chapter;
    if (query.difficulty) where.difficulty = query.difficulty;
    if (query.bloom_level) where.bloom_level = query.bloom_level;
    if (query.question_format) where.question_format = query.question_format;
    if (query.created_by) where.created_by = query.created_by;
    if (andFilters.length > 0) where.AND = andFilters;

    const skip = query.skip ? Number(query.skip) : 0;
    const take = query.take ? Number(query.take) : 20;

    const [items, total] = await Promise.all([
      this.prisma.questions.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.questions.count({ where }),
    ]);

    return {
      data: items,
      total,
      skip,
      take,
      hasMore: skip + take < total,
    };
  }

  async importQuestions(createdBy: string, dto: ImportQuestionsDto) {
    if (!dto.format) {
      throw new BadRequestException('format là bắt buộc');
    }

    const questions: QuestionDraft[] = [];

    if (Array.isArray(dto.items)) {
      questions.push(...dto.items);
    } else if (dto.format === 'qti' && typeof dto.raw === 'string') {
      questions.push(...this.parseQtiBasic(dto.raw));
    } else if (
      (dto.format === 'excel' || dto.format === 'word') &&
      typeof dto.raw === 'string'
    ) {
      questions.push(...this.parseDelimitedLines(dto.raw));
    } else {
      throw new BadRequestException('Payload import không hợp lệ');
    }

    if (questions.length === 0) {
      return { imported: 0, errors: ['Không có câu hỏi hợp lệ'] };
    }

    const normalizedQuestions = questions.filter(
      (item): item is QuestionDraft & { question_format: string; content: string } =>
        typeof item.question_format === 'string' &&
        item.question_format.length > 0 &&
        typeof item.content === 'string' &&
        item.content.length > 0,
    );

    if (normalizedQuestions.length === 0) {
      return {
        imported: 0,
        errors: ['Thiếu question_format hoặc content cho toàn bộ câu hỏi import'],
      };
    }

    const created = await Promise.all(
      normalizedQuestions.map((item) =>
        this.prisma.questions.create({
          data: {
            id: randomUUID(),
            created_by: createdBy,
            question_format: item.question_format,
            content: item.content,
            options: (item.options ?? null) as Prisma.InputJsonValue,
            correct_answer: (item.correct_answer ??
              null) as Prisma.InputJsonValue,
            match_pairs: (item.match_pairs ?? null) as Prisma.InputJsonValue,
            order_items: (item.order_items ?? null) as Prisma.InputJsonValue,
            explanation: item.explanation,
            difficulty: item.difficulty,
            bloom_level: item.bloom_level,
            subject: item.subject,
            chapter: item.chapter,
            topic: item.skill ?? item.topic,
            exam_type_tags: item.exam_type_tags ?? [],
            is_public: false,
            created_at: new Date(),
          },
        }),
      ),
    );

    return {
      imported: created.length,
      ids: created.map((item) => item.id),
      skipped: questions.length - normalizedQuestions.length,
    };
  }

  async submitQuestionForReview(questionId: string, userId: string) {
    const question = await this.prisma.questions.findUnique({
      where: { id: questionId },
      select: { id: true, created_by: true },
    });

    if (!question) {
      throw new NotFoundException('Không tìm thấy câu hỏi');
    }

    if (question.created_by !== userId) {
      throw new BadRequestException('Chỉ chủ sở hữu mới được gửi review');
    }

    await this.prisma.audit_logs.create({
      data: {
        id: randomUUID(),
        user_id: userId,
        action: 'question_submit_review',
        target_type: 'question',
        target_id: questionId,
        created_at: new Date(),
      },
    });

    return { message: 'Đã gửi yêu cầu review câu hỏi' };
  }

  async approveQuestion(questionId: string, reviewerId: string) {
    const question = await this.prisma.questions.findUnique({
      where: { id: questionId },
      select: { id: true },
    });

    if (!question) {
      throw new NotFoundException('Không tìm thấy câu hỏi');
    }

    const updated = await this.prisma.questions.update({
      where: { id: questionId },
      data: {
        is_public: true,
      },
    });

    await this.prisma.audit_logs.create({
      data: {
        id: randomUUID(),
        user_id: reviewerId,
        action: 'question_approved',
        target_type: 'question',
        target_id: questionId,
        created_at: new Date(),
      },
    });

    return updated;
  }

  async getQuestionStats(questionId: string) {
    const answers = await this.prisma.exam_answers.findMany({
      where: { question_id: questionId },
      include: {
        exam_sessions: {
          select: { final_score: true },
        },
      },
    });

    if (answers.length === 0) {
      return {
        question_id: questionId,
        total_answers: 0,
        correct_ratio: 0,
        discrimination_index: 0,
      };
    }

    const total = answers.length;
    const correctCount = answers.filter(
      (answer) => answer.is_correct === true,
    ).length;
    const correctRatio = Number(((correctCount / total) * 100).toFixed(2));

    const sorted = answers
      .map((answer) => ({
        correct: answer.is_correct === true ? 1 : 0,
        final: Number(answer.exam_sessions.final_score ?? 0),
      }))
      .sort((a, b) => b.final - a.final);

    const groupSize = Math.max(1, Math.floor(total * 0.27));
    const upper = sorted.slice(0, groupSize);
    const lower = sorted.slice(-groupSize);

    const upperCorrect =
      upper.reduce((sum, item) => sum + item.correct, 0) / upper.length;
    const lowerCorrect =
      lower.reduce((sum, item) => sum + item.correct, 0) / lower.length;

    return {
      question_id: questionId,
      total_answers: total,
      correct_ratio: correctRatio,
      discrimination_index: Number((upperCorrect - lowerCorrect).toFixed(4)),
    };
  }

  async createManualExam(createdBy: string, dto: ManualExamDto) {
    if (
      !dto.title ||
      !Array.isArray(dto.questions) ||
      dto.questions.length === 0
    ) {
      throw new BadRequestException('title và questions là bắt buộc');
    }

    if (!dto.duration_minutes || dto.duration_minutes <= 0) {
      throw new BadRequestException('duration_minutes là bắt buộc và phải > 0');
    }

    const examId = randomUUID();
    const exam = await this.prisma.exams.create({
      data: {
        id: examId,
        created_by: createdBy,
        title: dto.title,
        description: dto.description,
        exam_type: dto.exam_type,
        subject: dto.subject,
        duration_minutes: dto.duration_minutes,
        total_score: dto.total_score,
        passing_score: dto.passing_score,
        max_attempts: dto.max_attempts,
        shuffle_questions: dto.shuffle_questions,
        shuffle_options: dto.shuffle_options,
        show_result_after: dto.show_result_after,
        show_answer_after: dto.show_answer_after,
        available_from: dto.available_from
          ? new Date(dto.available_from)
          : undefined,
        available_until: dto.available_until
          ? new Date(dto.available_until)
          : undefined,
        instructions: dto.instructions,
        created_at: new Date(),
      },
    });

    await this.prisma.exam_questions.createMany({
      data: dto.questions.map((item: ManualExamQuestionItem, index: number) => ({
        id: randomUUID(),
        exam_id: exam.id,
        question_id: item.question_id,
        order_index: item.order_index ?? index + 1,
        score: item.score ?? 1,
      })),
    });

    return exam;
  }

  async createAutoExam(createdBy: string, dto: AutoExamDto) {
    if (!dto.title || !Array.isArray(dto.matrix) || dto.matrix.length === 0) {
      throw new BadRequestException('title và matrix là bắt buộc');
    }

    const pickedQuestionIds: string[] = [];

    for (const rule of dto.matrix) {
      const candidates = await this.prisma.questions.findMany({
        where: {
          ...(rule.subject ? { subject: rule.subject } : {}),
          ...(rule.chapter ? { chapter: rule.chapter } : {}),
          ...(rule.difficulty ? { difficulty: rule.difficulty } : {}),
          ...(rule.question_format
            ? { question_format: rule.question_format }
            : {}),
          ...(rule.tag
            ? {
                exam_type_tags: {
                  has: rule.tag,
                },
              }
            : {}),
          OR: [{ created_by: createdBy }, { is_public: true }],
        },
        select: { id: true },
      });

      const shuffled = candidates.sort(() => Math.random() - 0.5);
      const count = Number(rule.count ?? 0);
      pickedQuestionIds.push(
        ...shuffled.slice(0, count).map((item) => item.id),
      );
    }

    const uniqueQuestionIds = Array.from(new Set(pickedQuestionIds));
    if (uniqueQuestionIds.length === 0) {
      throw new BadRequestException(
        'Không chọn được câu hỏi phù hợp từ ma trận',
      );
    }

    const totalScore = Number(dto.total_score ?? uniqueQuestionIds.length);

    return this.createManualExam(createdBy, {
      ...dto,
      description: JSON.stringify({
        ...(dto.description ? { text: dto.description } : {}),
        matrix: dto.matrix,
      }),
      questions: uniqueQuestionIds.map((questionId, index) => ({
        question_id: questionId,
        order_index: index + 1,
        score: Number((totalScore / uniqueQuestionIds.length).toFixed(2)),
      })),
    });
  }

  async assignExamToClasses(
    examId: string,
    classIds: string[],
    assignedBy: string,
  ) {
    const exam = await this.prisma.exams.findUnique({
      where: { id: examId },
      select: { id: true },
    });
    if (!exam) {
      throw new NotFoundException('Không tìm thấy đề thi');
    }

    const uniqueClassIds = Array.from(new Set(classIds));

    await Promise.all(
      uniqueClassIds.map(async (classId) => {
        const existing = await this.prisma.exam_classes.findFirst({
          where: { exam_id: examId, class_id: classId },
          select: { id: true },
        });

        if (!existing) {
          await this.prisma.exam_classes.create({
            data: {
              id: randomUUID(),
              exam_id: examId,
              class_id: classId,
              assigned_at: new Date(),
              assigned_by: assignedBy,
            },
          });
        }
      }),
    );

    return {
      exam_id: examId,
      assigned_class_ids: uniqueClassIds,
    };
  }

  async previewExam(examId: string) {
    const exam = await this.prisma.exams.findUnique({
      where: { id: examId },
      include: {
        exam_questions: {
          include: {
            questions: true,
          },
          orderBy: { order_index: 'asc' },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Không tìm thấy đề thi');
    }

    const shuffledQuestions =
      exam.shuffle_questions === true
        ? exam.exam_questions.slice().sort(() => Math.random() - 0.5)
        : exam.exam_questions;

    return {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      instructions: exam.instructions,
      duration_minutes: exam.duration_minutes,
      show_result_after: exam.show_result_after,
      show_answer_after: exam.show_answer_after,
      questions: shuffledQuestions.map((item, index) => ({
        order_index: index + 1,
        question_id: item.question_id,
        question_format: item.questions.question_format,
        content: item.questions.content,
        options:
          exam.shuffle_options === true
            ? this.shuffleQuestionOptions(item.questions.options)
            : item.questions.options,
        match_pairs: item.questions.match_pairs,
      })),
    };
  }

  async generateExamVariants(examId: string, versions: number) {
    const preview = await this.previewExam(examId);
    const versionCount = Math.max(1, Math.min(20, versions));

    const generated = Array.from({ length: versionCount }).map((_, index) => ({
      code: `V${index + 1}`,
      questions: preview.questions
        .slice()
        .sort(() => Math.random() - 0.5)
        .map((question, qIdx) => ({
          ...question,
          order_index: qIdx + 1,
        })),
    }));

    return {
      exam_id: examId,
      total_versions: versionCount,
      variants: generated,
    };
  }

  async startOrResumeSession(
    examId: string,
    studentId: string,
    context: StartSessionContext,
  ) {
    const exam = await this.prisma.exams.findUnique({
      where: { id: examId },
      include: {
        exam_questions: {
          select: {
            question_id: true,
            score: true,
          },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Không tìm thấy đề thi');
    }

    const now = new Date();
    if (exam.available_from && now < exam.available_from) {
      throw new BadRequestException('Chưa đến thời gian mở bài thi');
    }
    if (exam.available_until && now > exam.available_until) {
      throw new BadRequestException('Đã hết cửa sổ thời gian bắt đầu bài thi');
    }

    const assignedClass = await this.prisma.exam_classes.findFirst({
      where: {
        exam_id: examId,
        classes: {
          enrollments: {
            some: {
              student_id: studentId,
              status: 'active',
            },
          },
        },
      },
      select: { id: true },
    });

    if (!assignedClass) {
      throw new BadRequestException('Bạn không thuộc lớp được giao đề thi này');
    }

    const activeSession = await this.prisma.exam_sessions.findFirst({
      where: {
        exam_id: examId,
        student_id: studentId,
        status: 'in_progress',
        submitted_at: null,
      },
      orderBy: { started_at: 'desc' },
    });

    if (activeSession) {
      return {
        resumed: true,
        session: activeSession,
      };
    }

    const totalAttempts = await this.prisma.exam_sessions.count({
      where: {
        exam_id: examId,
        student_id: studentId,
      },
    });

    const maxAttempts = Number(exam.max_attempts ?? 1);
    if (totalAttempts >= maxAttempts) {
      throw new BadRequestException('Bạn đã hết số lần làm bài cho phép');
    }

    const attemptNumber = totalAttempts + 1;
    const expiresAt = new Date(
      now.getTime() + exam.duration_minutes * 60 * 1000,
    );

    const session = await this.prisma.exam_sessions.create({
      data: {
        id: randomUUID(),
        exam_id: examId,
        student_id: studentId,
        attempt_number: attemptNumber,
        started_at: now,
        expires_at: expiresAt,
        status: 'in_progress',
        violation_count: 0,
        violation_log: [],
        ip_address: context.ipAddress,
        device_info: {
          user_agent: context.userAgent,
        } as Prisma.InputJsonValue,
      },
    });

    await this.prisma.exam_answers.createMany({
      data: exam.exam_questions.map((question) => ({
        id: randomUUID(),
        session_id: session.id,
        question_id: question.question_id,
        answer: Prisma.JsonNull,
      })),
    });

    return {
      resumed: false,
      session,
    };
  }

  async autosaveAnswer(
    sessionId: string,
    studentId: string,
    dto: AutosaveAnswerDto,
  ) {
    const session = await this.prisma.exam_sessions.findUnique({
      where: { id: sessionId },
      select: { id: true, student_id: true, status: true, expires_at: true },
    });

    if (!session) {
      throw new NotFoundException('Không tìm thấy phiên thi');
    }

    if (session.student_id !== studentId) {
      throw new BadRequestException('Bạn không có quyền với phiên thi này');
    }

    if (session.status !== 'in_progress') {
      throw new BadRequestException('Phiên thi đã kết thúc');
    }

    if (session.expires_at.getTime() < Date.now()) {
      await this.submitSession(sessionId, studentId, true);
      throw new BadRequestException('Phiên thi đã hết giờ và được nộp tự động');
    }

    await this.prisma.exam_answers.updateMany({
      where: {
        session_id: sessionId,
        question_id: dto.question_id,
      },
      data: {
        answer: dto.answer as Prisma.InputJsonValue,
        answered_at: new Date(),
      },
    });

    return { message: 'Đã lưu tiến độ' };
  }

  async logViolation(
    sessionId: string,
    studentId: string,
    type: string,
    meta?: ViolationMeta,
  ) {
    const session = await this.prisma.exam_sessions.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        student_id: true,
        violation_count: true,
        violation_log: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Không tìm thấy phiên thi');
    }

    if (session.student_id !== studentId) {
      throw new BadRequestException('Bạn không có quyền với phiên thi này');
    }

    const previousLog = Array.isArray(session.violation_log)
      ? session.violation_log
      : [];
    const nextLog = [
      ...previousLog,
      {
        type,
        meta: meta ?? {},
        at: new Date().toISOString(),
      },
    ];

    const updated = await this.prisma.exam_sessions.update({
      where: { id: sessionId },
      data: {
        violation_count: Number(session.violation_count ?? 0) + 1,
        violation_log: nextLog as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        violation_count: true,
        violation_log: true,
      },
    });

    return updated;
  }

  async submitSession(sessionId: string, studentId: string, isAuto = false) {
    const session = await this.prisma.exam_sessions.findUnique({
      where: { id: sessionId },
      include: {
        exams: {
          include: {
            exam_questions: {
              include: {
                questions: true,
              },
            },
          },
        },
        exam_answers: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Không tìm thấy phiên thi');
    }

    if (session.student_id !== studentId) {
      throw new BadRequestException('Bạn không có quyền với phiên thi này');
    }

    if (session.submitted_at) {
      return {
        message: 'Bài thi đã được nộp trước đó',
        session_id: session.id,
      };
    }

    const scoreByQuestion = new Map(
      session.exams.exam_questions.map((item) => [
        item.question_id,
        Number(item.score ?? 1),
      ]),
    );
    const questionMap = new Map(
      session.exams.exam_questions.map((item) => [
        item.question_id,
        item.questions,
      ]),
    );

    let autoScore = 0;

    for (const answer of session.exam_answers) {
      const question = questionMap.get(answer.question_id);
      if (!question) continue;

      const isObjective = this.isObjectiveQuestion(question.question_format);
      if (!isObjective) continue;

      const isCorrect = this.isAnswerCorrect(
        answer.answer,
        question.correct_answer,
      );
      const score = isCorrect
        ? (scoreByQuestion.get(answer.question_id) ?? 0)
        : 0;
      autoScore += score;

      await this.prisma.exam_answers.update({
        where: {
          session_id_question_id: {
            session_id: session.id,
            question_id: answer.question_id,
          },
        },
        data: {
          is_correct: isCorrect,
          auto_score: score,
        },
      });
    }

    const finalScore = Number(autoScore.toFixed(2));

    return this.prisma.exam_sessions.update({
      where: { id: session.id },
      data: {
        submitted_at: new Date(),
        status: isAuto ? 'auto_submitted' : 'submitted',
        auto_score: finalScore,
        final_score: finalScore,
      },
    });
  }

  async gradeEssayAnswer(
    sessionId: string,
    questionId: string,
    teacherId: string,
    dto: { score: number; feedback?: string },
  ) {
    const session = await this.prisma.exam_sessions.findUnique({
      where: { id: sessionId },
      select: { id: true },
    });

    if (!session) {
      throw new NotFoundException('Không tìm thấy phiên thi');
    }

    await this.prisma.exam_answers.update({
      where: {
        session_id_question_id: {
          session_id: sessionId,
          question_id: questionId,
        },
      },
      data: {
        manual_score: dto.score,
        feedback: dto.feedback,
      },
    });

    const answers = await this.prisma.exam_answers.findMany({
      where: { session_id: sessionId },
      select: { auto_score: true, manual_score: true },
    });

    const final = Number(
      answers
        .reduce(
          (sum, item) =>
            sum + Number(item.manual_score ?? item.auto_score ?? 0),
          0,
        )
        .toFixed(2),
    );

    return this.prisma.exam_sessions.update({
      where: { id: sessionId },
      data: {
        manual_score: final,
        final_score: final,
        reviewed_by: teacherId,
        reviewed_at: new Date(),
        status: 'graded',
      },
    });
  }

  async getSessionResult(sessionId: string, requester: UserContext) {
    const session = await this.prisma.exam_sessions.findUnique({
      where: { id: sessionId },
      include: {
        exams: true,
        exam_answers: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Không tìm thấy phiên thi');
    }

    if (requester.role === 'student' && requester.id !== session.student_id) {
      throw new BadRequestException('Bạn không có quyền xem kết quả này');
    }

    const canShowResult =
      requester.role !== 'student' || session.exams.show_result_after;
    if (!canShowResult) {
      return {
        session_id: session.id,
        message: 'Kết quả chưa được phép hiển thị',
      };
    }

    return {
      session_id: session.id,
      exam_id: session.exam_id,
      status: session.status,
      started_at: session.started_at,
      submitted_at: session.submitted_at,
      final_score: session.final_score,
      violation_count: session.violation_count,
      violation_log: session.violation_log,
      answers: session.exam_answers.map((item) => ({
        question_id: item.question_id,
        answer: item.answer,
        is_correct: item.is_correct,
        auto_score: item.auto_score,
        manual_score: item.manual_score,
        feedback: item.feedback,
        correct_answer: session.exams.show_answer_after
          ? item.questions.correct_answer
          : null,
      })),
    };
  }

  async getViolationReport(examId: string) {
    const sessions = await this.prisma.exam_sessions.findMany({
      where: { exam_id: examId },
      include: {
        users_exam_sessions_student_idTousers: {
          select: { id: true, full_name: true, email: true },
        },
      },
      orderBy: [{ violation_count: 'desc' }, { started_at: 'desc' }],
    });

    return {
      exam_id: examId,
      total_sessions: sessions.length,
      total_violations: sessions.reduce(
        (sum, item) => sum + Number(item.violation_count ?? 0),
        0,
      ),
      sessions: sessions.map((item) => ({
        session_id: item.id,
        student: item.users_exam_sessions_student_idTousers,
        violation_count: item.violation_count,
        violation_log: item.violation_log,
        ip_address: item.ip_address,
        device_info: item.device_info,
      })),
    };
  }

  private parseDelimitedLines(raw: string) {
    const lines = raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    return lines.map((line) => {
      const [content, answer] = line.split('\t');
      return {
        question_format: 'short_answer',
        content,
        correct_answer: { answer },
      };
    });
  }

  private parseQtiBasic(raw: string) {
    const items = raw.match(/<item[\s\S]*?<\/item>/g) ?? [];
    return items.map((item, idx) => {
      const contentMatch = item.match(/<mattext[^>]*>([\s\S]*?)<\/mattext>/);
      return {
        question_format: 'mcq',
        content: contentMatch?.[1]?.trim() ?? `QTI item ${idx + 1}`,
      };
    });
  }

  private isObjectiveQuestion(format: string | null) {
    const normalized = (format ?? '').toLowerCase();
    return !['essay', 'short_essay', 'long_essay'].includes(normalized);
  }

  private isAnswerCorrect(
    answer: Prisma.JsonValue | null,
    correct: Prisma.JsonValue | null,
  ) {
    if (answer === null || correct === null) {
      return false;
    }

    const normalizedAnswer = this.normalizeJson(answer);
    const normalizedCorrect = this.normalizeJson(correct);
    return (
      JSON.stringify(normalizedAnswer) === JSON.stringify(normalizedCorrect)
    );
  }

  private normalizeJson(value: Prisma.JsonValue): Prisma.JsonValue {
    if (Array.isArray(value)) {
      return value.map((item) => this.normalizeJson(item));
    }

    if (value && typeof value === 'object') {
      const entries = Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [
          key,
          this.normalizeJson(item as Prisma.JsonValue),
        ]);
      return Object.fromEntries(entries) as Prisma.JsonValue;
    }

    return value;
  }

  private shuffleQuestionOptions(options: Prisma.JsonValue | null) {
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      return options;
    }

    const entries = Object.entries(options);
    const shuffled = entries.sort(() => Math.random() - 0.5);
    return Object.fromEntries(shuffled);
  }
}
