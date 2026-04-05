import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class UpdateClassDto {
  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000001' })
  @IsOptional()
  @IsUUID()
  course_id?: string;

  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000003' })
  @IsOptional()
  @IsUUID()
  teacher_id?: string | null;

  @ApiPropertyOptional({ example: 'IELTS Foundation A1 - Updated' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 35 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  max_students?: number;

  @ApiPropertyOptional({ example: '2026-04-10' })
  @IsOptional()
  @IsDateString()
  start_date?: string | null;

  @ApiPropertyOptional({ example: '2026-07-10' })
  @IsOptional()
  @IsDateString()
  end_date?: string | null;

  @ApiPropertyOptional({ example: 'inactive' })
  @IsOptional()
  @IsString()
  status?: string;
}
