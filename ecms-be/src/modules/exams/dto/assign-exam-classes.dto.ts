import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class AssignExamClassesDto {
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => String)
  @IsUUID(undefined, { each: true })
  class_ids!: string[];
}
