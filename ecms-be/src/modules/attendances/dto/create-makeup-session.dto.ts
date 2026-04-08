import { IsUUID, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateMakeupSessionDto {
  @IsUUID()
  original_student_id: string; // Student who missed the session

  @IsUUID()
  original_session_id: string; // Session that was missed

  @IsUUID()
  makeup_session_id: string; // New session to attend as makeup

  @IsString()
  @IsOptional()
  note?: string;
}
