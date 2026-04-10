import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ description: 'Message content', maxLength: 4000 })
  @IsString()
  @MaxLength(4000)
  content!: string;
}
