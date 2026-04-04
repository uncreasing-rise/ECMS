import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const PERMISSIONS = [
  { name: 'users.read', category: 'users', action: 'read' },
  { name: 'users.write', category: 'users', action: 'write' },
  { name: 'roles.read', category: 'roles', action: 'read' },
  { name: 'roles.write', category: 'roles', action: 'write' },
  { name: 'branches.read', category: 'branches', action: 'read' },
  { name: 'branches.write', category: 'branches', action: 'write' },
  { name: 'courses.read', category: 'courses', action: 'read' },
  { name: 'courses.write', category: 'courses', action: 'write' },
  { name: 'classes.read', category: 'classes', action: 'read' },
  { name: 'classes.write', category: 'classes', action: 'write' },
  { name: 'enrollments.read', category: 'enrollments', action: 'read' },
  { name: 'enrollments.write', category: 'enrollments', action: 'write' },
  { name: 'finance.read', category: 'finance', action: 'read' },
  { name: 'finance.write', category: 'finance', action: 'write' },
  { name: 'sessions.read', category: 'sessions', action: 'read' },
  { name: 'sessions.write', category: 'sessions', action: 'write' },
  { name: 'audit-logs.read', category: 'audit-logs', action: 'read' },
  { name: 'leads.read', category: 'leads', action: 'read' },
  { name: 'leads.write', category: 'leads', action: 'write' },
] as const;

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);
  const staffPasswordHash = await bcrypt.hash('staff123', 10);
  const teacherPasswordHash = await bcrypt.hash('teacher123', 10);
  const studentPasswordHash = await bcrypt.hash('student123', 10);
  const guardianPasswordHash = await bcrypt.hash('guardian123', 10);

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: { status: 'active', description: 'Full access administrator' },
    create: { name: 'admin', status: 'active', description: 'Full access administrator' },
  });

  const saleRole = await prisma.role.upsert({
    where: { name: 'sale' },
    update: { status: 'active', description: 'Sales and admissions team' },
    create: { name: 'sale', status: 'active', description: 'Sales and admissions team' },
  });

  const teacherRole = await prisma.role.upsert({
    where: { name: 'teacher' },
    update: { status: 'active', description: 'Teaching staff' },
    create: { name: 'teacher', status: 'active', description: 'Teaching staff' },
  });

  const studentRole = await prisma.role.upsert({
    where: { name: 'student' },
    update: { status: 'active', description: 'Learner account' },
    create: { name: 'student', status: 'active', description: 'Learner account' },
  });

  const guardianRole = await prisma.role.upsert({
    where: { name: 'guardian' },
    update: { status: 'active', description: 'Parent or guardian account' },
    create: { name: 'guardian', status: 'active', description: 'Parent or guardian account' },
  });

  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: { category: permission.category, action: permission.action },
      create: {
        name: permission.name,
        category: permission.category,
        action: permission.action,
      },
    });
  }

  const permissions = await prisma.permission.findMany();
  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  const salePermissions = permissions.filter((permission) =>
    [
      'branches.read',
      'courses.read',
      'classes.read',
      'enrollments.read',
      'enrollments.write',
      'leads.read',
      'leads.write',
    ].includes(permission.name),
  );

  for (const permission of salePermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: saleRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: saleRole.id,
        permissionId: permission.id,
      },
    });
  }

  const teacherPermissions = permissions.filter((permission) =>
    [
      'classes.read',
      'enrollments.read',
      'sessions.read',
      'audit-logs.read',
    ].includes(permission.name),
  );

  for (const permission of teacherPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: teacherRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: teacherRole.id,
        permissionId: permission.id,
      },
    });
  }

  const centralBranch =
    (await prisma.branch.findFirst({ where: { name: 'Central Campus' } })) ??
    (await prisma.branch.create({
      data: {
        name: 'Central Campus',
        location: 'District 1, Ho Chi Minh City',
        status: 'active',
        timezone: 'Asia/Ho_Chi_Minh',
        currency: 'VND',
      },
    }));

  const eastBranch =
    (await prisma.branch.findFirst({ where: { name: 'East Campus' } })) ??
    (await prisma.branch.create({
      data: {
        name: 'East Campus',
        location: 'Thu Duc City, Ho Chi Minh City',
        status: 'active',
        parentBranchId: centralBranch.id,
        timezone: 'Asia/Ho_Chi_Minh',
        currency: 'VND',
      },
    }));

  const starterCourse =
    (await prisma.course.findFirst({ where: { name: 'General English A1' } })) ??
    (await prisma.course.create({
      data: {
        name: 'General English A1',
        level: 'A1',
        description: 'Starter English for beginners',
        status: 'active',
        durationWeeks: 12,
      },
    }));

  const intermediateCourse =
    (await prisma.course.findFirst({ where: { name: 'General English A2' } })) ??
    (await prisma.course.create({
      data: {
        name: 'General English A2',
        level: 'A2',
        description: 'Continuation of A1',
        status: 'active',
        durationWeeks: 12,
      },
    }));

  const prerequisite =
    (await prisma.coursePrerequisite.findFirst({
      where: {
        courseId: intermediateCourse.id,
        prerequisiteId: starterCourse.id,
      },
    })) ??
    (await prisma.coursePrerequisite.create({
      data: {
        courseId: intermediateCourse.id,
        prerequisiteId: starterCourse.id,
      },
    }));

  const adminUser =
    (await prisma.user.findUnique({
      where: { email: 'admin@ecms.local' },
    })) ??
    (await prisma.user.create({
      data: {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@ecms.local',
        phone: '0900000001',
        accountType: 'staff',
        status: 'active',
        passwordHash,
        emailVerifiedAt: new Date(),
        branchId: centralBranch.id,
      },
    }));

  const saleUser =
    (await prisma.user.findUnique({
      where: { email: 'sale@ecms.local' },
    })) ??
    (await prisma.user.create({
      data: {
        firstName: 'Sale',
        lastName: 'Staff',
        email: 'sale@ecms.local',
        phone: '0900000002',
        accountType: 'staff',
        status: 'active',
        passwordHash: staffPasswordHash,
        emailVerifiedAt: new Date(),
        branchId: eastBranch.id,
      },
    }));

  const teacherUser =
    (await prisma.user.findUnique({
      where: { email: 'teacher@ecms.local' },
    })) ??
    (await prisma.user.create({
      data: {
        firstName: 'Teacher',
        lastName: 'One',
        email: 'teacher@ecms.local',
        phone: '0900000003',
        accountType: 'staff',
        status: 'active',
        passwordHash: teacherPasswordHash,
        emailVerifiedAt: new Date(),
        branchId: centralBranch.id,
      },
    }));

  const studentUser =
    (await prisma.user.findUnique({
      where: { email: 'student@ecms.local' },
    })) ??
    (await prisma.user.create({
      data: {
        firstName: 'Student',
        lastName: 'One',
        email: 'student@ecms.local',
        phone: '0900000004',
        accountType: 'student',
        status: 'active',
        passwordHash: studentPasswordHash,
        emailVerifiedAt: new Date(),
        branchId: centralBranch.id,
      },
    }));

  const guardianUser =
    (await prisma.user.findUnique({
      where: { email: 'guardian@ecms.local' },
    })) ??
    (await prisma.user.create({
      data: {
        firstName: 'Guardian',
        lastName: 'One',
        email: 'guardian@ecms.local',
        phone: '0900000005',
        accountType: 'guardian',
        status: 'active',
        passwordHash: guardianPasswordHash,
        emailVerifiedAt: new Date(),
      },
    }));

  const roleAssignments = [
    { userId: adminUser.id, roleId: adminRole.id },
    { userId: saleUser.id, roleId: saleRole.id },
    { userId: teacherUser.id, roleId: teacherRole.id },
    { userId: studentUser.id, roleId: studentRole.id },
    { userId: guardianUser.id, roleId: guardianRole.id },
  ];

  for (const assignment of roleAssignments) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: assignment.userId,
          roleId: assignment.roleId,
        },
      },
      update: { revokedAt: null },
      create: assignment,
    });
  }

  const mainClass =
    (await prisma.class.findFirst({ where: { name: 'A1-Weekend-01' } })) ??
    (await prisma.class.create({
      data: {
        name: 'A1-Weekend-01',
        courseId: starterCourse.id,
        branchId: centralBranch.id,
        teacherId: teacherUser.id,
        capacity: 20,
        startDate: new Date('2026-04-10'),
        endDate: new Date('2026-07-03'),
        status: 'open',
      },
    }));

  const enrollment =
    (await prisma.enrollment.findFirst({
      where: { classId: mainClass.id, studentId: studentUser.id },
    })) ??
    (await prisma.enrollment.create({
      data: {
        classId: mainClass.id,
        studentId: studentUser.id,
        status: 'active',
      },
    }));

  const lead =
    (await prisma.lead.findFirst({ where: { phone: '0912000000' } })) ??
    (await prisma.lead.create({
      data: {
        branchId: eastBranch.id,
        ownerId: saleUser.id,
        name: 'Nguyen Van Lead',
        phone: '0912000000',
        email: 'lead@ecms.local',
        source: 'facebook',
        status: 'new',
        score: 50,
      },
    }));

  const leadHistoryExists = await prisma.leadStatusHistory.findFirst({
    where: { leadId: lead.id, fromStatus: 'new', toStatus: 'contacted' },
  });
  if (!leadHistoryExists) {
    await prisma.leadStatusHistory.create({
      data: {
        leadId: lead.id,
        fromStatus: 'new',
        toStatus: 'contacted',
        changedBy: saleUser.id,
        changedAt: new Date(),
        note: 'Initial contact made',
      },
    });
  }

  const consultationExists = await prisma.consultation.findFirst({
    where: { leadId: lead.id },
  });
  if (!consultationExists) {
    await prisma.consultation.create({
      data: {
        leadId: lead.id,
        staffId: saleUser.id,
        date: new Date('2026-04-02'),
        outcome: 'scheduled',
        followUpNote: 'Call again next week',
        followUpDate: new Date('2026-04-09'),
        status: 'pending',
      },
    });
  }

  const assignment =
    (await prisma.assignment.findFirst({ where: { title: 'Warm-up Homework 1' } })) ??
    (await prisma.assignment.create({
      data: {
        classId: mainClass.id,
        title: 'Warm-up Homework 1',
        description: 'Simple grammar and vocabulary practice',
        dueDate: new Date('2026-04-17'),
        maxScore: 10,
      },
    }));

  const submissionExists = await prisma.assignmentSubmission.findFirst({
    where: { assignmentId: assignment.id, studentId: studentUser.id },
  });
  if (!submissionExists) {
    await prisma.assignmentSubmission.create({
      data: {
        assignmentId: assignment.id,
        studentId: studentUser.id,
        status: 'submitted',
        fileUrl: 'https://files.ecms.local/submissions/warmup-homework-1.pdf',
        score: 8.5,
        feedback: 'Good work',
      },
    });
  }

  const attendanceRecord =
    (await prisma.attendanceRecord.findFirst({
      where: { classId: mainClass.id, date: new Date('2026-04-10') },
    })) ??
    (await prisma.attendanceRecord.create({
      data: {
        classId: mainClass.id,
        date: new Date('2026-04-10'),
        sessionLabel: 'Session 1',
        presentCount: 1,
        absentCount: 0,
        lateCount: 0,
      },
    }));

  const attendanceDetailExists = await prisma.attendanceDetail.findFirst({
    where: { attendanceRecordId: attendanceRecord.id, studentId: studentUser.id },
  });
  if (!attendanceDetailExists) {
    await prisma.attendanceDetail.create({
      data: {
        attendanceRecordId: attendanceRecord.id,
        studentId: studentUser.id,
        status: 'present',
        note: 'On time',
      },
    });
  }

  const gradeComponent =
    (await prisma.gradeComponent.findFirst({
      where: { classId: mainClass.id, name: 'Quiz 1' },
    })) ??
    (await prisma.gradeComponent.create({
      data: {
        classId: mainClass.id,
        name: 'Quiz 1',
        weight: 0.25,
        type: 'quiz',
      },
    }));

  const studentGradeExists = await prisma.studentGrade.findFirst({
    where: { componentId: gradeComponent.id, studentId: studentUser.id },
  });
  if (!studentGradeExists) {
    await prisma.studentGrade.create({
      data: {
        componentId: gradeComponent.id,
        studentId: studentUser.id,
        score: 8.5,
        gradedBy: teacherUser.id,
        gradedAt: new Date('2026-04-11'),
      },
    });
  }

  const resource =
    (await prisma.resource.findFirst({ where: { classId: mainClass.id, title: 'Starter Pack PDF' } })) ??
    (await prisma.resource.create({
      data: {
        classId: mainClass.id,
        title: 'Starter Pack PDF',
        type: 'pdf',
        url: 'https://files.ecms.local/resources/starter-pack.pdf',
      },
    }));

  const resourceDownloadExists = await prisma.resourceDownloadLog.findFirst({
    where: { resourceId: resource.id, userId: studentUser.id },
  });
  if (!resourceDownloadExists) {
    await prisma.resourceDownloadLog.create({
      data: {
        resourceId: resource.id,
        userId: studentUser.id,
        downloadedAt: new Date('2026-04-10T08:30:00Z'),
      },
    });
  }

  const activityExists = await prisma.activityLog.findFirst({
    where: { classId: mainClass.id, actorId: teacherUser.id, capability: 'attendance.create' },
  });
  if (!activityExists) {
    await prisma.activityLog.create({
      data: {
        classId: mainClass.id,
        actorId: teacherUser.id,
        capability: 'attendance.create',
        timestamp: new Date('2026-04-10T09:00:00Z'),
      },
    });
  }

  const salarySettingExists = await prisma.salarySetting.findUnique({
    where: { teacherId: teacherUser.id },
  });
  if (!salarySettingExists) {
    await prisma.salarySetting.create({
      data: {
        teacherId: teacherUser.id,
        branchId: centralBranch.id,
        baseRate: '12000000',
        sessionRate: '250000',
        overtimeRate: '300000',
        status: 'active',
        effectiveFrom: new Date('2026-04-01'),
      },
    });
  }

  const payrollRun =
    (await prisma.payrollRun.findFirst({
      where: { branchId: centralBranch.id, periodYear: 2026, periodMonth: 4 },
    })) ??
    (await prisma.payrollRun.create({
      data: {
        branchId: centralBranch.id,
        periodYear: 2026,
        periodMonth: 4,
        totalTeachers: 1,
        grossAmount: '15000000',
        netAmount: '14850000',
        status: 'completed',
        runBy: adminUser.id,
      },
    }));

  const sessionPayExists = await prisma.sessionPay.findFirst({
    where: { teacherId: teacherUser.id, branchId: centralBranch.id, sessionDate: new Date('2026-04-10') },
  });
  if (!sessionPayExists) {
    await prisma.sessionPay.create({
      data: {
        teacherId: teacherUser.id,
        branchId: centralBranch.id,
        classId: mainClass.id,
        payrollRunId: payrollRun.id,
        sessionDate: new Date('2026-04-10'),
        sessionCount: 2,
        amount: '500000',
        bonus: '50000',
      },
    });
  }

  const payrollAdjustmentExists = await prisma.payrollAdjustment.findFirst({
    where: { teacherId: teacherUser.id, branchId: centralBranch.id, periodYear: 2026, periodMonth: 4 },
  });
  if (!payrollAdjustmentExists) {
    await prisma.payrollAdjustment.create({
      data: {
        teacherId: teacherUser.id,
        branchId: centralBranch.id,
        payrollRunId: payrollRun.id,
        periodYear: 2026,
        periodMonth: 4,
        type: 'bonus',
        amount: '250000',
        status: 'approved',
        note: 'Performance bonus',
      },
    });
  }

  const notification =
    (await prisma.notification.findFirst({ where: { title: 'Welcome to ECMS' } })) ??
    (await prisma.notification.create({
      data: {
        senderId: adminUser.id,
        title: 'Welcome to ECMS',
        body: 'Your ECMS environment is ready.',
        type: 'system',
        status: 'sent',
        sentAt: new Date(),
      },
    }));

  const notificationRecipientExists = await prisma.notificationRecipient.findFirst({
    where: { notificationId: notification.id, userId: studentUser.id },
  });
  if (!notificationRecipientExists) {
    await prisma.notificationRecipient.create({
      data: {
        notificationId: notification.id,
        userId: studentUser.id,
        isRead: false,
      },
    });
  }

  const guardianLinkExists = await prisma.guardianLink.findFirst({
    where: { studentId: studentUser.id, guardianId: guardianUser.id },
  });
  if (!guardianLinkExists) {
    await prisma.guardianLink.create({
      data: {
        studentId: studentUser.id,
        guardianId: guardianUser.id,
        relationshipType: 'parent',
        status: 'active',
        isPrimary: true,
        verifiedAt: new Date(),
        canViewGrades: true,
        canViewAttendance: true,
        canViewFinance: true,
      },
    });
  }

  const exam =
    (await prisma.exam.findFirst({ where: { title: 'Placement Test April' } })) ??
    (await prisma.exam.create({
      data: {
        createdById: adminUser.id,
        category: 'placement',
        title: 'Placement Test April',
        status: 'published',
        totalDurationMinutes: 60,
        allowReview: true,
        allowSkip: false,
        randomizeQuestions: true,
        randomizeOptions: true,
        showScore: true,
        showAnswers: false,
        passwordProtected: false,
        requireProctoring: false,
      },
    }));

  const examScheduleExists = await prisma.examSchedule.findFirst({ where: { examId: exam.id } });
  if (!examScheduleExists) {
    await prisma.examSchedule.create({
      data: {
        examId: exam.id,
        startAt: new Date('2026-04-15T02:00:00Z'),
        endAt: new Date('2026-04-15T03:00:00Z'),
        maxAttempts: 1,
        password: '123456',
      },
    });
  }

  const examSection =
    (await prisma.examSection.findFirst({ where: { examId: exam.id, title: 'Listening' } })) ??
    (await prisma.examSection.create({
      data: {
        examId: exam.id,
        title: 'Listening',
        durationMinutes: 20,
        order: 1,
      },
    }));

  const examQuestion =
    (await prisma.examQuestion.findFirst({ where: { sectionId: examSection.id, order: 1 } })) ??
    (await prisma.examQuestion.create({
      data: {
        sectionId: examSection.id,
        type: 'multiple_choice',
        instructions: 'Choose the best answer.',
        points: 1,
        order: 1,
      },
    }));

  const optionAExists = await prisma.questionOption.findFirst({ where: { questionId: examQuestion.id, order: 1 } });
  if (!optionAExists) {
    await prisma.questionOption.create({
      data: {
        questionId: examQuestion.id,
        text: 'A. Apple',
        isCorrect: false,
        order: 1,
      },
    });
  }

  const optionBExists = await prisma.questionOption.findFirst({ where: { questionId: examQuestion.id, order: 2 } });
  if (!optionBExists) {
    await prisma.questionOption.create({
      data: {
        questionId: examQuestion.id,
        text: 'B. Orange',
        isCorrect: true,
        order: 2,
      },
    });
  }

  const blankExists = await prisma.questionBlank.findFirst({ where: { questionId: examQuestion.id, blankIndex: 1 } });
  if (!blankExists) {
    await prisma.questionBlank.create({
      data: {
        questionId: examQuestion.id,
        answer: 'orange',
        blankIndex: 1,
      },
    });
  }

  const matchItemExists = await prisma.questionMatchItem.findFirst({ where: { questionId: examQuestion.id, itemType: 'prompt' } });
  if (!matchItemExists) {
    await prisma.questionMatchItem.create({
      data: {
        questionId: examQuestion.id,
        text: 'Match the word with the picture',
        itemType: 'prompt',
      },
    });
  }

  const rubricExists = await prisma.questionRubric.findUnique({ where: { questionId: examQuestion.id } });
  if (!rubricExists) {
    await prisma.questionRubric.create({
      data: {
        questionId: examQuestion.id,
        rubricGuide: 'Award full marks for the correct option.',
        maxScore: 1,
      },
    });
  }

  const classExamExists = await prisma.classExam.findFirst({ where: { classId: mainClass.id, examId: exam.id } });
  if (!classExamExists) {
    await prisma.classExam.create({
      data: {
        classId: mainClass.id,
        examId: exam.id,
      },
    });
  }

  const attemptExists = await prisma.examAttempt.findFirst({
    where: { examId: exam.id, studentId: studentUser.id, attemptNumber: 1 },
  });
  const attempt =
    attemptExists ??
    (await prisma.examAttempt.create({
      data: {
        examId: exam.id,
        studentId: studentUser.id,
        status: 'submitted',
        score: 1,
        attemptNumber: 1,
        startedAt: new Date('2026-04-15T02:05:00Z'),
        submittedAt: new Date('2026-04-15T02:25:00Z'),
      },
    }));

  const attemptAnswerExists = await prisma.attemptAnswer.findFirst({
    where: { attemptId: attempt.id, questionId: examQuestion.id },
  });
  if (!attemptAnswerExists) {
    await prisma.attemptAnswer.create({
      data: {
        attemptId: attempt.id,
        questionId: examQuestion.id,
        answerData: { selectedOptionId: 'seeded' },
        isCorrect: true,
        scoreAwarded: 1,
      },
    });
  }

  const sessionExists = await prisma.session.findFirst({
    where: { userId: adminUser.id, deviceName: 'seed-admin-console' },
  });
  if (!sessionExists) {
    await prisma.session.create({
      data: {
        userId: adminUser.id,
        deviceName: 'seed-admin-console',
        ipAddress: '127.0.0.1',
        status: 'active',
        risk: 'low',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });
  }

  const auditLogExists = await prisma.auditLog.findFirst({
    where: { module: 'seed', action: 'bootstrap' },
  });
  if (!auditLogExists) {
    await prisma.auditLog.create({
      data: {
        actorId: adminUser.id,
        module: 'seed',
        action: 'bootstrap',
        targetType: 'environment',
        before: {},
        after: {
          branches: 2,
          courses: 2,
          classes: 1,
          leads: 1,
          exams: 1,
        },
        timestamp: new Date(),
      },
    });
  }

  console.log('Seed completed.');
  console.log('Admin: admin@ecms.local / admin123');
  console.log('Sale: sale@ecms.local / staff123');
  console.log('Teacher: teacher@ecms.local / teacher123');
  console.log('Student: student@ecms.local / student123');
  console.log('Guardian: guardian@ecms.local / guardian123');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
