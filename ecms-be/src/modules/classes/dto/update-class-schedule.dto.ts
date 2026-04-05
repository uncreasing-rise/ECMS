import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateClassScheduleDto {
  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000004' })
  @IsOptional()
  @IsUUID()
  room_id?: string | null;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  session_number?: number;

  @ApiPropertyOptional({ example: '2026-04-22T09:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  starts_at?: string;

  @ApiPropertyOptional({ example: '2026-04-22T10:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  ends_at?: string;

  @ApiPropertyOptional({ example: 'Dời lịch do nghỉ lễ' })
  @IsOptional()
  @IsString()
  note?: string;
}
