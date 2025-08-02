import { CreateOrderDto } from 'src/orders/dto/create-order.dto';
import { IsString, IsIn, IsOptional, IsNumber } from 'class-validator';

export class CreatePaymentDto extends CreateOrderDto {
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
}
