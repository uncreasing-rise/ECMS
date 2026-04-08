import {
  IsUUID,
  IsDecimal,
  IsDateString,
  IsString,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateInvoiceDto {
  @IsUUID()
  @IsOptional()
  enrollment_id?: string;

  @IsDecimal({ decimal_digits: '1,2' })
  @Min(0)
  amount: number;

  @IsDateString()
  @IsOptional()
  due_date?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
