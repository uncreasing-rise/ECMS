import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ example: 'IELTS Foundation' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Lộ trình nền tảng cho IELTS' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'A1' })
  @IsString()
  level: string;

  @ApiProperty({ example: 24 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  total_sessions: number;

  @ApiProperty({ example: 4800000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
