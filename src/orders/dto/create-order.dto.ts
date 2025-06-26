// create-order.dto.ts

import {
  IsArray,
  IsEmail,
  IsNotEmpty,
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

class CustomerInfoDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  nationality?: string;
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
