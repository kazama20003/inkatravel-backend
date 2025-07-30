import {
  IsString,
  IsIn,
  IsArray,
  ValidateNested,
  IsNumberString,
  IsNumber,
  IsEmail,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

class PaymentFormDto {
  @IsIn(['card'])
  type: string;

  @IsString()
  pan: string; // Antes: cardNumber

  @IsString()
  cardScheme: string;

  @IsNumberString()
  expiryMonth: string;

  @IsNumberString()
  expiryYear: string;

  @IsString()
  securityCode: string;

  @IsOptional()
  @IsString()
  paymentMeanBrand?: string;

  @IsOptional()
  @IsString()
  paymentMethodToken?: string;
}

class CustomerDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  billingFirstName?: string;

  @IsOptional()
  @IsString()
  billingLastName?: string;
}

export class CreatePaymentDto {
  @IsNumber()
  amount: number;

  @IsString()
  currency: string;

  @IsString()
  orderId: string;

  @ValidateNested()
  @Type(() => CustomerDto)
  customer: CustomerDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentFormDto)
  paymentForms: PaymentFormDto[];

  @IsString()
  formAction: string;

  @IsOptional()
  @IsString()
  contextMode?: 'TEST' | 'PRODUCTION';
}
