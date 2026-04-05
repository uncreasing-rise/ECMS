import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateClassResourceDto {
  @ApiProperty({ example: 'Unit 1 Vocabulary PDF' })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiProperty({ example: 'https://cdn.example.com/docs/unit-1-vocab.pdf' })
  @IsUrl()
  file_url!: string;

  @ApiPropertyOptional({ example: 'Tài liệu từ vựng tuần 1' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'unit-1-vocab.pdf' })
  @IsOptional()
  @IsString()
  file_name?: string;

  @ApiPropertyOptional({ example: 'pdf' })
  @IsOptional()
  @IsString()
  file_type?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_public?: boolean;

  @ApiPropertyOptional({ example: ['vocabulary', 'week1'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
