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
  productId: string;

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

  // Campos denormalizados opcionales
  @IsOptional()
  @IsString()
  productTitle?: string;

  @IsOptional()
  @IsString()
  productImageUrl?: string;

  @IsOptional()
  @IsString()
  productSlug?: string;
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
  @Min(0)
  totalPrice: number;
}
