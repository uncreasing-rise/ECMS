import {
  IsUUID,
  IsDecimal,
  IsDateString,
  IsString,
  IsOptional,
  Min,
} from 'class-validator';

export class CreatePaymentDto {
  @IsUUID()
  invoice_id: string;

  @IsDecimal({ decimal_digits: '1,2' })
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  method?: string; // 'cash', 'bank', 'check', etc.

  @IsString()
  @IsOptional()
  note?: string;
}
