import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class RubricScoreItemDto {
  @ApiProperty({ example: 'content' })
  @IsString()
  @IsNotEmpty()
  criterion_id: string;

  @ApiProperty({ example: 4 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  score: number;

  @ApiPropertyOptional({ example: 'Ý tưởng tốt nhưng cần thêm dẫn chứng' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}

export class SubmissionAnnotationDto {
  @ApiProperty({ example: 'paragraph-1' })
  @IsString()
  @IsNotEmpty()
  target: string;

  @ApiProperty({ example: 'Luận điểm chưa rõ, em viết cụ thể hơn.' })
  @IsString()
  @IsNotEmpty()
  comment: string;
}

export class GradeSubmissionDto {
  @ApiPropertyOptional({ example: 8.5 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  score?: number;

  @ApiPropertyOptional({ example: 'Bài làm tốt, cần cải thiện phần kết luận.' })
  @IsOptional()
  @IsString()
  feedback?: string;

  @ApiPropertyOptional({ type: [RubricScoreItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RubricScoreItemDto)
  rubric_scores?: RubricScoreItemDto[];

  @ApiPropertyOptional({ type: [SubmissionAnnotationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmissionAnnotationDto)
  annotations?: SubmissionAnnotationDto[];
}
