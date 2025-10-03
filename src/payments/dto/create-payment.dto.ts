import { IsNumber } from 'class-validator';
import { IsString, IsIn, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CustomerInfoDto } from 'src/orders/dto/create-order.dto';
export class CreatePaymentDto {
  @IsNumber()
  amount: number;

  @IsString()
  currency: string;

  @IsString()
  orderId: string;

  @IsIn(['PAID'])
  formAction: 'PAID';

  @IsOptional()
  @IsString()
  contextMode?: 'TEST' | 'PRODUCTION';

  @ValidateNested()
  @Type(() => CustomerInfoDto)
  customer: CustomerInfoDto;
}
