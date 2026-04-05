import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class EnrollStudentDto {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000005' })
  @IsUUID()
  student_id: string;

  @ApiPropertyOptional({ example: 'active' })
  @IsOptional()
  @IsString()
  status?: string;
}
