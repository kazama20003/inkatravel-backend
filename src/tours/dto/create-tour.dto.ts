import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TourCategory } from '../entities/tour.entity';

// Enums
export enum Difficulty {
  Fácil = 'Facil',
  Moderado = 'Moderado',
  Difícil = 'Difícil',
}

export enum PackageType {
  Basico = 'Basico',
  Premium = 'Premium',
}

// Subschemas DTOs

export class RoutePointDto {
  @IsString()
  @IsNotEmpty()
  location: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageId?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class ItineraryDayDto {
  @IsNumber()
  @Min(1)
  day: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @IsString({ each: true })
  activities: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  meals?: string[];

  @IsOptional()
  @IsString()
  accommodation?: string;

  @IsOptional()
  @IsString()
  imageId?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RoutePointDto)
  @IsArray()
  route: RoutePointDto[];
}

// DTO principal

export class CreateTourDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  subtitle: string;

  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @IsOptional()
  @IsString()
  imageId?: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsOptional()
  @IsNumber()
  originalPrice?: number;

  @IsString()
  @IsNotEmpty()
  duration: string;

  @IsNumber()
  @Min(0)
  rating: number;

  @IsNumber()
  @Min(0)
  reviews: number;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsNotEmpty()
  region: string;

  @IsEnum(TourCategory)
  category: TourCategory;

  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @IsEnum(PackageType)
  packageType: PackageType;

  @IsArray()
  @IsString({ each: true })
  highlights: string[];

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  transportOptionIds?: string[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ItineraryDayDto)
  @IsArray()
  itinerary?: ItineraryDayDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notIncludes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  toBring?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  conditions?: string[];

  @IsString()
  @IsNotEmpty()
  slug: string;
}
