import { Module, forwardRef } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CartSchema } from './entities/cart.entity';
import { OrdersModule } from 'src/orders/orders.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Cart', schema: CartSchema }]),
    forwardRef(() => OrdersModule), // ✅ Importas el módulo, no el servicio
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService], // opcional: si otro módulo usará CartService
})
export class CartModule {}
