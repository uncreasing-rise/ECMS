import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateMessageStatusDto {
  @ApiPropertyOptional({
    description: 'Latest message id client has delivered/read in this conversation',
  })
  @IsOptional()
  @IsUUID()
  message_id?: string;
}
