import { IsEmail, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateLeadDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsNumber()
  score?: number;

  @IsOptional()
  @IsUUID()
  ownerId?: string;
}
