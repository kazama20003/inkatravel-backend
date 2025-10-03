import { IsNumber, IsOptional, IsString } from 'class-validator';

export class GeoLocationDto {
  @IsOptional()
  @IsString()
  name?: string; // Nombre único, no traducido

  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}
