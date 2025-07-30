import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TranslatedTextDto } from 'src/common/dto/translated-text.dto';
import { TourCategory, PackageType } from '../entities/tour.entity';

export enum Difficulty {
  Fácil = 'Facil',
  Moderado = 'Moderado',
  Difícil = 'Dificil',
}

class RoutePointDto {
  @ValidateNested()
  @Type(() => TranslatedTextDto)
  location: TranslatedTextDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TranslatedTextDto)
  description?: TranslatedTextDto;

  @IsOptional()
  @IsString()
  imageId?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

class ItineraryDayDto {
  @IsNumber()
  day: number;

  @ValidateNested()
  @Type(() => TranslatedTextDto)
  title: TranslatedTextDto;

  @ValidateNested()
  @Type(() => TranslatedTextDto)
  description: TranslatedTextDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslatedTextDto)
  activities: TranslatedTextDto[]; // ✅ ahora multilingüe

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoutePointDto)
  route: RoutePointDto[];
}

export class CreateTourDto {
  @ValidateNested()
  @Type(() => TranslatedTextDto)
  title: TranslatedTextDto;

  @ValidateNested()
  @Type(() => TranslatedTextDto)
  subtitle: TranslatedTextDto;

  @IsString()
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

  @ValidateNested()
  @Type(() => TranslatedTextDto)
  duration: TranslatedTextDto;

  @IsNumber()
  rating: number;

  @IsNumber()
  reviews: number;

  @IsString()
  location: string;

  @IsString()
  region: string;

  @IsEnum(TourCategory)
  category: TourCategory;

  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @IsEnum(PackageType)
  packageType: PackageType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslatedTextDto)
  highlights: TranslatedTextDto[];

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  transportOptionIds?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItineraryDayDto)
  itinerary: ItineraryDayDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslatedTextDto)
  includes?: TranslatedTextDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslatedTextDto)
  notIncludes?: TranslatedTextDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslatedTextDto)
  toBring?: TranslatedTextDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslatedTextDto)
  conditions?: TranslatedTextDto[];

  @IsString()
  slug: string;
}
