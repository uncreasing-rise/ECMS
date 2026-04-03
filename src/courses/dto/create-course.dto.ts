import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  name!: string;

  @IsString()
  level!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  status!: string;

  @IsInt()
  @Min(1)
  durationWeeks!: number;
}
