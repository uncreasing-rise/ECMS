import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsObject,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class ExamAnswerItemDto {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000111' })
  @IsUUID()
  question_id!: string;

  @ApiProperty({ example: { answer: 'A' } })
  @IsOptional()
  @IsObject()
  answer?: Record<string, unknown>;
}

export class UpsertExamAnswerDto {
  @ApiProperty({ type: [ExamAnswerItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExamAnswerItemDto)
  answers!: ExamAnswerItemDto[];
}
