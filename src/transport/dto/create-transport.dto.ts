import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { TransportType } from '../entities/transport.entity';

export class CreateTransportDto {
  @ApiProperty({
    enum: TransportType,
    example: 'Premium',
    description: 'Tipo de transporte (Premium o Basico)',
  })
  @IsEnum(TransportType)
  type: TransportType;

  @ApiProperty({
    example: 'Mercedes Sprinter',
    description: 'Nombre o modelo del vehículo',
  })
  @IsString()
  @IsNotEmpty()
  vehicle: string;

  @ApiProperty({
    example: ['Aire acondicionado', 'WiFi', 'Asientos reclinables'],
    description: 'Lista de servicios disponibles en el vehículo',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  services: string[];

  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/demo/image/upload/v123/transport.jpg',
    description: 'URL de la imagen del vehículo',
  })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiPropertyOptional({
    example: 'transport123imgid',
    description: 'ID interno de la imagen (por ejemplo, Cloudinary ID)',
  })
  @IsOptional()
  @IsString()
  imageId?: string;
}
