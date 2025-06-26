import { Module } from '@nestjs/common';
import { ToursService } from './tours.service';
import { ToursController } from './tours.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Tour, TourSchema } from './entities/tour.entity';
import {
  Transport,
  TransportSchema,
} from '../transport/entities/transport.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tour.name, schema: TourSchema },
      { name: Transport.name, schema: TransportSchema },
    ]),
  ],
  controllers: [ToursController],
  providers: [ToursService],
  exports: [
    MongooseModule, // ✅ Esto permite que otros módulos usen TourModel y TransportModel
  ],
})
export class ToursModule {}
