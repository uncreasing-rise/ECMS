import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateCourseDto {
  @ApiPropertyOptional({ example: 'IELTS Foundation - Updated' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Lộ trình nền tảng cho IELTS' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'A2' })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  total_sessions?: number;

  @ApiPropertyOptional({ example: 5200000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
