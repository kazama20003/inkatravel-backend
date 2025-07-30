import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum CartItemType {
  Tour = 'Tour',
  Transport = 'TourTransport',
}

class CartItemDto {
  @IsEnum(CartItemType)
  productType: CartItemType;

  @IsNotEmpty()
  @IsString()
  productId: string; // ID de Tour o TourTransport

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
  @IsNotEmpty()
  notes?: string;
}

export class CreateCartDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];

  @IsNumber()
  totalPrice: number;
}
