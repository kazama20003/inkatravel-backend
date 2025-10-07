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
  location: GeoLocationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TranslatedTextDto)
  description?: TranslatedTextDto;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  imageId?: string;

  @IsOptional()
  @IsString()
  stopTime?: string; // Ejemplo: "10:30 AM"
}

export class ItineraryDayDto {
  @IsNumber()
  day: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => TranslatedTextDto)
  title?: TranslatedTextDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TranslatedTextDto)
  description?: TranslatedTextDto;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  imageId?: string;

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
  title: TranslatedTextDto;

  @ValidateNested()
  @Type(() => TranslatedTextDto)
  description: TranslatedTextDto;

  @ValidateNested()
  @Type(() => TranslatedTextDto)
  termsAndConditions: TranslatedTextDto;

  @ValidateNested()
  @Type(() => GeoLocationDto)
  origin: GeoLocationDto;

  @ValidateNested()
  @Type(() => GeoLocationDto)
  destination: GeoLocationDto;

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
  availableDays: string[];

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
  duration?: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  oldPrice?: number;

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

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsEnum(['basic', 'privatePremium'])
  serviceType?: string;

  @IsOptional()
  @IsNumber()
  servicePrice?: number;
}
