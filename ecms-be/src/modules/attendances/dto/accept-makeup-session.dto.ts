import { IsNotEmpty, IsUUID } from 'class-validator';

export class AcceptMakeupSessionDto {
  @IsUUID()
  @IsNotEmpty()
  student_id!: string;

  @IsUUID()
  @IsNotEmpty()
  original_session_id!: string;

  @IsUUID()
  @IsNotEmpty()
  makeup_session_id!: string;
}
