import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateConsultationDto {
  @IsUUID()
  leadId!: string;

  @IsOptional()
  @IsUUID()
  staffId?: string;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsString()
  outcome?: string;

  @IsOptional()
  @IsString()
  followUpNote?: string;

  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
