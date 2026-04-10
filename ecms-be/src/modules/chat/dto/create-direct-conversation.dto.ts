import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateDirectConversationDto {
  @ApiProperty({ description: 'User ID of the other participant' })
  @IsUUID()
  peer_user_id!: string;
}
