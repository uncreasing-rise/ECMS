import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class RubricCriterionDto {
  @ApiProperty({ example: 'content' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 'Nội dung và ý tưởng' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'Đúng yêu cầu đề bài, lập luận rõ' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max_score: number;
}

export class CreateAssignmentDto {
  @ApiProperty({ example: 'Bài luận chủ đề Education' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'Viết bài 250 từ theo chủ đề đã cho' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    example: 'Nộp file PDF hoặc link Google Docs trước hạn',
  })
  @IsOptional()
  @IsString()
  submission_instructions?: string;

  @ApiPropertyOptional({ example: ['https://cdn.example.com/de-bai.pdf'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  attachment_urls?: string[];

  @ApiProperty({ example: '2026-05-30T23:59:59.000Z' })
  @IsDateString()
  due_at: string;

  @ApiPropertyOptional({ example: 10 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  max_score?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  allow_resubmit?: boolean;

  @ApiPropertyOptional({ type: [RubricCriterionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RubricCriterionDto)
  rubric?: RubricCriterionDto[];
}
