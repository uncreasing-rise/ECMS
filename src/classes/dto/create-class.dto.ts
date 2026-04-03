import { IsDateString, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateClassDto {
  @IsString()
  name!: string;

  @IsUUID()
  courseId!: string;

  @IsUUID()
  branchId!: string;

  @IsInt()
  capacity!: number;

  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsString()
  status!: string;
}
