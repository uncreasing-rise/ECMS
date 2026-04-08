import { IsUUID, IsString, IsOptional } from 'class-validator';

export class RecordAttendanceDto {
  @IsUUID()
  schedule_id!: string;

  @IsUUID()
  student_id!: string;

  @IsString()
  status!: string; // 'present', 'absent', 'excused', 'late'

  @IsString()
  @IsOptional()
  note?: string;
}
