import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TranslatedTextDto } from 'src/common/dto/translated-text.dto';
import { GeoLocationDto } from 'src/common/dto/geoLocation.dto';

/* ---------- Subdocs ---------- */
export class RouteStopDto {
  @ValidateNested()
  @Type(() => GeoLocationDto)
  location: GeoLocationDto; // ✅ requerido

  @ValidateNested()
  @Type(() => TranslatedTextDto)
  description: TranslatedTextDto; // ✅ requerido

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  imageId?: string;

  @IsOptional()
  @IsString()
  stopTime?: string; // Ej: "10:30 AM"
}

export class ItineraryDayDto {
  @IsNumber()
  day: number;

  @ValidateNested()
  @Type(() => TranslatedTextDto)
  title: TranslatedTextDto; // ✅ requerido

  @ValidateNested()
  @Type(() => TranslatedTextDto)
  description: TranslatedTextDto; // ✅ requerido

  @IsString()
  imageUrl: string; // ✅ requerido

  @IsString()
  imageId: string; // ✅ requerido

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RouteStopDto)
  route?: RouteStopDto[];
}

/* ---------- Main DTO ---------- */
export class CreateTourTransportDto {
  @ValidateNested()
  @Type(() => TranslatedTextDto)
  title: TranslatedTextDto; // ✅ requerido

  @ValidateNested()
  @Type(() => TranslatedTextDto)
  description: TranslatedTextDto; // ✅ requerido

  @ValidateNested()
  @Type(() => TranslatedTextDto)
  termsAndConditions: TranslatedTextDto; // ✅ requerido

  @ValidateNested()
  @Type(() => GeoLocationDto)
  origin: GeoLocationDto; // ✅ requerido

  @ValidateNested()
  @Type(() => GeoLocationDto)
  destination: GeoLocationDto; // ✅ requerido

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GeoLocationDto)
  intermediateStops?: GeoLocationDto[];

  @IsArray()
  @IsEnum(
    [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ],
    { each: true },
  )
  availableDays: string[]; // ✅ requerido

  @IsOptional()
  @IsString()
  departureTime?: string;

  @IsOptional()
  @IsString()
  arrivalTime?: string;

  @IsOptional()
  @IsNumber()
  durationInHours?: number;

  @IsOptional()
  @IsString()
  duration?: string; // Ej: "6h"

  @IsNumber()
  price: number; // ✅ requerido

  @IsOptional()
  @IsNumber()
  rating?: number;

  @IsOptional()
  @IsMongoId()
  vehicleId?: string;

  @IsOptional()
  @IsString()
  routeCode?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItineraryDayDto)
  itinerary?: ItineraryDayDto[];

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  imageId?: string;
  // 👇 Nuevo campo
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;
}
