import { Module } from '@nestjs/common';
import { TourTransportService } from './tour-transport.service';
import { TourTransportController } from './tour-transport.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  TourTransport,
  TourTransportSchema,
} from './entities/tour-transport.entity';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TourTransport.name, schema: TourTransportSchema },
    ]),
  ],
  controllers: [TourTransportController],
  providers: [TourTransportService],
})
export class TourTransportModule {}
