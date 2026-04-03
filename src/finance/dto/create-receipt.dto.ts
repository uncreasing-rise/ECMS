import { IsDateString, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateReceiptDto {
  @IsUUID()
  invoice_id: string;

  @IsNumber()
  amount_paid: number;

  @IsString()
  method: string;

  @IsOptional()
  @IsDateString()
  paid_at?: string;

  @IsOptional()
  @IsUUID()
  cashier_id?: string;
}
