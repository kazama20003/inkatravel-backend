import { IsOptional, IsString } from 'class-validator';

export class TranslatedTextDto {
  @IsOptional()
  @IsString()
  es?: string;

  @IsOptional()
  @IsString()
  en?: string;

  @IsOptional()
  @IsString()
  fr?: string;

  @IsOptional()
  @IsString()
  de?: string;

  @IsOptional()
  @IsString()
  it?: string; // Italiano
}
