import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

const QUESTION_FORMATS = [
  'mcq',
  'single_choice',
  'multi_select',
  'multiple_choice',
  'one_word_only',
  'two_words_only',
  'number_only',
  'tfng',
  'true_false',
  'yes_no_not_given',
  'matching_heading',
  'matching_information',
  'matching_features',
  'matching_sentence_endings',
  'sentence_completion',
  'summary_completion',
  'note_completion',
  'table_completion',
  'flow_chart_completion',
  'diagram_label_completion',
  'short_answer',
] as const;

const BLUEPRINT_TEMPLATES = [
  'ielts_reading',
  'ielts_listening',
  'thptqg_english',
  'grade10_entrance_english',
] as const;
const SCORING_MODES = ['standard', 'weighted', 'negative'] as const;

export class TestBlueprintSectionDto {
  @ApiProperty({ example: 'Reading Part 1' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order_index!: number;

  @ApiProperty({ example: 20, description: 'Thời lượng section (phút)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  duration_minutes!: number;

  @ApiProperty({
    example: 10,
    description: 'Số câu random từ bank cho section này',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  num_questions!: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Điểm mỗi câu trong section',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  score_per_question?: number;

  @ApiPropertyOptional({ example: 'reading' })
  @IsOptional()
  @IsString()
  section_type?: string;

  @ApiPropertyOptional({ example: 'Reading' })
  @IsOptional()
  @IsString()
  skill?: string;

  @ApiPropertyOptional({ example: 'easy' })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional({ type: [String], enum: QUESTION_FORMATS })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn(QUESTION_FORMATS, { each: true })
  question_formats?: Array<(typeof QUESTION_FORMATS)[number]>;

  @ApiPropertyOptional({ type: [String], example: ['ielts', 'reading'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  exam_type_tags?: string[];
}

export class CreateTestQuestionDto {
  @ApiProperty({ enum: QUESTION_FORMATS })
  @IsString()
  @IsIn(QUESTION_FORMATS)
  question_format!: (typeof QUESTION_FORMATS)[number];

  @ApiProperty({ example: 'The lecture starts at 9 AM. (TFNG)' })
  @IsString()
  content!: string;

  @ApiPropertyOptional({ example: { A: 'True', B: 'False', C: 'Not Given' } })
  @IsOptional()
  @IsObject()
  options?: Record<string, unknown>;

  @ApiPropertyOptional({ example: { answer: 'A' } })
  @IsOptional()
  @IsObject()
  correct_answer?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'Chú ý keyword ở câu đầu tiên.' })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({ example: 'reading' })
  @IsOptional()
  @IsString()
  section_type?: string;

  @ApiPropertyOptional({ example: 'easy' })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order_index?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  score?: number;

  @ApiPropertyOptional({
    example: ['ielts', 'reading', 'tfng'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  exam_type_tags?: string[];

  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000011' })
  @IsOptional()
  @IsUUID()
  passage_id?: string;
}

export class CreateClassTestDto {
  @ApiProperty({ example: 'Mock Test - Reading 01' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 'Bài kiểm tra giữa kỳ kỹ năng đọc' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'IELTS' })
  @IsOptional()
  @IsString()
  exam_type?: string;

  @ApiPropertyOptional({
    enum: BLUEPRINT_TEMPLATES,
    description: 'Chọn blueprint mẫu cố định theo exam type',
  })
  @IsOptional()
  @IsString()
  @IsIn(BLUEPRINT_TEMPLATES)
  blueprint_template?: (typeof BLUEPRINT_TEMPLATES)[number];

  @ApiPropertyOptional({ example: 'English' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({ example: 60 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  duration_minutes!: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  max_attempts?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  shuffle_questions?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  shuffle_options?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  show_result_after?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  show_answer_after?: boolean;

  @ApiPropertyOptional({ enum: SCORING_MODES, example: 'weighted' })
  @IsOptional()
  @IsString()
  @IsIn(SCORING_MODES)
  scoring_mode?: (typeof SCORING_MODES)[number];

  @ApiPropertyOptional({
    example: 0.25,
    description: 'Tỉ lệ trừ điểm cho câu sai nếu scoring_mode=negative',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  negative_marking_ratio?: number;

  @ApiPropertyOptional({
    example: { easy: 1, medium: 1.2, hard: 1.5 },
    description: 'Hệ số trọng số theo difficulty nếu scoring_mode=weighted',
  })
  @IsOptional()
  @IsObject()
  difficulty_weights?: Record<string, number>;

  @ApiPropertyOptional({ example: '2026-06-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  available_from?: string;

  @ApiPropertyOptional({ example: '2026-06-07T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  available_until?: string;

  @ApiPropertyOptional({ example: 'Read all questions carefully.' })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({
    type: [CreateTestQuestionDto],
    description: 'Danh sách câu hỏi tự tạo trong đề',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTestQuestionDto)
  questions?: CreateTestQuestionDto[];
  @ApiPropertyOptional({
    example: '00000000-0000-0000-0000-000000000001',
    description: 'ID blueprint template được quản lý từ admin UI',
  })
  @IsOptional()
  @IsUUID()
  blueprint_template_id?: string;

  @ApiPropertyOptional({
    type: [TestBlueprintSectionDto],
    description:
      'Blueprint section để random câu hỏi từ question bank (IELTS/THPTQG/10-grade...)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestBlueprintSectionDto)
  blueprint_sections?: TestBlueprintSectionDto[];
}
