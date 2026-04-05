import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class StartExamAttemptDto {
  @ApiPropertyOptional({ example: 'Mozilla/5.0' })
  @IsOptional()
  @IsString()
  device_info_text?: string;

  @ApiPropertyOptional({ example: { platform: 'web', browser: 'Chrome' } })
  @IsOptional()
  @IsObject()
  device_info?: Record<string, unknown>;
}
