import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ClassGradeSubmissionDto {
  @ApiProperty({ example: 8.5 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  score!: number;

  @ApiPropertyOptional({ example: 'Bài làm tốt, cần cải thiện coherence.' })
  @IsOptional()
  @IsString()
  feedback?: string;
}
