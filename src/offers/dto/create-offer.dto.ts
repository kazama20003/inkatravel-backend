import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateOfferDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  // Ahora se espera IDs de tours válidos
  @IsArray()
  @IsMongoId({ each: true })
  applicableTours: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  discountCode?: string;
}
