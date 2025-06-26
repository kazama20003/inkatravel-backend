import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

class CartItemDto {
  @IsNotEmpty()
  tour: string; // el populate validará si es ObjectId

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
