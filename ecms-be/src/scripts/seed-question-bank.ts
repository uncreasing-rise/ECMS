import { Prisma, PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as fs from 'node:fs';
import * as path from 'node:path';

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const candidates = [
    path.resolve(process.cwd(), '../.env'),
    path.resolve(process.cwd(), '.env'),
  ];

  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, 'utf8');
    const line = content
      .split(/\r?\n/)
      .find((l) => l.trim().startsWith('DATABASE_URL='));

    if (line) {
      const raw = line.slice(line.indexOf('=') + 1).trim();
      return raw.replace(/^"|"$/g, '');
    }
  }

  throw new Error('DATABASE_URL not found in environment or .env file');
}

const pool = new Pool({ connectionString: getDatabaseUrl() });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
} as Prisma.Subset<Prisma.PrismaClientOptions, Prisma.PrismaClientOptions>);

type SeedQuestion = {
  question_format: string;
  section_type: string;
  difficulty: string;
  content: string;
  options?: Record<string, unknown>;
  correct_answer?: Record<string, unknown>;
  explanation?: string;
  exam_type_tags: string[];
};

const seededQuestions: Record<string, SeedQuestion[]> = {
  ielts: [
    {
      question_format: 'matching_heading',
      section_type: 'reading_p1',
      difficulty: 'medium',
      content: '[SEED][IELTS] Match heading for paragraph A.',
      correct_answer: { A: 'ii', B: 'iv', C: 'i' },
      exam_type_tags: ['ielts', 'reading'],
    },
    {
      question_format: 'tfng',
      section_type: 'reading_p1',
      difficulty: 'easy',
      content: '[SEED][IELTS] The museum opens at 9 AM.',
      options: { A: 'True', B: 'False', C: 'Not Given' },
      correct_answer: { answer: 'A' },
      exam_type_tags: ['ielts', 'reading'],
    },
    {
      question_format: 'one_word_only',
      section_type: 'listening_p1',
      difficulty: 'easy',
      content:
        '[SEED][IELTS] Write ONE WORD: The event will be held in the ____ hall.',
      correct_answer: { answer: 'main' },
      exam_type_tags: ['ielts', 'listening'],
    },
    {
      question_format: 'summary_completion',
      section_type: 'listening_p4',
      difficulty: 'hard',
      content: '[SEED][IELTS] Complete summary blanks 1-3.',
      correct_answer: { '1': 'ecosystem', '2': 'biodiversity', '3': 'habitat' },
      exam_type_tags: ['ielts', 'listening'],
    },
  ],
  thptqg: [
    {
      question_format: 'mcq',
      section_type: 'thpt_grammar',
      difficulty: 'easy',
      content:
        '[SEED][THPTQG] Choose the correct tense: She ____ to school every day.',
      options: { A: 'go', B: 'goes', C: 'went', D: 'gone' },
      correct_answer: { answer: 'B' },
      exam_type_tags: ['thptqg', 'english'],
    },
    {
      question_format: 'single_choice',
      section_type: 'thpt_vocab',
      difficulty: 'medium',
      content: '[SEED][THPTQG] Synonym of rapid is ____.',
      options: { A: 'slow', B: 'quick', C: 'lazy', D: 'late' },
      correct_answer: { answer: 'B' },
      exam_type_tags: ['thptqg', 'english'],
    },
    {
      question_format: 'sentence_completion',
      section_type: 'thpt_reading',
      difficulty: 'hard',
      content: '[SEED][THPTQG] Complete sentence with suitable word.',
      correct_answer: { answer: 'development' },
      exam_type_tags: ['thptqg', 'english'],
    },
  ],
  grade10: [
    {
      question_format: 'mcq',
      section_type: 'grade10_grammar',
      difficulty: 'easy',
      content:
        '[SEED][GRADE10] Choose the correct article: ____ apple a day keeps the doctor away.',
      options: { A: 'A', B: 'An', C: 'The', D: 'No article' },
      correct_answer: { answer: 'B' },
      exam_type_tags: ['grade10', 'entrance', 'english'],
    },
    {
      question_format: 'matching_information',
      section_type: 'grade10_reading',
      difficulty: 'medium',
      content: '[SEED][GRADE10] Match statements to paragraphs.',
      correct_answer: { '1': 'C', '2': 'A', '3': 'D', '4': 'B' },
      exam_type_tags: ['grade10', 'entrance', 'english'],
    },
    {
      question_format: 'short_answer',
      section_type: 'grade10_reading',
      difficulty: 'hard',
      content: '[SEED][GRADE10] Answer in no more than two words.',
      correct_answer: { answer: 'solar energy' },
      exam_type_tags: ['grade10', 'entrance', 'english'],
    },
  ],
};

async function getSeederUserId() {
  const roleUser = await prisma.user_roles.findFirst({
    where: {
      roles: {
        name: { in: ['admin', 'teacher'] },
      },
    },
    select: { user_id: true },
  });

  if (roleUser?.user_id) {
    return roleUser.user_id;
  }

  const anyUser = await prisma.users.findFirst({ select: { id: true } });
  if (!anyUser) {
    throw new Error(
      'No users found. Please create at least one user before seeding question bank.',
    );
  }

  return anyUser.id;
}

async function seedExamTemplates(createdBy: string) {
  const templates = [
    {
      key: 'IELTS_READING_TEMPLATE',
      name: 'IELTS Reading Blueprint',
      exam_type: 'IELTS',
      subject: 'English',
      total_duration_minutes: 60,
      sections: [
        {
          name: 'Reading Passage 1',
          order_index: 1,
          duration_minutes: 20,
          num_questions: 13,
          question_type: 'reading_p1',
          skill: 'reading',
        },
        {
          name: 'Reading Passage 2',
          order_index: 2,
          duration_minutes: 20,
          num_questions: 13,
          question_type: 'reading_p2',
          skill: 'reading',
        },
        {
          name: 'Reading Passage 3',
          order_index: 3,
          duration_minutes: 20,
          num_questions: 14,
          question_type: 'reading_p3',
          skill: 'reading',
        },
      ],
    },
    {
      key: 'THPTQG_ENGLISH_TEMPLATE',
      name: 'THPTQG English Blueprint',
      exam_type: 'THPTQG',
      subject: 'English',
      total_duration_minutes: 60,
      sections: [
        {
          name: 'Vocabulary',
          order_index: 1,
          duration_minutes: 15,
          num_questions: 12,
          question_type: 'thpt_vocab',
          skill: 'vocabulary',
        },
        {
          name: 'Grammar',
          order_index: 2,
          duration_minutes: 20,
          num_questions: 18,
          question_type: 'thpt_grammar',
          skill: 'grammar',
        },
        {
          name: 'Reading',
          order_index: 3,
          duration_minutes: 25,
          num_questions: 20,
          question_type: 'thpt_reading',
          skill: 'reading',
        },
      ],
    },
    {
      key: 'IELTS_LISTENING_TEMPLATE',
      name: 'IELTS Listening Blueprint',
      exam_type: 'IELTS',
      subject: 'English',
      total_duration_minutes: 40,
      sections: [
        {
          name: 'Listening Part 1',
          order_index: 1,
          duration_minutes: 10,
          num_questions: 10,
          question_type: 'listening_p1',
          skill: 'listening',
        },
        {
          name: 'Listening Part 2',
          order_index: 2,
          duration_minutes: 10,
          num_questions: 10,
          question_type: 'listening_p2',
          skill: 'listening',
        },
        {
          name: 'Listening Part 3',
          order_index: 3,
          duration_minutes: 10,
          num_questions: 10,
          question_type: 'listening_p3',
          skill: 'listening',
        },
        {
          name: 'Listening Part 4',
          order_index: 4,
          duration_minutes: 10,
          num_questions: 10,
          question_type: 'listening_p4',
          skill: 'listening',
        },
      ],
    },
    {
      key: 'GRADE10_ENTRANCE_ENGLISH_TEMPLATE',
      name: 'Grade 10 Entrance English Blueprint',
      exam_type: 'GRADE10',
      subject: 'English',
      total_duration_minutes: 45,
      sections: [
        {
          name: 'Grammar',
          order_index: 1,
          duration_minutes: 20,
          num_questions: 20,
          question_type: 'grade10_grammar',
          skill: 'grammar',
        },
        {
          name: 'Reading',
          order_index: 2,
          duration_minutes: 25,
          num_questions: 20,
          question_type: 'grade10_reading',
          skill: 'reading',
        },
      ],
    },
  ];

  for (const template of templates) {
    const existing = await prisma.exam_templates.findFirst({
      where: { name: template.name, exam_type: template.exam_type },
      select: { id: true },
    });

    if (existing) {
      continue;
    }

    const created = await prisma.exam_templates.create({
      data: {
        id: randomUUID(),
        name: template.name,
        exam_type: template.exam_type,
        subject: template.subject,
        total_duration_minutes: template.total_duration_minutes,
        total_score: 10,
        passing_score: 5,
        description: `[SEED_TEMPLATE] ${template.key}`,
        instructions: 'Auto-seeded fixed blueprint template',
        is_active: true,
        created_by: createdBy,
        created_at: new Date(),
      },
    });

    for (const section of template.sections) {
      await prisma.exam_sections.create({
        data: {
          id: randomUUID(),
          template_id: created.id,
          name: section.name,
          order_index: section.order_index,
          duration_minutes: section.duration_minutes,
          num_questions: section.num_questions,
          section_score: Number((10 / template.sections.length).toFixed(2)),
          question_type: section.question_type,
          skill: section.skill,
          instructions: 'Auto-seeded section',
        },
      });
    }
  }
}

async function seedQuestions(createdBy: string) {
  for (const examType of Object.keys(seededQuestions)) {
    for (const q of seededQuestions[examType]) {
      const exists = await prisma.questions.findFirst({
        where: { content: q.content },
        select: { id: true },
      });

      if (exists) {
        continue;
      }

      await prisma.questions.create({
        data: {
          id: randomUUID(),
          created_by: createdBy,
          section_type: q.section_type,
          question_format: q.question_format,
          content: q.content,
          options: q.options as Prisma.InputJsonValue,
          correct_answer: q.correct_answer as Prisma.InputJsonValue,
          explanation: q.explanation,
          difficulty: q.difficulty,
          exam_type_tags: q.exam_type_tags,
          is_public: true,
          created_at: new Date(),
        },
      });
    }
  }
}

async function main() {
  const createdBy = await getSeederUserId();
  await seedExamTemplates(createdBy);
  await seedQuestions(createdBy);
  console.log(
    'Seeded question bank and fixed blueprint templates successfully.',
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
