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

export class RouteStopDto {
  @ValidateNested()
  @Type(() => TranslatedTextDto)
  location: TranslatedTextDto;

  @ValidateNested()
  @Type(() => TranslatedTextDto)
  description: TranslatedTextDto;

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
  title: TranslatedTextDto;

  @ValidateNested()
  @Type(() => TranslatedTextDto)
  description: TranslatedTextDto;

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

  @IsString()
  originCity: string;

  @IsString()
  destinationCity: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  intermediateStops?: string[];

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
  duration?: string; // Ej: "6 Horas"

  @IsNumber()
  price: number;

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
}
