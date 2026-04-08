import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class GradeEssayAnswerDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  score!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  feedback?: string;
}
