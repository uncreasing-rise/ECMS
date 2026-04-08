import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class AttendanceItemDto {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000005' })
  @IsUUID()
  student_id!: string;

  @ApiProperty({
    example: 'present',
    enum: ['present', 'absent', 'late', 'excused'],
  })
  @IsString()
  @IsIn(['present', 'absent', 'late', 'excused'])
  status!: string;

  @ApiProperty({ example: 'Đến trễ 5 phút', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}

export class ClassRecordAttendanceDto {
  @ApiProperty({ type: [AttendanceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceItemDto)
  records!: AttendanceItemDto[];
}
