import { IsUUID, IsDecimal, IsString, IsOptional, Min } from 'class-validator';

export class CreateRefundDto {
  @IsUUID()
  invoice_id: string;

  @IsDecimal({ decimal_digits: '1,2' })
  @Min(0)
  amount: number;

  @IsString()
  reason: string; // 'student_request', 'error', 'policy', etc.

  @IsString()
  @IsOptional()
  note?: string;
}
