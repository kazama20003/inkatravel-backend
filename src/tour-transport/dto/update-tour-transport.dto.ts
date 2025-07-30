import { PartialType } from '@nestjs/swagger';
import { CreateTourTransportDto } from './create-tour-transport.dto';

export class UpdateTourTransportDto extends PartialType(
  CreateTourTransportDto,
) {}
