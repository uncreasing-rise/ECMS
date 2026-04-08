import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class LogViolationDto {
  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;
}
