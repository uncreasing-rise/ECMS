import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class SubmitAssignmentDto {
  @ApiPropertyOptional({ example: 'Đây là nội dung bài làm của em...' })
  @IsOptional()
  @IsString()
  submission_text?: string;

  @ApiPropertyOptional({ example: 'https://drive.google.com/file/d/xxx/view' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  submission_link?: string;

  @ApiPropertyOptional({
    example: ['https://cdn.example.com/submission-1.pdf'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  files?: string[];
}
