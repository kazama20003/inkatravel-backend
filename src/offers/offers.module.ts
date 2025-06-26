import { Module } from '@nestjs/common';
import { OffersService } from './offers.service';
import { OffersController } from './offers.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { OfferSchema } from './entities/offer.entity';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Offer', schema: OfferSchema }]),
  ],
  controllers: [OffersController],
  providers: [OffersService],
})
export class OffersModule {}
