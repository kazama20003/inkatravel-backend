import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { OrdersModule } from 'src/orders/orders.module';
import { UsersModule } from 'src/users/users.module';
import { ToursModule } from 'src/tours/tours.module';

@Module({
  imports: [OrdersModule, UsersModule, ToursModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
