import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Difficulty } from '../create-tour.dto';
import { TourCategory } from 'src/tours/entities/tour.entity';
import { PackageType } from 'src/tours/entities/tour.entity';

export class FilterTourDto {
  @IsOptional()
  @IsEnum(TourCategory)
  category?: TourCategory;

  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @IsOptional()
  @IsEnum(PackageType)
  packageType?: PackageType;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  location?: string;
}
