import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class UpdateStudentStatusDto {
  @ApiProperty({
    example: 'active',
    enum: ['active', 'inactive', 'on_hold', 'graduated'],
  })
  @IsString()
  @IsIn(['active', 'inactive', 'on_hold', 'graduated'])
  status!: string;
}
