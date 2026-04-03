import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateInvoiceDto {
  @IsOptional()
  @IsUUID()
  enrollment_id?: string;

  @IsUUID()
  student_id: string;

  @IsOptional()
  @IsUUID()
  branch_id?: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsUUID()
  promotion_id?: string;

  @IsString()
  status: string;
}
