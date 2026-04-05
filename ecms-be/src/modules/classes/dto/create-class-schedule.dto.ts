import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClassScheduleDto {
  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000004' })
  @IsOptional()
  @IsUUID()
  room_id?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  session_number?: number;

  @ApiProperty({ example: '2026-04-20T09:00:00.000Z' })
  @IsDateString()
  starts_at: string;

  @ApiProperty({ example: '2026-04-20T10:30:00.000Z' })
  @IsDateString()
  ends_at: string;

  @ApiPropertyOptional({ example: 'Phòng 202 - buổi khai giảng' })
  @IsOptional()
  @IsString()
  note?: string;
}
