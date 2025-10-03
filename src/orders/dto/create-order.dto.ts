// create-order.dto.ts

import {
  IsArray,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsMongoId, IsDateString } from 'class-validator';

class OrderItemDto {
  @IsMongoId()
  tour: string;

  @IsDateString()
  startDate: string;

  @IsNumber()
  @Min(1)
  people: number;

  @IsNumber()
  pricePerPerson: number;

  @IsNumber()
  total: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
export class CustomerInfoDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  identityType?: string;

  @IsOptional()
  @IsString()
  identityCode?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  // si quieres mantener compatibilidad
  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsString()
  fullName?: string;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ValidateNested()
  @Type(() => CustomerInfoDto)
  customer: CustomerInfoDto;

  @IsNumber()
  @Min(0)
  totalPrice: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  discountCodeUsed?: string;

  @IsOptional()
  @IsMongoId()
  user?: string;
}
