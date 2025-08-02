import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order, OrderSchema } from './entities/order.entity';
import { Offer, OfferSchema } from 'src/offers/entities/offer.entity';
import { ToursModule } from 'src/tours/tours.module';
import { CartModule } from 'src/cart/cart.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Offer.name, schema: OfferSchema },
    ]),
    ToursModule,
    forwardRef(() => CartModule), // 🔁 relación circular
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService], // 👈 necesitas exportarlo si lo usas en otros módulos
})
export class OrdersModule {}
