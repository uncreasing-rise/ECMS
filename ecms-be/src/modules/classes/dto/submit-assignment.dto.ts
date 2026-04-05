import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class SubmitAssignmentDto {
  @ApiPropertyOptional({ example: 'Bài làm phần reading của em...' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/submissions/student-a1.pdf',
  })
  @IsOptional()
  @IsUrl()
  file_url?: string;
}
