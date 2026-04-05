import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBlueprintSectionDto {
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

  @ApiPropertyOptional({ example: 13 })
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
