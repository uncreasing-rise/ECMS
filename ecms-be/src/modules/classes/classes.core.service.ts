import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { randomUUID } from 'node:crypto';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { EnrollStudentDto } from './dto/enroll-student.dto';
import { CreateClassResourceDto } from './dto/create-class-resource.dto';
import { ClassCreateAssignmentDto } from './dto/create-assignment.dto';
import { CreateClassTestDto } from './dto/create-class-test.dto';
import { ClassSubmitAssignmentDto } from './dto/submit-assignment.dto';
import { ClassGradeSubmissionDto } from './dto/grade-submission.dto';
import { StartExamAttemptDto } from './dto/start-exam-attempt.dto';
import { UpsertExamAnswerDto } from './dto/upsert-exam-answer.dto';
import { SubmitExamAttemptDto } from './dto/submit-exam-attempt.dto';
import { CreateBlueprintTemplateDto } from './dto/create-blueprint-template.dto';
import { UpdateBlueprintTemplateDto } from './dto/update-blueprint-template.dto';
import { CreateBlueprintSectionDto } from './dto/create-blueprint-section.dto';
import { UpdateBlueprintSectionDto } from './dto/update-blueprint-section.dto';
import {
  CLASS_NOTIFICATION_PUBLISHER,
  type ClassNotificationPublisher,
} from './contracts/class-notification.publisher.js';
import {
  type GetClassStudentsParams,
  type GetClassesParams,
} from './contracts/classes-lifecycle.contract.js';
import { InvoicesService } from '../invoices/invoices.service.js';

interface EffectiveBlueprintSection {
  name: string;
  order_index: number;
  duration_minutes: number;
  num_questions: number;
  score_per_question?: number;
  section_type?: string;
  skill?: string;
  difficulty?: string;
  question_formats?: string[];
  exam_type_tags?: string[];
}

interface BlueprintSectionMeta {
  difficulty?: string;
  question_formats?: string[];
  exam_type_tags?: string[];
}

interface ExamMeta {
  scoring_policy?: {
    mode?: string;
    negative_marking_ratio?: number;
    difficulty_weights?: Record<string, number>;
  };
}

type ScoringMode = 'standard' | 'weighted' | 'negative';

const EXAM_META_MARKER = '[ECMS_META]';
const BLUEPRINT_SECTION_META_MARKER = '[ECMS_BP_META]';

@Injectable()
export class ClassesCoreService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    @Inject(CLASS_NOTIFICATION_PUBLISHER)
    private readonly notificationsService?: ClassNotificationPublisher,
    @Optional()
    private readonly invoicesService?: InvoicesService,
  ) {}

  async createClass(dto: CreateClassDto, actorId: string) {
    const course = await this.prisma.courses.findUnique({
      where: { id: dto.course_id },
      select: { id: true },
    });

    if (!course) {
      throw new BadRequestException('course_id không tồn tại');
    }

    if (dto.teacher_id) {
      const teacher = await this.prisma.users.findUnique({
        where: { id: dto.teacher_id },
        select: { id: true },
      });
      if (!teacher) {
        throw new BadRequestException('teacher_id không tồn tại');
      }
    }

    const created = await this.prisma.classes.create({
      data: {
        id: randomUUID(),
        course_id: dto.course_id,
        teacher_id: dto.teacher_id,
        name: dto.name,
        max_students: dto.max_students,
        start_date: dto.start_date ? new Date(dto.start_date) : null,
        end_date: dto.end_date ? new Date(dto.end_date) : null,
        status: dto.status ?? 'active',
        created_at: new Date(),
      } as unknown as Prisma.classesUncheckedCreateInput,
    });

    if (
      dto.teacher_id &&
      dto.teacher_id !== actorId &&
      this.notificationsService
    ) {
      await this.notificationsService.create({
        user_id: dto.teacher_id,
        type: 'class_assigned_teacher',
        title: 'Bạn được phân công lớp mới',
        body: `Bạn được phân công phụ trách lớp: ${created.name ?? 'Lớp học mới'}`,
        ref_type: 'class',
        ref_id: created.id,
      });
    }

    return created;
  }

  async getClasses(params: GetClassesParams) {
    await this.ensureRole(params.actorId, ['admin', 'teacher']);

    const where: Prisma.classesWhereInput = {};

    if (params.courseId) where.course_id = params.courseId;
    if (params.teacherId) where.teacher_id = params.teacherId;
    const isAdmin = await this.hasRole(params.actorId, 'admin');
    if (!isAdmin) {
      where.teacher_id = params.actorId;
    }

    if (params.status) where.status = params.status;
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { courses: { name: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.classes.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { created_at: 'desc' },
        include: {
          courses: {
            select: {
              id: true,
              name: true,
              description: true,
              level: true,
              total_sessions: true,
              price: true,
              is_active: true,
              created_at: true,
            },
          },
          users: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
          _count: {
            select: {
              enrollments: true,
              class_schedules: true,
            },
          },
        },
      }),
      this.prisma.classes.count({ where }),
    ]);

    return {
      data: items,
      total,
      skip: params.skip,
      take: params.take,
      hasMore: params.skip + params.take < total,
    };
  }

  async getClassById(classId: string, actorId: string) {
    await this.ensureCanViewClass(classId, actorId);

    const item = await this.prisma.classes.findUnique({
      where: { id: classId },
      include: {
        courses: {
          select: {
            id: true,
            name: true,
            description: true,
            level: true,
            total_sessions: true,
            price: true,
            is_active: true,
            created_at: true,
          },
        },
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            assignments: true,
            class_schedules: true,
            grades: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Không tìm thấy lớp học');
    }

    return item;
  }

  async getClassStudents(params: GetClassStudentsParams) {
    await this.ensureCanManageClass(
      params.classId,
      params.actorId,
      'Giáo viên chỉ được xem học viên lớp của mình',
    );

    const where: Prisma.enrollmentsWhereInput = { class_id: params.classId };
    if (params.status) where.status = params.status;

    const [items, total] = await Promise.all([
      this.prisma.enrollments.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { enrolled_at: 'desc' },
        include: {
          users: {
            select: {
              id: true,
              full_name: true,
              email: true,
              phone: true,
              status: true,
            },
          },
          invoices: {
            select: {
              id: true,
              amount: true,
              paid_amount: true,
              due_date: true,
              status: true,
            },
            orderBy: {
              due_date: 'desc',
            },
          },
        },
      }),
      this.prisma.enrollments.count({ where }),
    ]);

    return {
      data: items,
      total,
      skip: params.skip,
      take: params.take,
      hasMore: params.skip + params.take < total,
    };
  }

  async getClassResources(classId: string, actorId: string) {
    await this.ensureCanViewClass(classId, actorId);

    return this.prisma.documents.findMany({
      where: {
        scope: 'class',
        scope_id: classId,
      },
      orderBy: { uploaded_at: 'desc' },
      include: {
        users: {
          select: { id: true, full_name: true, email: true },
        },
      },
    });
  }

  async createClassResource(
    classId: string,
    dto: CreateClassResourceDto,
    actorId: string,
  ) {
    await this.ensureCanManageClass(
      classId,
      actorId,
      'Giáo viên chỉ được tạo tài nguyên cho lớp của mình',
    );

    const resource = await this.prisma.documents.create({
      data: {
        id: randomUUID(),
        scope: 'class',
        scope_id: classId,
        title: dto.title,
        description: dto.description,
        file_url: dto.file_url,
        file_name: dto.file_name,
        file_type: dto.file_type,
        is_public: dto.is_public ?? false,
        tags: dto.tags ?? [],
        uploaded_by: actorId,
        uploaded_at: new Date(),
        updated_at: new Date(),
      },
    });

    await this.notifyClassStudents(classId, {
      type: 'class_resource_created',
      title: 'Tài nguyên lớp mới',
      body: `Lớp của bạn có tài nguyên mới: ${dto.title}`,
      ref_type: 'document',
      ref_id: resource.id,
    });

    return resource;
  }

  async getClassAssignments(classId: string, actorId: string) {
    await this.ensureCanViewClass(classId, actorId);

    return this.prisma.assignments.findMany({
      where: { class_id: classId },
      orderBy: [{ due_at: 'asc' }, { created_at: 'desc' }],
      include: {
        users: {
          select: { id: true, full_name: true, email: true },
        },
        _count: {
          select: { submissions: true },
        },
      },
    });
  }

  async createAssignment(
    classId: string,
    dto: ClassCreateAssignmentDto,
    actorId: string,
  ) {
    await this.ensureCanManageClass(
      classId,
      actorId,
      'Giáo viên chỉ được tạo assignment cho lớp của mình',
    );

    const assignment = await this.prisma.assignments.create({
      data: {
        id: randomUUID(),
        class_id: classId,
        created_by: actorId,
        title: dto.title,
        description: dto.description,
        due_at: dto.due_at ? new Date(dto.due_at) : null,
        max_score: dto.max_score,
        allow_resubmit: dto.allow_resubmit ?? false,
        created_at: new Date(),
      },
    });

    await this.notifyClassStudents(classId, {
      type: 'assignment_created',
      title: 'Assignment mới',
      body: `Bạn có assignment mới: ${dto.title}`,
      ref_type: 'assignment',
      ref_id: assignment.id,
    });

    return assignment;
  }

  async getAssignmentSubmissions(
    classId: string,
    assignmentId: string,
    actorId: string,
  ) {
    await this.ensureCanManageClass(
      classId,
      actorId,
      'Giáo viên chỉ được xem bài nộp lớp của mình',
    );

    const assignment = await this.prisma.assignments.findFirst({
      where: { id: assignmentId, class_id: classId },
      select: { id: true },
    });
    if (!assignment) {
      throw new NotFoundException('Không tìm thấy assignment trong lớp này');
    }

    return this.prisma.submissions.findMany({
      where: { assignment_id: assignmentId },
      orderBy: { submitted_at: 'desc' },
      include: {
        users_submissions_student_idTousers: {
          select: { id: true, full_name: true, email: true },
        },
        users_submissions_graded_byTousers: {
          select: { id: true, full_name: true, email: true },
        },
      },
    });
  }

  async submitAssignment(
    classId: string,
    assignmentId: string,
    dto: ClassSubmitAssignmentDto,
    studentId: string,
  ) {
    await this.ensureStudentEnrolledInClass(classId, studentId);

    if (!dto.content && !dto.file_url) {
      throw new BadRequestException('Cần có content hoặc file_url để nộp bài');
    }

    const assignment = await this.prisma.assignments.findFirst({
      where: { id: assignmentId, class_id: classId },
      select: { id: true, allow_resubmit: true, due_at: true },
    });
    if (!assignment) {
      throw new NotFoundException('Không tìm thấy assignment trong lớp này');
    }

    if (assignment.due_at && new Date() > assignment.due_at) {
      throw new BadRequestException('Đã quá hạn nộp bài');
    }

    const latestSubmission = await this.prisma.submissions.findFirst({
      where: { assignment_id: assignmentId, student_id: studentId },
      orderBy: { submitted_at: 'desc' },
      select: { id: true },
    });

    if (latestSubmission && !assignment.allow_resubmit) {
      throw new ConflictException('Assignment này không cho phép nộp lại');
    }

    const created = await this.prisma.submissions.create({
      data: {
        id: randomUUID(),
        assignment_id: assignmentId,
        student_id: studentId,
        content: dto.content,
        file_url: dto.file_url,
        submitted_at: new Date(),
      },
    });

    await this.notifyClassManagers(classId, {
      type: 'assignment_submitted',
      title: 'Có bài nộp assignment mới',
      body: 'Một học viên vừa nộp assignment.',
      ref_type: 'submission',
      ref_id: created.id,
    });

    return created;
  }

  async gradeAssignmentSubmission(
    classId: string,
    assignmentId: string,
    submissionId: string,
    dto: ClassGradeSubmissionDto,
    graderId: string,
  ) {
    await this.ensureCanManageClass(
      classId,
      graderId,
      'Giáo viên chỉ được chấm bài lớp của mình',
    );

    const assignment = await this.prisma.assignments.findFirst({
      where: { id: assignmentId, class_id: classId },
      select: { id: true, max_score: true },
    });
    if (!assignment) {
      throw new NotFoundException('Không tìm thấy assignment trong lớp này');
    }

    const maxScore = assignment.max_score ? Number(assignment.max_score) : 10;
    if (dto.score > maxScore) {
      throw new BadRequestException(
        `Điểm không được vượt quá max_score (${maxScore})`,
      );
    }

    const submission = await this.prisma.submissions.findFirst({
      where: { id: submissionId, assignment_id: assignmentId },
      select: { id: true, student_id: true },
    });
    if (!submission) {
      throw new NotFoundException('Không tìm thấy bài nộp');
    }

    const updated = await this.prisma.submissions.update({
      where: { id: submissionId },
      data: {
        score: dto.score,
        feedback: dto.feedback,
        graded_by: graderId,
        graded_at: new Date(),
      },
    });

    await this.recomputeStudentGrade(classId, submission.student_id);

    if (this.notificationsService) {
      await this.notificationsService.create({
        user_id: submission.student_id,
        type: 'assignment_graded',
        title: 'Bài nộp đã được chấm',
        body: `Bạn vừa được chấm điểm assignment: ${dto.score}`,
        ref_type: 'submission',
        ref_id: submissionId,
      });
    }

    return updated;
  }

  async updateClass(classId: string, dto: UpdateClassDto, actorId: string) {
    await this.ensureCanManageClass(
      classId,
      actorId,
      'Giáo viên chỉ được sửa lớp của mình',
    );

    const before = await this.prisma.classes.findUnique({
      where: { id: classId },
      select: { id: true, name: true, teacher_id: true },
    });

    if (!before) {
      throw new NotFoundException('Không tìm thấy lớp học');
    }

    if (dto.course_id) {
      const course = await this.prisma.courses.findUnique({
        where: { id: dto.course_id },
        select: { id: true },
      });
      if (!course) {
        throw new BadRequestException('course_id không tồn tại');
      }
    }

    if (dto.teacher_id !== undefined && dto.teacher_id !== null) {
      const teacher = await this.prisma.users.findUnique({
        where: { id: dto.teacher_id },
        select: { id: true },
      });
      if (!teacher) {
        throw new BadRequestException('teacher_id không tồn tại');
      }
    }

    const updated = await this.prisma.classes.update({
      where: { id: classId },
      data: {
        course_id: dto.course_id,
        teacher_id: dto.teacher_id === undefined ? undefined : dto.teacher_id,
        name: dto.name,
        max_students: dto.max_students,
        start_date:
          dto.start_date === undefined
            ? undefined
            : dto.start_date
              ? new Date(dto.start_date)
              : null,
        end_date:
          dto.end_date === undefined
            ? undefined
            : dto.end_date
              ? new Date(dto.end_date)
              : null,
        status: dto.status,
      },
    });

    await this.notifyClassStudents(classId, {
      type: 'class_updated',
      title: 'Lớp học có cập nhật mới',
      body: `Thông tin lớp ${updated.name ?? ''} đã được cập nhật.`.trim(),
      ref_type: 'class',
      ref_id: classId,
    });

    if (
      updated.teacher_id &&
      updated.teacher_id !== before.teacher_id &&
      this.notificationsService
    ) {
      await this.notificationsService.create({
        user_id: updated.teacher_id,
        type: 'class_assigned_teacher',
        title: 'Bạn được phân công lớp',
        body: `Bạn vừa được phân công phụ trách lớp: ${updated.name ?? 'Lớp học'}`,
        ref_type: 'class',
        ref_id: classId,
      });
    }

    return updated;
  }

  async enrollStudent(classId: string, dto: EnrollStudentDto) {
    const [classItem, student] = await Promise.all([
      this.prisma.classes.findUnique({
        where: { id: classId },
        select: { id: true, max_students: true },
      }),
      this.prisma.users.findUnique({
        where: { id: dto.student_id },
        select: { id: true },
      }),
    ]);

    if (!classItem) {
      throw new NotFoundException('Không tìm thấy lớp học');
    }
    if (!student) {
      throw new BadRequestException('student_id không tồn tại');
    }

    const targetStatus = dto.status ?? 'active';

    const existing = await this.prisma.enrollments.findFirst({
      where: { class_id: classId, student_id: dto.student_id },
      select: { id: true, status: true },
    });

    if (existing && existing.status === 'active') {
      throw new ConflictException('Học viên đã nằm trong lớp');
    }

    if (targetStatus === 'active') {
      if (
        classItem.max_students !== null &&
        classItem.max_students !== undefined
      ) {
        const activeCount = await this.prisma.enrollments.count({
          where: { class_id: classId, status: 'active' },
        });

        if (activeCount >= classItem.max_students) {
          throw new ConflictException('Lớp học đã đủ sĩ số');
        }
      }

      const classSchedules = await this.prisma.class_schedules.findMany({
        where: { class_id: classId },
        select: { starts_at: true, ends_at: true },
      });

      if (classSchedules.length) {
        const studentSchedules = await this.prisma.class_schedules.findMany({
          where: {
            class_id: { not: classId },
            classes: {
              enrollments: {
                some: {
                  student_id: dto.student_id,
                  status: 'active',
                },
              },
            },
          },
          select: { starts_at: true, ends_at: true },
        });

        const hasConflict = classSchedules.some((candidate) =>
          studentSchedules.some(
            (existingSchedule) =>
              candidate.starts_at < existingSchedule.ends_at &&
              candidate.ends_at > existingSchedule.starts_at,
          ),
        );

        if (hasConflict) {
          throw new ConflictException('Học viên bị trùng lịch học');
        }
      }
    }

    if (existing) {
      const updated = await this.prisma.enrollments.update({
        where: { id: existing.id },
        data: {
          status: targetStatus,
          enrolled_at: new Date(),
        },
      });

      if (updated.status === 'active' && this.notificationsService) {
        await this.notificationsService.create({
          user_id: dto.student_id,
          type: 'class_enrolled',
          title: 'Bạn đã được enroll vào lớp',
          body: 'Bạn vừa được thêm vào một lớp học mới.',
          ref_type: 'class',
          ref_id: classId,
        });
      }

      return updated;
    }

    const created = await this.prisma.enrollments.create({
      data: {
        id: randomUUID(),
        class_id: classId,
        student_id: dto.student_id,
        status: targetStatus,
        enrolled_at: new Date(),
      },
    });

    if (created.status === 'active' && this.notificationsService) {
      await this.notificationsService.create({
        user_id: dto.student_id,
        type: 'class_enrolled',
        title: 'Bạn đã được enroll vào lớp',
        body: 'Bạn vừa được thêm vào một lớp học mới.',
        ref_type: 'class',
        ref_id: classId,
      });
    }

    // FR-ECM-020: Auto-create invoice when student enrolls with active status
    if (created.status === 'active' && this.invoicesService) {
      try {
        const coursePrice = await this.prisma.classes
          .findUnique({
            where: { id: classId },
            select: { courses: { select: { price: true } } },
          })
          .then((c) => c?.courses.price);

        if (coursePrice && Number(coursePrice) > 0) {
          await this.invoicesService.createInvoiceForEnrollment(
            created.id,
            coursePrice,
          );
        }
      } catch (error) {
        // Log but don't fail enrollment if invoice creation fails
        console.error('Failed to create invoice for enrollment:', error);
      }
    }

    return created;
  }

  async getClassTests(classId: string, actorId: string) {
    await this.ensureCanViewClass(classId, actorId);

    return this.prisma.exam_classes.findMany({
      where: { class_id: classId },
      include: {
        exams: {
          include: {
            _count: { select: { exam_questions: true, exam_sessions: true } },
          },
        },
      },
      orderBy: { assigned_at: 'desc' },
    });
  }

  async createClassTest(
    classId: string,
    dto: CreateClassTestDto,
    actorId: string,
  ) {
    await this.ensureCanManageClass(
      classId,
      actorId,
      'Giáo viên chỉ được tạo bài kiểm tra cho lớp của mình',
    );

    const selectedTemplate = dto.blueprint_template_id
      ? await this.getBlueprintTemplateOrThrow(dto.blueprint_template_id)
      : null;

    const templateSections = selectedTemplate
      ? this.toEffectiveBlueprintSections(selectedTemplate.exam_sections)
      : dto.blueprint_template
        ? await this.getBlueprintTemplateSections(dto.blueprint_template)
        : [];

    const effectiveBlueprintSections = dto.blueprint_sections?.length
      ? dto.blueprint_sections
      : templateSections;

    const scoringPolicy = {
      mode: (dto.scoring_mode ?? 'standard') as ScoringMode,
      negative_marking_ratio: dto.negative_marking_ratio ?? 0.25,
      difficulty_weights: dto.difficulty_weights ?? {
        easy: 1,
        medium: 1.2,
        hard: 1.5,
      },
    };

    const hasManualQuestions = !!dto.questions?.length;
    const hasBlueprint = !!effectiveBlueprintSections.length;
    if (!hasManualQuestions && !hasBlueprint) {
      throw new BadRequestException(
        'Bài kiểm tra phải có questions hoặc blueprint_sections',
      );
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const exam = await tx.exams.create({
        data: {
          id: randomUUID(),
          created_by: actorId,
          title: dto.title,
          description: dto.description,
          exam_type: dto.exam_type,
          subject: dto.subject,
          duration_minutes: dto.duration_minutes,
          max_attempts: dto.max_attempts ?? 1,
          shuffle_questions: dto.shuffle_questions ?? true,
          shuffle_options: dto.shuffle_options ?? true,
          show_result_after: dto.show_result_after ?? true,
          show_answer_after: dto.show_answer_after ?? false,
          available_from: dto.available_from
            ? new Date(dto.available_from)
            : null,
          available_until: dto.available_until
            ? new Date(dto.available_until)
            : null,
          template_id: selectedTemplate?.id,
          instructions: this.withExamMeta(dto.instructions, {
            blueprint_template_id: selectedTemplate?.id,
            blueprint_template: dto.blueprint_template,
            scoring_policy: scoringPolicy,
          }),
          created_at: new Date(),
        },
      });

      let orderCounter = 0;
      let totalScore = 0;

      const sectionConfigByType = new Map<string, string>();

      if (effectiveBlueprintSections.length) {
        const sortedBlueprintSections = [...effectiveBlueprintSections].sort(
          (a, b) => a.order_index - b.order_index,
        );

        for (const section of sortedBlueprintSections) {
          const sectionConfig = await tx.exam_section_configs.create({
            data: {
              id: randomUUID(),
              exam_id: exam.id,
              name: section.name,
              order_index: section.order_index,
              duration_minutes: section.duration_minutes,
              skill: section.skill,
              question_type: section.section_type,
              num_questions: section.num_questions,
              section_score:
                section.num_questions * (section.score_per_question ?? 1),
            },
          });

          if (section.section_type) {
            sectionConfigByType.set(
              section.section_type.toLowerCase(),
              sectionConfig.id,
            );
          }

          const where: Prisma.questionsWhereInput = {
            OR: [{ is_public: true }, { created_by: actorId }],
          };
          if (section.section_type) where.section_type = section.section_type;
          if (section.difficulty) where.difficulty = section.difficulty;

          const effectiveTags = section.exam_type_tags?.length
            ? section.exam_type_tags
            : dto.exam_type
              ? [dto.exam_type]
              : [];
          if (effectiveTags.length) {
            where.exam_type_tags = { hasSome: effectiveTags };
          }
          if (section.question_formats?.length) {
            where.question_format = { in: section.question_formats };
          }

          const bankQuestions = await tx.questions.findMany({
            where,
            select: { id: true },
          });
          const selected = this.pickRandom(
            bankQuestions,
            section.num_questions,
          );
          if (selected.length < section.num_questions) {
            throw new BadRequestException(
              `Không đủ câu hỏi trong bank cho section ${section.name}. Cần ${section.num_questions}, hiện có ${selected.length}`,
            );
          }

          const score = section.score_per_question ?? 1;
          const examQuestionRows = selected.map((q, idx) => ({
            id: randomUUID(),
            exam_id: exam.id,
            section_config_id: sectionConfig.id,
            question_id: q.id,
            order_index: orderCounter + idx,
            score,
          }));

          await tx.exam_questions.createMany({ data: examQuestionRows });
          orderCounter += examQuestionRows.length;
          totalScore += score * examQuestionRows.length;
        }
      }

      await tx.exam_classes.create({
        data: {
          id: randomUUID(),
          exam_id: exam.id,
          class_id: classId,
          assigned_at: new Date(),
          assigned_by: actorId,
        },
      });

      for (let i = 0; i < (dto.questions?.length ?? 0); i += 1) {
        const q = dto.questions![i];

        if (q.passage_id) {
          const passage = await tx.passages.findUnique({
            where: { id: q.passage_id },
            select: { id: true },
          });
          if (!passage) {
            throw new BadRequestException(
              `passage_id không tồn tại ở câu ${i + 1}`,
            );
          }
        }

        let sectionConfigId: string | undefined;
        const sectionTypeKey = q.section_type?.toLowerCase();
        if (sectionTypeKey && sectionConfigByType.has(sectionTypeKey)) {
          sectionConfigId = sectionConfigByType.get(sectionTypeKey);
        }

        if (!sectionConfigId) {
          const fallbackName = q.section_type ?? 'general';
          const fallback = await tx.exam_section_configs.create({
            data: {
              id: randomUUID(),
              exam_id: exam.id,
              name: fallbackName,
              order_index: 1000 + i,
              duration_minutes: null,
              question_type: q.question_format,
              num_questions: 1,
              section_score: q.score ?? 1,
            },
          });
          sectionConfigId = fallback.id;
          sectionConfigByType.set(fallbackName.toLowerCase(), fallback.id);
        }

        const question = await tx.questions.create({
          data: {
            id: randomUUID(),
            created_by: actorId,
            passage_id: q.passage_id,
            section_type: q.section_type,
            question_format: q.question_format,
            content: q.content,
            options: q.options as Prisma.InputJsonValue,
            correct_answer: q.correct_answer as Prisma.InputJsonValue,
            explanation: q.explanation,
            difficulty: q.difficulty,
            exam_type_tags:
              q.exam_type_tags ?? (dto.exam_type ? [dto.exam_type] : []),
            created_at: new Date(),
          },
        });

        await tx.exam_questions.create({
          data: {
            id: randomUUID(),
            exam_id: exam.id,
            section_config_id: sectionConfigId,
            question_id: question.id,
            order_index: q.order_index ?? orderCounter,
            score: q.score ?? 1,
          },
        });

        orderCounter += 1;
        totalScore += q.score ?? 1;
      }

      await tx.exams.update({
        where: { id: exam.id },
        data: { total_score: totalScore },
      });

      return exam;
    });

    const createdExam = await this.prisma.exams.findUnique({
      where: { id: created.id },
      include: {
        exam_classes: true,
        exam_section_configs: {
          orderBy: { order_index: 'asc' },
        },
        exam_questions: {
          include: {
            questions: true,
          },
          orderBy: { order_index: 'asc' },
        },
      },
    });

    if (createdExam && this.notificationsService) {
      const enrolled = await this.prisma.enrollments.findMany({
        where: { class_id: classId, status: 'active' },
        select: { student_id: true },
      });

      if (enrolled.length) {
        await this.notificationsService.createBulk(
          enrolled.map((it) => ({
            user_id: it.student_id,
            type: 'exam_created',
            title: 'Bài kiểm tra mới',
            body: `Lớp của bạn vừa có bài kiểm tra mới: ${createdExam.title}`,
            ref_type: 'exam',
            ref_id: createdExam.id,
          })),
        );
      }
    }

    return createdExam;
  }

  async getMyExamAttempts(classId: string, examId: string, studentId: string) {
    await this.ensureStudentEnrolledInClass(classId, studentId);
    await this.ensureExamInClass(classId, examId);

    return this.prisma.exam_sessions.findMany({
      where: { exam_id: examId, student_id: studentId },
      orderBy: { attempt_number: 'desc' },
    });
  }

  async startExamAttempt(
    classId: string,
    examId: string,
    studentId: string,
    dto: StartExamAttemptDto,
  ) {
    await this.ensureStudentEnrolledInClass(classId, studentId);

    const examClass = await this.prisma.exam_classes.findFirst({
      where: { class_id: classId, exam_id: examId },
      include: {
        exams: {
          include: {
            exam_section_configs: {
              orderBy: { order_index: 'asc' },
            },
            exam_questions: {
              include: {
                questions: true,
              },
              orderBy: { order_index: 'asc' },
            },
          },
        },
      },
    });

    if (!examClass) {
      throw new NotFoundException('Bài kiểm tra không thuộc lớp này');
    }

    const exam = examClass.exams;
    const now = new Date();
    if (exam.available_from && now < exam.available_from) {
      throw new BadRequestException('Bài kiểm tra chưa mở');
    }
    if (exam.available_until && now > exam.available_until) {
      throw new BadRequestException('Bài kiểm tra đã hết hạn');
    }

    const attempts = await this.prisma.exam_sessions.findMany({
      where: { exam_id: examId, student_id: studentId },
      orderBy: { attempt_number: 'desc' },
      select: {
        id: true,
        attempt_number: true,
        status: true,
        expires_at: true,
      },
    });

    const activeAttempt = attempts.find(
      (it) => it.status === 'in_progress' && it.expires_at > now,
    );
    if (activeAttempt) {
      return {
        message: 'Bạn đang có 1 attempt đang làm',
        session_id: activeAttempt.id,
        attempt_number: activeAttempt.attempt_number,
      };
    }

    const nextAttempt = (attempts[0]?.attempt_number ?? 0) + 1;
    const maxAttempts = exam.max_attempts ?? 1;
    if (nextAttempt > maxAttempts) {
      throw new ConflictException(
        `Đã vượt quá số lần làm bài (${maxAttempts})`,
      );
    }

    const durationMinutes = exam.duration_minutes;
    const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

    const session = await this.prisma.exam_sessions.create({
      data: {
        id: randomUUID(),
        exam_id: examId,
        student_id: studentId,
        attempt_number: nextAttempt,
        started_at: now,
        expires_at: expiresAt,
        status: 'in_progress',
        device_info: (dto.device_info ??
          (dto.device_info_text
            ? { text: dto.device_info_text }
            : undefined)) as Prisma.InputJsonValue,
      },
    });

    return {
      session,
      section_windows: this.buildSectionWindows(
        now,
        exam.duration_minutes,
        exam.exam_section_configs,
      ),
      exam: {
        id: exam.id,
        title: exam.title,
        duration_minutes: exam.duration_minutes,
        instructions: exam.instructions,
        sections: exam.exam_section_configs,
        questions: exam.exam_questions.map((eq) => ({
          exam_question_id: eq.id,
          question_id: eq.question_id,
          section_config_id: eq.section_config_id,
          order_index: eq.order_index,
          score: eq.score,
          question_format: eq.questions.question_format,
          section_type: eq.questions.section_type,
          content: eq.questions.content,
          options: eq.questions.options,
        })),
      },
    };
  }

  async upsertExamAnswers(
    classId: string,
    examId: string,
    sessionId: string,
    studentId: string,
    dto: UpsertExamAnswerDto,
  ) {
    await this.ensureStudentEnrolledInClass(classId, studentId);
    await this.ensureExamInClass(classId, examId);

    const session = await this.prisma.exam_sessions.findFirst({
      where: {
        id: sessionId,
        exam_id: examId,
        student_id: studentId,
      },
      select: { id: true, status: true, started_at: true, expires_at: true },
    });

    if (!session) {
      throw new NotFoundException('Không tìm thấy attempt');
    }
    if (session.status !== 'in_progress') {
      throw new BadRequestException('Attempt đã nộp, không thể sửa đáp án');
    }
    if (new Date() > session.expires_at) {
      throw new BadRequestException('Attempt đã hết thời gian làm bài');
    }

    const questionIds = dto.answers.map((it) => it.question_id);
    const examQuestions = await this.prisma.exam_questions.findMany({
      where: { exam_id: examId, question_id: { in: questionIds } },
      include: {
        exam_section_configs: {
          select: {
            id: true,
            name: true,
            order_index: true,
            duration_minutes: true,
          },
        },
      },
    });
    const validSet = new Set(examQuestions.map((it) => it.question_id));
    const invalid = questionIds.filter((id) => !validSet.has(id));
    if (invalid.length) {
      throw new BadRequestException(
        `Các question_id không thuộc bài thi: ${invalid.join(', ')}`,
      );
    }

    const allSections = await this.prisma.exam_section_configs.findMany({
      where: { exam_id: examId },
      orderBy: { order_index: 'asc' },
      select: {
        id: true,
        name: true,
        order_index: true,
        duration_minutes: true,
      },
    });

    const exam = await this.prisma.exams.findUnique({
      where: { id: examId },
      select: { duration_minutes: true },
    });

    const effectiveWindows = this.buildSectionWindows(
      session.started_at,
      exam?.duration_minutes ?? 0,
      allSections,
    );
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      for (const item of dto.answers) {
        const examQuestion = examQuestions.find(
          (q) => q.question_id === item.question_id,
        );
        if (!examQuestion) {
          throw new BadRequestException(
            `question_id không hợp lệ: ${item.question_id}`,
          );
        }

        const sectionId = examQuestion.section_config_id;
        const window = sectionId
          ? effectiveWindows.find((w) => w.section_id === sectionId)
          : undefined;
        if (window && now > window.ends_at) {
          throw new BadRequestException(
            `Đã quá thời gian section ${window.name}, không thể sửa đáp án`,
          );
        }

        const existing = await tx.exam_answers.findFirst({
          where: { session_id: sessionId, question_id: item.question_id },
          select: { id: true },
        });

        if (existing) {
          await tx.exam_answers.update({
            where: { id: existing.id },
            data: {
              answer: item.answer as Prisma.InputJsonValue,
              answered_at: new Date(),
            },
          });
        } else {
          await tx.exam_answers.create({
            data: {
              id: randomUUID(),
              session_id: sessionId,
              question_id: item.question_id,
              answer: item.answer as Prisma.InputJsonValue,
              answered_at: new Date(),
            },
          });
        }
      }
    });

    return {
      message: 'Lưu đáp án thành công',
      saved_count: dto.answers.length,
    };
  }

  async submitExamAttempt(
    classId: string,
    examId: string,
    sessionId: string,
    studentId: string,
    dto: SubmitExamAttemptDto,
  ) {
    await this.ensureStudentEnrolledInClass(classId, studentId);
    await this.ensureExamInClass(classId, examId);

    const session = await this.prisma.exam_sessions.findFirst({
      where: { id: sessionId, exam_id: examId, student_id: studentId },
      include: {
        exams: {
          select: { instructions: true },
        },
        exam_answers: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Không tìm thấy attempt');
    }
    if (session.status === 'submitted') {
      return this.getExamAttemptDetail(classId, examId, sessionId, studentId);
    }

    const examQuestions = await this.prisma.exam_questions.findMany({
      where: { exam_id: examId },
      include: {
        exam_section_configs: true,
        questions: true,
      },
      orderBy: { order_index: 'asc' },
    });

    const answerMap = new Map(
      session.exam_answers.map((it) => [it.question_id, it]),
    );
    const scoredAnswers: Array<{
      question_id: string;
      earned: number;
      max: number;
      section: string;
    }> = [];
    const examMeta = this.parseExamMeta(session.exams?.instructions);
    const policy = this.getScoringPolicy(examMeta?.scoring_policy);

    await this.prisma.$transaction(async (tx) => {
      for (const eq of examQuestions) {
        const answerRow = answerMap.get(eq.question_id);
        const maxScore = Number(eq.score ?? 1);

        const result = this.autoGradeQuestion({
          scoringPolicy: policy,
          format: eq.questions.question_format,
          difficulty: eq.questions.difficulty,
          correctAnswer: eq.questions.correct_answer,
          studentAnswer: answerRow?.answer,
          maxScore,
        });

        if (answerRow) {
          await tx.exam_answers.update({
            where: { id: answerRow.id },
            data: {
              is_correct: result.isCorrect,
              auto_score: result.score,
            },
          });
        }

        scoredAnswers.push({
          question_id: eq.question_id,
          earned: result.score,
          max: maxScore,
          section: eq.questions.section_type ?? 'general',
        });
      }

      const totalEarned = scoredAnswers.reduce((sum, it) => sum + it.earned, 0);
      const totalMax = scoredAnswers.reduce((sum, it) => sum + it.max, 0);
      const sectionScores = this.buildSectionScores(scoredAnswers);

      await tx.exam_sessions.update({
        where: { id: sessionId },
        data: {
          status: 'submitted',
          submitted_at: new Date(),
          auto_score: totalEarned,
          final_score: totalEarned,
          section_scores: sectionScores as Prisma.InputJsonValue,
          violation_log: dto.metadata as Prisma.InputJsonValue,
        },
      });

      const examTotalScore = totalMax > 0 ? totalMax : totalEarned;
      await tx.exams.update({
        where: { id: examId },
        data: { total_score: examTotalScore },
      });
    });

    await this.recomputeStudentGrade(classId, studentId);

    if (this.notificationsService) {
      await this.notificationsService.create({
        user_id: studentId,
        type: 'exam_submitted',
        title: 'Đã nộp bài thi',
        body: 'Bài thi của bạn đã được nộp và chấm tự động.',
        ref_type: 'exam_session',
        ref_id: sessionId,
      });
    }

    await this.notifyClassManagers(classId, {
      type: 'exam_submission_received',
      title: 'Có bài thi vừa nộp',
      body: 'Một học viên vừa nộp bài thi trong lớp của bạn.',
      ref_type: 'exam_session',
      ref_id: sessionId,
    });

    return this.getExamAttemptDetail(classId, examId, sessionId, studentId);
  }

  async getExamAttemptDetail(
    classId: string,
    examId: string,
    sessionId: string,
    actorId: string,
  ) {
    await this.ensureExamInClass(classId, examId);

    let actorCanManage = false;
    const session = await this.prisma.exam_sessions.findFirst({
      where: { id: sessionId, exam_id: examId },
      include: {
        exams: {
          select: {
            show_answer_after: true,
          },
        },
        exam_answers: {
          include: {
            questions: true,
          },
          orderBy: { answered_at: 'asc' },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Không tìm thấy attempt');
    }

    if (session.student_id !== actorId) {
      await this.ensureCanManageClass(
        classId,
        actorId,
        'Giáo viên chỉ xem attempt trong lớp của mình',
      );
      actorCanManage = true;
    }

    const canSeeAnswers =
      actorCanManage || session.exams?.show_answer_after === true;
    if (!canSeeAnswers) {
      session.exam_answers = session.exam_answers.map((answer) => ({
        ...answer,
        questions: {
          ...answer.questions,
          correct_answer: null,
          explanation: null,
        },
      }));
    }

    return session;
  }

  async unenrollStudent(classId: string, studentId: string) {
    const existing = await this.prisma.enrollments.findFirst({
      where: { class_id: classId, student_id: studentId },
      select: { id: true, status: true },
    });

    if (!existing) {
      throw new NotFoundException('Học viên chưa được enroll trong lớp này');
    }

    if (existing.status === 'inactive') {
      return { message: 'Học viên đã được unenroll trước đó' };
    }

    await this.prisma.enrollments.update({
      where: { id: existing.id },
      data: { status: 'inactive' },
    });

    if (this.notificationsService) {
      await this.notificationsService.create({
        user_id: studentId,
        type: 'class_unenrolled',
        title: 'Bạn đã bị gỡ khỏi lớp',
        body: 'Tình trạng enroll của bạn cho lớp học này đã chuyển sang inactive.',
        ref_type: 'class',
        ref_id: classId,
      });
    }

    return { message: 'Unenroll học viên thành công' };
  }

  async deleteClass(classId: string) {
    const existing = await this.prisma.classes.findUnique({
      where: { id: classId },
      select: { id: true, name: true, teacher_id: true },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy lớp học');
    }

    await this.notifyClassStudents(classId, {
      type: 'class_deleted',
      title: 'Lớp học đã đóng',
      body: `Lớp ${existing.name ?? ''} đã được đóng.`.trim(),
      ref_type: 'class',
      ref_id: classId,
    });

    if (existing.teacher_id && this.notificationsService) {
      await this.notificationsService.create({
        user_id: existing.teacher_id,
        type: 'class_deleted',
        title: 'Lớp học đã bị xóa',
        body: `Lớp ${existing.name ?? ''} đã bị xóa khỏi hệ thống.`.trim(),
        ref_type: 'class',
        ref_id: classId,
      });
    }

    await this.prisma.classes.delete({ where: { id: classId } });
    return { message: 'Xóa lớp học thành công' };
  }

  async getMyClasses(userId: string) {
    const [teachingClasses, enrolledClasses] = await Promise.all([
      this.prisma.classes.findMany({
        where: { teacher_id: userId },
        orderBy: { created_at: 'desc' },
        include: {
          courses: {
            select: {
              id: true,
              name: true,
              description: true,
              level: true,
              total_sessions: true,
              price: true,
              is_active: true,
              created_at: true,
            },
          },
          _count: {
            select: { enrollments: true },
          },
        },
      }),
      this.prisma.enrollments.findMany({
        where: { student_id: userId },
        orderBy: { enrolled_at: 'desc' },
        include: {
          classes: {
            include: {
              courses: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  level: true,
                  total_sessions: true,
                  price: true,
                  is_active: true,
                  created_at: true,
                },
              },
              users: {
                select: {
                  id: true,
                  full_name: true,
                  email: true,
                },
              },
              _count: {
                select: {
                  enrollments: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      teaching_classes: teachingClasses,
      enrolled_classes: enrolledClasses.map((it) => it.classes),
    };
  }

  async getBlueprintTemplates(includeInactive = false) {
    const templates = await this.prisma.exam_templates.findMany({
      where: includeInactive ? undefined : { is_active: true },
      include: {
        exam_sections: {
          orderBy: { order_index: 'asc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return templates.map((template) => ({
      ...template,
      exam_sections: template.exam_sections.map((section) =>
        this.mapBlueprintSectionWithMeta(section),
      ),
    }));
  }

  async getBlueprintTemplateById(templateId: string) {
    const template = await this.prisma.exam_templates.findUnique({
      where: { id: templateId },
      include: {
        exam_sections: {
          orderBy: { order_index: 'asc' },
        },
      },
    });

    if (!template) {
      throw new NotFoundException('Không tìm thấy blueprint template');
    }

    return {
      ...template,
      exam_sections: template.exam_sections.map((section) =>
        this.mapBlueprintSectionWithMeta(section),
      ),
    };
  }

  async createBlueprintTemplate(
    dto: CreateBlueprintTemplateDto,
    actorId: string,
  ) {
    const sectionTotalDuration = (dto.sections ?? []).reduce(
      (sum, s) => sum + (s.duration_minutes ?? 0),
      0,
    );
    if (
      dto.sections?.length &&
      sectionTotalDuration > dto.total_duration_minutes
    ) {
      throw new BadRequestException(
        'Tổng duration của sections không được vượt total_duration_minutes',
      );
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const template = await tx.exam_templates.create({
        data: {
          id: randomUUID(),
          name: dto.name,
          exam_type: dto.exam_type,
          subject: dto.subject,
          province: dto.province,
          total_duration_minutes: dto.total_duration_minutes,
          total_score: dto.total_score,
          passing_score: dto.passing_score,
          description: dto.description,
          instructions: dto.instructions,
          is_active: dto.is_active ?? true,
          created_by: actorId,
          created_at: new Date(),
        },
      });

      for (const section of dto.sections ?? []) {
        await tx.exam_sections.create({
          data: {
            id: randomUUID(),
            template_id: template.id,
            name: section.name,
            order_index: section.order_index,
            duration_minutes: section.duration_minutes,
            num_questions: section.num_questions,
            section_score: section.section_score,
            question_type: section.question_type,
            skill: section.skill,
            instructions: this.withBlueprintSectionMeta(
              section.instructions,
              section,
            ),
          },
        });
      }

      return template;
    });

    return this.getBlueprintTemplateById(created.id);
  }

  async updateBlueprintTemplate(
    templateId: string,
    dto: UpdateBlueprintTemplateDto,
  ) {
    const existing = await this.prisma.exam_templates.findUnique({
      where: { id: templateId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy blueprint template');
    }

    await this.prisma.exam_templates.update({
      where: { id: templateId },
      data: {
        name: dto.name,
        exam_type: dto.exam_type,
        subject: dto.subject,
        province: dto.province,
        total_duration_minutes: dto.total_duration_minutes,
        total_score: dto.total_score,
        passing_score: dto.passing_score,
        description: dto.description,
        instructions: dto.instructions,
        is_active: dto.is_active,
      },
    });

    return this.getBlueprintTemplateById(templateId);
  }

  async deleteBlueprintTemplate(templateId: string) {
    const existing = await this.prisma.exam_templates.findUnique({
      where: { id: templateId },
      select: { id: true, is_active: true },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy blueprint template');
    }

    if (existing.is_active === false) {
      return { message: 'Blueprint template đã được tắt trước đó' };
    }

    await this.prisma.exam_templates.update({
      where: { id: templateId },
      data: { is_active: false },
    });

    return { message: 'Đã tắt blueprint template thành công' };
  }

  async createBlueprintSection(
    templateId: string,
    dto: CreateBlueprintSectionDto,
  ) {
    await this.ensureBlueprintTemplateExists(templateId);

    const created = await this.prisma.exam_sections.create({
      data: {
        id: randomUUID(),
        template_id: templateId,
        name: dto.name,
        order_index: dto.order_index,
        duration_minutes: dto.duration_minutes,
        num_questions: dto.num_questions,
        section_score: dto.section_score,
        question_type: dto.question_type,
        skill: dto.skill,
        instructions: this.withBlueprintSectionMeta(dto.instructions, dto),
      },
    });

    return this.mapBlueprintSectionWithMeta(created);
  }

  async updateBlueprintSection(
    templateId: string,
    sectionId: string,
    dto: UpdateBlueprintSectionDto,
  ) {
    const section = await this.prisma.exam_sections.findFirst({
      where: { id: sectionId, template_id: templateId },
    });

    if (!section) {
      throw new NotFoundException(
        'Không tìm thấy section của blueprint template',
      );
    }

    const sectionMeta = this.parseBlueprintSectionMeta(section.instructions);
    const updated = await this.prisma.exam_sections.update({
      where: { id: sectionId },
      data: {
        name: dto.name,
        order_index: dto.order_index,
        duration_minutes: dto.duration_minutes,
        num_questions: dto.num_questions,
        section_score: dto.section_score,
        question_type: dto.question_type,
        skill: dto.skill,
        instructions: this.withBlueprintSectionMeta(
          dto.instructions ?? section.instructions ?? undefined,
          {
            difficulty: dto.difficulty ?? sectionMeta?.difficulty,
            question_formats:
              dto.question_formats ?? sectionMeta?.question_formats,
            exam_type_tags: dto.exam_type_tags ?? sectionMeta?.exam_type_tags,
          },
        ),
      },
    });

    return this.mapBlueprintSectionWithMeta(updated);
  }

  async deleteBlueprintSection(templateId: string, sectionId: string) {
    const section = await this.prisma.exam_sections.findFirst({
      where: { id: sectionId, template_id: templateId },
      select: { id: true },
    });

    if (!section) {
      throw new NotFoundException(
        'Không tìm thấy section của blueprint template',
      );
    }

    await this.prisma.exam_sections.delete({ where: { id: sectionId } });
    return { message: 'Xóa section thành công' };
  }

  private async ensureCanManageClass(
    classId: string,
    actorId: string,
    teacherMessage: string,
  ) {
    const existing = await this.prisma.classes.findUnique({
      where: { id: classId },
      select: { id: true, teacher_id: true },
    });

    if (!existing) {
      throw new NotFoundException('Không tìm thấy lớp học');
    }

    const actorRoles = await this.prisma.user_roles.findMany({
      where: { user_id: actorId },
      include: { roles: true },
    });
    const normalizedRoles = actorRoles
      .map((it) => it.roles?.name?.toLowerCase())
      .filter((it): it is string => !!it);

    const isAdmin = normalizedRoles.includes('admin');
    const isTeacher = normalizedRoles.includes('teacher');

    if (!isAdmin && !isTeacher) {
      throw new ForbiddenException('Bạn không có quyền quản lý lớp học');
    }

    if (!isAdmin && isTeacher && existing.teacher_id !== actorId) {
      throw new ForbiddenException(teacherMessage);
    }
  }

  private async ensureCanViewClass(classId: string, actorId: string) {
    const classItem = await this.prisma.classes.findUnique({
      where: { id: classId },
      select: { id: true, teacher_id: true },
    });

    if (!classItem) {
      throw new NotFoundException('Không tìm thấy lớp học');
    }

    const isAdmin = await this.hasRole(actorId, 'admin');
    if (isAdmin) {
      return;
    }

    const isTeacher = await this.hasRole(actorId, 'teacher');
    if (isTeacher && classItem.teacher_id === actorId) {
      return;
    }

    const enrolled = await this.prisma.enrollments.findFirst({
      where: {
        class_id: classId,
        student_id: actorId,
        status: 'active',
      },
      select: { id: true },
    });

    if (enrolled) {
      return;
    }

    throw new ForbiddenException('Bạn không có quyền truy cập lớp học này');
  }

  private async hasRole(userId: string, roleName: string) {
    const role = await this.prisma.user_roles.findFirst({
      where: {
        user_id: userId,
        roles: {
          name: {
            equals: roleName,
            mode: 'insensitive',
          },
        },
      },
      select: { id: true },
    });

    return !!role;
  }

  private async ensureRole(userId: string, roles: string[]) {
    const checks = await Promise.all(
      roles.map((role) => this.hasRole(userId, role)),
    );
    if (!checks.some(Boolean)) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập tài nguyên này',
      );
    }
  }

  private async ensureClassExists(classId: string) {
    const existing = await this.prisma.classes.findUnique({
      where: { id: classId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy lớp học');
    }
  }

  private async ensureStudentEnrolledInClass(
    classId: string,
    studentId: string,
  ) {
    const enrollment = await this.prisma.enrollments.findFirst({
      where: { class_id: classId, student_id: studentId, status: 'active' },
      select: { id: true },
    });
    if (!enrollment) {
      throw new ForbiddenException('Bạn chưa được enroll vào lớp này');
    }
  }

  private async ensureExamInClass(classId: string, examId: string) {
    const examClass = await this.prisma.exam_classes.findFirst({
      where: { class_id: classId, exam_id: examId },
      select: { id: true },
    });
    if (!examClass) {
      throw new NotFoundException('Bài kiểm tra không thuộc lớp này');
    }
  }

  private autoGradeQuestion(params: {
    scoringPolicy: {
      mode: ScoringMode;
      negative_marking_ratio: number;
      difficulty_weights: Record<string, number>;
    };
    format?: string | null;
    difficulty?: string | null;
    correctAnswer: unknown;
    studentAnswer: unknown;
    maxScore: number;
  }): { isCorrect: boolean | null; score: number } {
    const format = (params.format ?? '').toLowerCase();
    const maxScore = params.maxScore;
    const weightedMax = this.applyDifficultyWeight(
      maxScore,
      params.difficulty,
      params.scoringPolicy,
    );

    if (params.correctAnswer === null || params.correctAnswer === undefined) {
      return { isCorrect: null, score: 0 };
    }

    const isExactMatch = (a: string, b: string) =>
      this.normalizeText(a) === this.normalizeText(b);
    const isOneWord = (text: string) => this.wordCount(text) <= 1;
    const isTwoWords = (text: string) => this.wordCount(text) <= 2;

    const studentScalar = this.extractScalarAnswer(params.studentAnswer);
    const correctScalar = this.extractScalarAnswer(params.correctAnswer);

    const compareScalar = () => {
      if (!studentScalar || !correctScalar) return false;
      return isExactMatch(studentScalar, correctScalar);
    };

    if (['mcq', 'single_choice', 'multiple_choice'].includes(format)) {
      const ok = compareScalar();
      return this.scoreByPolicy(ok, weightedMax, params.scoringPolicy);
    }

    if (format === 'multi_select') {
      const studentArray = this.extractArrayAnswer(params.studentAnswer);
      const correctArray = this.extractArrayAnswer(params.correctAnswer);
      const ok = this.compareStringArrays(studentArray, correctArray);
      return this.scoreByPolicy(ok, weightedMax, params.scoringPolicy);
    }

    if (['tfng', 'true_false', 'yes_no_not_given'].includes(format)) {
      const ok = compareScalar();
      return this.scoreByPolicy(ok, weightedMax, params.scoringPolicy);
    }

    if (format === 'one_word_only') {
      if (!studentScalar || !correctScalar)
        return { isCorrect: false, score: 0 };
      const ok =
        isOneWord(studentScalar) && isExactMatch(studentScalar, correctScalar);
      return this.scoreByPolicy(ok, weightedMax, params.scoringPolicy);
    }

    if (format === 'two_words_only') {
      if (!studentScalar || !correctScalar)
        return { isCorrect: false, score: 0 };
      const ok =
        isTwoWords(studentScalar) && isExactMatch(studentScalar, correctScalar);
      return this.scoreByPolicy(ok, weightedMax, params.scoringPolicy);
    }

    if (format === 'number_only') {
      const normalizeNumber = (v: string) =>
        this.normalizeText(v).replace(/,/g, '');
      const ok =
        !!studentScalar &&
        !!correctScalar &&
        normalizeNumber(studentScalar) === normalizeNumber(correctScalar);
      return this.scoreByPolicy(ok, weightedMax, params.scoringPolicy);
    }

    if (
      [
        'matching_heading',
        'matching_information',
        'matching_features',
        'matching_sentence_endings',
      ].includes(format)
    ) {
      const studentMap = this.extractObjectAnswer(params.studentAnswer);
      const correctMap = this.extractObjectAnswer(params.correctAnswer);
      const ratio = this.computeObjectMatchRatio(studentMap, correctMap);
      let score = Number((weightedMax * ratio).toFixed(2));
      if (params.scoringPolicy.mode === 'negative' && ratio < 1) {
        const penalty = Number(
          (
            weightedMax *
            (1 - ratio) *
            params.scoringPolicy.negative_marking_ratio
          ).toFixed(2),
        );
        score = Number((score - penalty).toFixed(2));
      }
      return { isCorrect: ratio === 1, score };
    }

    if (
      [
        'sentence_completion',
        'summary_completion',
        'note_completion',
        'table_completion',
        'flow_chart_completion',
        'diagram_label_completion',
        'short_answer',
      ].includes(format)
    ) {
      const studentMap = this.extractObjectAnswer(params.studentAnswer);
      const correctMap = this.extractObjectAnswer(params.correctAnswer);

      if (Object.keys(correctMap).length > 0) {
        const ratio = this.computeObjectMatchRatio(studentMap, correctMap);
        let score = Number((weightedMax * ratio).toFixed(2));
        if (params.scoringPolicy.mode === 'negative' && ratio < 1) {
          const penalty = Number(
            (
              weightedMax *
              (1 - ratio) *
              params.scoringPolicy.negative_marking_ratio
            ).toFixed(2),
          );
          score = Number((score - penalty).toFixed(2));
        }
        return { isCorrect: ratio === 1, score };
      }

      const candidateAnswers = this.extractArrayAnswer(params.correctAnswer);
      if (candidateAnswers.length > 1) {
        const matched = candidateAnswers.some(
          (ans) => !!studentScalar && isExactMatch(studentScalar, ans),
        );
        return this.scoreByPolicy(matched, weightedMax, params.scoringPolicy);
      }

      const ok = compareScalar();
      return this.scoreByPolicy(ok, weightedMax, params.scoringPolicy);
    }

    const fallbackOk = compareScalar();
    return this.scoreByPolicy(fallbackOk, weightedMax, params.scoringPolicy);
  }

  private buildSectionScores(
    items: Array<{ section: string; earned: number; max: number }>,
  ) {
    const result: Record<
      string,
      { earned: number; max: number; percentage: number }
    > = {};
    for (const item of items) {
      if (!result[item.section]) {
        result[item.section] = { earned: 0, max: 0, percentage: 0 };
      }
      result[item.section].earned += item.earned;
      result[item.section].max += item.max;
    }

    for (const key of Object.keys(result)) {
      const section = result[key];
      section.percentage =
        section.max > 0
          ? Number(((section.earned / section.max) * 100).toFixed(2))
          : 0;
    }

    return result;
  }

  private async getBlueprintTemplateSections(
    template: string,
  ): Promise<EffectiveBlueprintSection[]> {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        template,
      );

    const aliasMap: Record<string, string> = {
      ielts_reading: 'IELTS Reading Blueprint',
      ielts_listening: 'IELTS Listening Blueprint',
      thptqg_english: 'THPTQG English Blueprint',
      grade10_entrance_english: 'Grade 10 Entrance English Blueprint',
    };

    const dbTemplate = await this.prisma.exam_templates.findFirst({
      where: isUuid
        ? { id: template, is_active: true }
        : {
            is_active: true,
            OR: [
              { name: aliasMap[template] ?? template },
              { description: { contains: template, mode: 'insensitive' } },
            ],
          },
      include: {
        exam_sections: {
          orderBy: { order_index: 'asc' },
        },
      },
    });

    if (dbTemplate?.exam_sections?.length) {
      return this.toEffectiveBlueprintSections(dbTemplate.exam_sections);
    }

    return this.getLegacyBlueprintTemplateSections(template);
  }

  private getLegacyBlueprintTemplateSections(template: string) {
    const templates: Record<
      string,
      Array<{
        name: string;
        order_index: number;
        duration_minutes: number;
        num_questions: number;
        score_per_question: number;
        section_type: string;
        skill: string;
        difficulty?: string;
        question_formats?: string[];
        exam_type_tags?: string[];
      }>
    > = {
      ielts_reading: [
        {
          name: 'IELTS Reading Passage 1',
          order_index: 1,
          duration_minutes: 20,
          num_questions: 13,
          score_per_question: 1,
          section_type: 'reading_p1',
          skill: 'reading',
          question_formats: ['matching_heading', 'tfng', 'sentence_completion'],
          exam_type_tags: ['ielts', 'reading'],
        },
        {
          name: 'IELTS Reading Passage 2',
          order_index: 2,
          duration_minutes: 20,
          num_questions: 13,
          score_per_question: 1,
          section_type: 'reading_p2',
          skill: 'reading',
          question_formats: [
            'matching_information',
            'summary_completion',
            'short_answer',
          ],
          exam_type_tags: ['ielts', 'reading'],
        },
        {
          name: 'IELTS Reading Passage 3',
          order_index: 3,
          duration_minutes: 20,
          num_questions: 14,
          score_per_question: 1,
          section_type: 'reading_p3',
          skill: 'reading',
          question_formats: [
            'matching_features',
            'yes_no_not_given',
            'table_completion',
          ],
          exam_type_tags: ['ielts', 'reading'],
        },
      ],
      ielts_listening: [
        {
          name: 'IELTS Listening Part 1',
          order_index: 1,
          duration_minutes: 8,
          num_questions: 10,
          score_per_question: 1,
          section_type: 'listening_p1',
          skill: 'listening',
          question_formats: ['one_word_only', 'two_words_only', 'number_only'],
          exam_type_tags: ['ielts', 'listening'],
        },
        {
          name: 'IELTS Listening Part 2',
          order_index: 2,
          duration_minutes: 8,
          num_questions: 10,
          score_per_question: 1,
          section_type: 'listening_p2',
          skill: 'listening',
          question_formats: ['mcq', 'matching_information'],
          exam_type_tags: ['ielts', 'listening'],
        },
        {
          name: 'IELTS Listening Part 3',
          order_index: 3,
          duration_minutes: 8,
          num_questions: 10,
          score_per_question: 1,
          section_type: 'listening_p3',
          skill: 'listening',
          question_formats: ['mcq', 'matching_heading', 'note_completion'],
          exam_type_tags: ['ielts', 'listening'],
        },
        {
          name: 'IELTS Listening Part 4',
          order_index: 4,
          duration_minutes: 8,
          num_questions: 10,
          score_per_question: 1,
          section_type: 'listening_p4',
          skill: 'listening',
          question_formats: ['summary_completion', 'diagram_label_completion'],
          exam_type_tags: ['ielts', 'listening'],
        },
      ],
      thptqg_english: [
        {
          name: 'THPTQG Ngữ Âm - Từ Vựng',
          order_index: 1,
          duration_minutes: 15,
          num_questions: 12,
          score_per_question: 0.2,
          section_type: 'thpt_vocab',
          skill: 'vocabulary',
          difficulty: 'easy',
          question_formats: ['mcq', 'single_choice'],
          exam_type_tags: ['thptqg', 'english'],
        },
        {
          name: 'THPTQG Ngữ Pháp',
          order_index: 2,
          duration_minutes: 20,
          num_questions: 18,
          score_per_question: 0.2,
          section_type: 'thpt_grammar',
          skill: 'grammar',
          difficulty: 'medium',
          question_formats: ['mcq', 'single_choice'],
          exam_type_tags: ['thptqg', 'english'],
        },
        {
          name: 'THPTQG Reading',
          order_index: 3,
          duration_minutes: 25,
          num_questions: 20,
          score_per_question: 0.2,
          section_type: 'thpt_reading',
          skill: 'reading',
          difficulty: 'hard',
          question_formats: [
            'mcq',
            'matching_information',
            'sentence_completion',
          ],
          exam_type_tags: ['thptqg', 'english'],
        },
      ],
      grade10_entrance_english: [
        {
          name: '10 Entrance Vocabulary + Grammar',
          order_index: 1,
          duration_minutes: 20,
          num_questions: 20,
          score_per_question: 0.25,
          section_type: 'grade10_grammar',
          skill: 'grammar',
          question_formats: ['mcq', 'single_choice'],
          exam_type_tags: ['grade10', 'entrance', 'english'],
        },
        {
          name: '10 Entrance Reading',
          order_index: 2,
          duration_minutes: 25,
          num_questions: 20,
          score_per_question: 0.25,
          section_type: 'grade10_reading',
          skill: 'reading',
          question_formats: ['mcq', 'matching_heading', 'short_answer'],
          exam_type_tags: ['grade10', 'entrance', 'english'],
        },
      ],
    };

    return templates[template] ?? [];
  }

  private toEffectiveBlueprintSections(
    sections: Array<{
      id: string;
      name: string;
      order_index: number;
      duration_minutes: number | null;
      num_questions: number | null;
      section_score: Prisma.Decimal | null;
      question_type: string | null;
      skill: string | null;
      instructions: string | null;
    }>,
  ): EffectiveBlueprintSection[] {
    return sections.map((section) => {
      const meta = this.parseBlueprintSectionMeta(section.instructions);
      const numQuestions = section.num_questions ?? 1;
      const sectionScore = Number(section.section_score ?? 0);

      return {
        name: section.name,
        order_index: section.order_index,
        duration_minutes: section.duration_minutes ?? 1,
        num_questions: numQuestions,
        score_per_question:
          numQuestions > 0 && sectionScore > 0
            ? Number((sectionScore / numQuestions).toFixed(2))
            : 1,
        section_type: section.question_type ?? undefined,
        skill: section.skill ?? undefined,
        difficulty: meta?.difficulty,
        question_formats: meta?.question_formats,
        exam_type_tags: meta?.exam_type_tags,
      };
    });
  }

  private mapBlueprintSectionWithMeta(section: {
    id: string;
    template_id: string;
    name: string;
    order_index: number;
    duration_minutes: number | null;
    num_questions: number | null;
    section_score: Prisma.Decimal | null;
    question_type: string | null;
    skill: string | null;
    instructions: string | null;
  }) {
    const meta = this.parseBlueprintSectionMeta(section.instructions);
    return {
      ...section,
      instructions: this.stripBlueprintSectionMeta(section.instructions),
      difficulty: meta?.difficulty,
      question_formats: meta?.question_formats ?? [],
      exam_type_tags: meta?.exam_type_tags ?? [],
    };
  }

  private withBlueprintSectionMeta(
    instructions: string | undefined,
    metaSource: {
      difficulty?: string;
      question_formats?: string[];
      exam_type_tags?: string[];
    },
  ) {
    const clean = this.stripBlueprintSectionMeta(instructions);
    const meta = {
      difficulty: metaSource.difficulty,
      question_formats: metaSource.question_formats,
      exam_type_tags: metaSource.exam_type_tags,
    };

    const hasMeta = Object.values(meta).some((v) =>
      Array.isArray(v) ? v.length > 0 : !!v,
    );
    if (!hasMeta) {
      return clean ?? null;
    }

    return `${clean ?? ''}\n${BLUEPRINT_SECTION_META_MARKER}${JSON.stringify(meta)}`.trim();
  }

  private parseBlueprintSectionMeta(
    instructions: string | null | undefined,
  ): BlueprintSectionMeta | null {
    if (!instructions) {
      return null;
    }

    const markerIndex = instructions.indexOf(BLUEPRINT_SECTION_META_MARKER);
    if (markerIndex < 0) {
      return null;
    }

    const raw = instructions
      .slice(markerIndex + BLUEPRINT_SECTION_META_MARKER.length)
      .trim();
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private stripBlueprintSectionMeta(instructions: string | null | undefined) {
    if (!instructions) {
      return '';
    }

    return instructions.replace(/\n?\[ECMS_BP_META\].*$/s, '').trim();
  }

  private async ensureBlueprintTemplateExists(templateId: string) {
    const existing = await this.prisma.exam_templates.findUnique({
      where: { id: templateId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy blueprint template');
    }
  }

  private async getBlueprintTemplateOrThrow(templateId: string) {
    const template = await this.prisma.exam_templates.findFirst({
      where: { id: templateId, is_active: true },
      include: {
        exam_sections: {
          orderBy: { order_index: 'asc' },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(
        'Blueprint template không tồn tại hoặc đã bị tắt',
      );
    }

    if (!template.exam_sections.length) {
      throw new BadRequestException('Blueprint template chưa có section nào');
    }

    return template;
  }

  private withExamMeta(
    instructions: string | undefined,
    meta: Record<string, unknown>,
  ) {
    const clean = instructions?.replace(/\n?\[ECMS_META\].*$/s, '').trim();
    const metaJson = JSON.stringify(meta);
    return `${clean ?? ''}\n${EXAM_META_MARKER}${metaJson}`.trim();
  }

  private parseExamMeta(
    instructions: string | null | undefined,
  ): ExamMeta | null {
    if (!instructions) {
      return null;
    }

    const markerIndex = instructions.indexOf(EXAM_META_MARKER);
    if (markerIndex < 0) {
      return null;
    }

    const json = instructions
      .slice(markerIndex + EXAM_META_MARKER.length)
      .trim();
    if (!json) {
      return null;
    }

    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  private getScoringPolicy(
    input:
      | {
          mode?: string;
          negative_marking_ratio?: number;
          difficulty_weights?: Record<string, number>;
        }
      | undefined,
  ): {
    mode: ScoringMode;
    negative_marking_ratio: number;
    difficulty_weights: Record<string, number>;
  } {
    const mode = (input?.mode ?? 'standard') as ScoringMode;
    return {
      mode,
      negative_marking_ratio: Number(input?.negative_marking_ratio ?? 0.25),
      difficulty_weights: input?.difficulty_weights ?? {
        easy: 1,
        medium: 1.2,
        hard: 1.5,
      },
    };
  }

  private applyDifficultyWeight(
    baseScore: number,
    difficulty: string | null | undefined,
    policy: { mode: ScoringMode; difficulty_weights: Record<string, number> },
  ) {
    if (policy.mode !== 'weighted') {
      return baseScore;
    }

    const key = (difficulty ?? '').toLowerCase();
    const factor = Number(policy.difficulty_weights?.[key] ?? 1);
    return Number((baseScore * factor).toFixed(2));
  }

  private scoreByPolicy(
    isCorrect: boolean,
    positiveScore: number,
    policy: { mode: ScoringMode; negative_marking_ratio: number },
  ) {
    if (isCorrect) {
      return { isCorrect: true, score: positiveScore };
    }

    if (policy.mode === 'negative') {
      const negative = Number(
        (positiveScore * policy.negative_marking_ratio).toFixed(2),
      );
      return { isCorrect: false, score: -negative };
    }

    return { isCorrect: false, score: 0 };
  }

  private normalizeText(value: string) {
    return value.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  private wordCount(value: string) {
    return this.normalizeText(value).split(' ').filter(Boolean).length;
  }

  private extractScalarAnswer(value: unknown): string | null {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return String(value);
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const record = value as Record<string, unknown>;
      if (record.answer !== undefined && record.answer !== null) {
        return String(record.answer);
      }
    }

    return null;
  }

  private extractArrayAnswer(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.map((it) => String(it));
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const record = value as Record<string, unknown>;
      if (Array.isArray(record.answers)) {
        return record.answers.map((it) => String(it));
      }
    }

    const scalar = this.extractScalarAnswer(value);
    return scalar ? [scalar] : [];
  }

  private extractObjectAnswer(value: unknown): Record<string, string> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    const raw = value as Record<string, unknown>;
    const result: Record<string, string> = {};
    for (const [key, val] of Object.entries(raw)) {
      if (val !== undefined && val !== null) {
        result[key] = String(val);
      }
    }

    return result;
  }

  private compareStringArrays(a: string[], b: string[]) {
    const normalize = (arr: string[]) =>
      arr.map((it) => this.normalizeText(it)).sort();
    const aa = normalize(a);
    const bb = normalize(b);
    if (aa.length !== bb.length) return false;
    return aa.every((v, i) => v === bb[i]);
  }

  private compareObjectAnswers(
    a: Record<string, string>,
    b: Record<string, string>,
  ) {
    const aKeys = Object.keys(a).sort();
    const bKeys = Object.keys(b).sort();
    if (aKeys.length !== bKeys.length) return false;
    if (!aKeys.every((key, idx) => key === bKeys[idx])) return false;

    return aKeys.every(
      (key) => this.normalizeText(a[key]) === this.normalizeText(b[key]),
    );
  }

  private computeObjectMatchRatio(
    a: Record<string, string>,
    b: Record<string, string>,
  ) {
    const expectedKeys = Object.keys(b);
    if (!expectedKeys.length) {
      return 0;
    }

    let matched = 0;
    for (const key of expectedKeys) {
      const aVal = a[key];
      const bVal = b[key];
      if (
        aVal !== undefined &&
        this.normalizeText(aVal) === this.normalizeText(bVal)
      ) {
        matched += 1;
      }
    }

    return matched / expectedKeys.length;
  }

  private pickRandom<T>(items: T[], count: number) {
    if (count <= 0 || !items.length) {
      return [];
    }

    const cloned = [...items];
    for (let i = cloned.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
    }

    return cloned.slice(0, count);
  }

  private buildSectionWindows(
    startedAt: Date,
    examDurationMinutes: number,
    sections: Array<{
      id: string;
      name: string;
      order_index: number;
      duration_minutes: number | null;
    }>,
  ) {
    if (!sections.length) {
      const fallbackEnd = new Date(
        startedAt.getTime() + examDurationMinutes * 60 * 1000,
      );
      return [
        {
          section_id: 'general',
          name: 'general',
          starts_at: startedAt,
          ends_at: fallbackEnd,
        },
      ];
    }

    const sorted = [...sections].sort((a, b) => a.order_index - b.order_index);
    const totalDefined = sorted.reduce(
      (sum, it) => sum + (it.duration_minutes ?? 0),
      0,
    );
    const fallbackPerSection =
      sorted.length && examDurationMinutes > totalDefined
        ? Math.floor((examDurationMinutes - totalDefined) / sorted.length)
        : 0;

    const windows: Array<{
      section_id: string;
      name: string;
      starts_at: Date;
      ends_at: Date;
    }> = [];
    let cursor = startedAt.getTime();

    for (const section of sorted) {
      const duration = section.duration_minutes ?? fallbackPerSection;
      const starts_at = new Date(cursor);
      cursor += duration * 60 * 1000;
      const ends_at = new Date(cursor);
      windows.push({
        section_id: section.id,
        name: section.name,
        starts_at,
        ends_at,
      });
    }

    return windows;
  }

  private async recomputeStudentGrade(classId: string, studentId: string) {
    const [assignmentRows, examRows, attendanceRows] = await Promise.all([
      this.prisma.submissions.findMany({
        where: {
          student_id: studentId,
          assignments: { class_id: classId },
          score: { not: null },
        },
        select: { score: true },
      }),
      this.prisma.exam_sessions.findMany({
        where: {
          student_id: studentId,
          status: 'submitted',
          exams: {
            exam_classes: {
              some: { class_id: classId },
            },
          },
        },
        select: { final_score: true },
      }),
      this.prisma.attendances.findMany({
        where: {
          student_id: studentId,
          class_schedules: { class_id: classId },
        },
        select: { status: true },
      }),
    ]);

    const assignmentAvg = assignmentRows.length
      ? assignmentRows.reduce((sum, row) => sum + Number(row.score ?? 0), 0) /
        assignmentRows.length
      : null;

    const examAvg = examRows.length
      ? examRows.reduce((sum, row) => sum + Number(row.final_score ?? 0), 0) /
        examRows.length
      : null;

    const presentCount = attendanceRows.filter(
      (it) => (it.status ?? '').toLowerCase() === 'present',
    ).length;
    const attendanceRate = attendanceRows.length
      ? (presentCount * 100) / attendanceRows.length
      : null;

    const scoreParts = [assignmentAvg, examAvg, attendanceRate].filter(
      (it): it is number => it !== null,
    );
    const finalScore = scoreParts.length
      ? scoreParts.reduce((s, v) => s + v, 0) / scoreParts.length
      : null;

    const existing = await this.prisma.grades.findFirst({
      where: { class_id: classId, student_id: studentId },
      select: { id: true },
    });

    if (existing) {
      await this.prisma.grades.update({
        where: { id: existing.id },
        data: {
          assignment_avg: assignmentAvg,
          exam_avg: examAvg,
          attendance_rate: attendanceRate,
          final_score: finalScore,
          updated_at: new Date(),
        },
      });
      return;
    }

    await this.prisma.grades.create({
      data: {
        id: randomUUID(),
        class_id: classId,
        student_id: studentId,
        assignment_avg: assignmentAvg,
        exam_avg: examAvg,
        attendance_rate: attendanceRate,
        final_score: finalScore,
        updated_at: new Date(),
      },
    });
  }

  private async notifyClassStudents(
    classId: string,
    payload: {
      type: string;
      title: string;
      body: string;
      ref_type?: string;
      ref_id?: string;
    },
  ) {
    if (!this.notificationsService) {
      return;
    }

    const enrolled = await this.prisma.enrollments.findMany({
      where: { class_id: classId, status: 'active' },
      select: { student_id: true },
    });

    if (!enrolled.length) {
      return;
    }

    await this.notificationsService.createBulk(
      enrolled.map((it) => ({
        user_id: it.student_id,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        ref_type: payload.ref_type,
        ref_id: payload.ref_id,
      })),
    );
  }

  private async notifyClassManagers(
    classId: string,
    payload: {
      type: string;
      title: string;
      body: string;
      ref_type?: string;
      ref_id?: string;
    },
  ) {
    if (!this.notificationsService) {
      return;
    }

    const classItem = await this.prisma.classes.findUnique({
      where: { id: classId },
      select: { teacher_id: true },
    });

    if (!classItem?.teacher_id) {
      return;
    }

    await this.notificationsService.create({
      user_id: classItem.teacher_id,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      ref_type: payload.ref_type,
      ref_id: payload.ref_id,
    });
  }
}
