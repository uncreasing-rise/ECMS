import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateBlueprintTemplateSectionDto {
  @ApiProperty({ example: 'Reading Passage 1' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order_index!: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  duration_minutes?: number;

  @ApiPropertyOptional({ example: 13 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  num_questions?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  section_score?: number;

  @ApiPropertyOptional({ example: 'reading_p1' })
  @IsOptional()
  @IsString()
  question_type?: string;

  @ApiPropertyOptional({ example: 'reading' })
  @IsOptional()
  @IsString()
  skill?: string;

  @ApiPropertyOptional({ example: 'easy' })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['matching_heading', 'tfng'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  question_formats?: string[];

  @ApiPropertyOptional({ type: [String], example: ['ielts', 'reading'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  exam_type_tags?: string[];

  @ApiPropertyOptional({ example: 'Section instructions shown in UI' })
  @IsOptional()
  @IsString()
  instructions?: string;
}

export class CreateBlueprintTemplateDto {
  @ApiProperty({ example: 'IELTS Reading Blueprint' })
  @IsString()
  @MaxLength(150)
  name!: string;

  @ApiProperty({ example: 'IELTS' })
  @IsString()
  @MaxLength(30)
  exam_type!: string;

  @ApiPropertyOptional({ example: 'English' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  subject?: string;

  @ApiPropertyOptional({ example: 'Hanoi' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  province?: string;

  @ApiProperty({ example: 60 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  total_duration_minutes!: number;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total_score?: number;

  @ApiPropertyOptional({ example: 24 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  passing_score?: number;

  @ApiPropertyOptional({ example: 'Official blueprint used by center.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Read all instructions before starting.' })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ type: [CreateBlueprintTemplateSectionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBlueprintTemplateSectionDto)
  sections?: CreateBlueprintTemplateSectionDto[];
}
