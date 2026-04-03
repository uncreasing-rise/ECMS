import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAuditLogDto {
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @IsString()
  module!: string;

  @IsString()
  action!: string;

  @IsOptional()
  @IsUUID()
  targetId?: string;

  @IsOptional()
  @IsString()
  targetType?: string;

  @IsOptional()
  before?: Record<string, any>;

  @IsOptional()
  after?: Record<string, any>;
}
