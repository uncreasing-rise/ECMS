import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';

export class SubmitExamAttemptDto {
  @ApiPropertyOptional({ example: { submitted_from: 'web' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
