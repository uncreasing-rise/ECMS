import { IsString } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  name!: string;

  @IsString()
  category!: string;

  @IsString()
  action!: string;
}
