import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as dayjs from 'dayjs';

import { Order, OrderDocument } from '../orders/entities/order.entity';
import { User, UserDocument } from 'src/users/entities/user.entity';
import { Tour, TourDocument } from '../tours/entities/tour.entity';

export type ActivityItemType = 'Reserva' | 'Cliente';

export interface ActivityItem {
  type: ActivityItemType;
  message: string;
  date: Date;
}

interface PopulatedOrderItem {
  tour?: Tour | null;
  people: number;
  startDate: Date;
  pricePerPerson: number;
  total: number;
}

interface PopulatedOrder {
  customer?: { fullName: string };
  items: PopulatedOrderItem[];
  createdAt: Date;
}

interface LeanUser {
  fullName: string;
  email: string;
  createdAt: Date;
}

// En dashboard.service.ts
export interface DashboardSummary {
  stats: {
    ordersThisMonth: number;
    usersThisMonth: number;
    totalOrders: number;
    totalUsers: number;
    totalTours: number;
    activeCustomers: number;
  };
  monthlyIncome: { month: string; total: number }[];
  activity: ActivityItem[];
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Tour.name) private readonly tourModel: Model<TourDocument>,
  ) {}

  async getDashboardData(): Promise<DashboardSummary> {
    const now = dayjs();
    const startOfMonth = now.startOf('month').toDate();
    const endOfMonth = now.endOf('month').toDate();

    const [
      ordersThisMonth,
      usersThisMonth,
      totalOrders,
      totalUsers,
      totalTours,
    ] = await Promise.all([
      this.orderModel.countDocuments({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      }),
      this.userModel.countDocuments({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      }),
      this.orderModel.countDocuments(),
      this.userModel.countDocuments(),
      this.tourModel.countDocuments(),
    ]);

    const activeCustomerIdsRaw = await this.orderModel.distinct('user');
    const activeCustomers = activeCustomerIdsRaw.length;

    const monthlyIncome: { month: string; total: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const month = now.subtract(i, 'month');
      const start = month.startOf('month').toDate();
      const end = month.endOf('month').toDate();

      const income = await this.orderModel.aggregate<{ total: number }>([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]);

      monthlyIncome.push({
        month: month.format('MMMM'),
        total: income[0]?.total ?? 0,
      });
    }

    const recentOrders = await this.orderModel
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('items.tour')
      .populate('customer')
      .lean<PopulatedOrder[]>();

    const recentUsers = await this.userModel
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean<LeanUser[]>();

    const activity: ActivityItem[] = [
      ...recentOrders.map((order): ActivityItem => {
        const customerName = order.customer?.fullName ?? 'Cliente desconocido';
        const tourTitle =
          order.items?.[0]?.tour?.title ?? 'Paquete no especificado';
        return {
          type: 'Reserva',
          message: `Nueva reserva confirmada para ${customerName} - Paquete: ${tourTitle}`,
          date: order.createdAt,
        };
      }),
      ...recentUsers.map(
        (user): ActivityItem => ({
          type: 'Cliente',
          message: `Nuevo cliente registrado: ${user.fullName} - ${user.email}`,
          date: user.createdAt,
        }),
      ),
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    return {
      stats: {
        ordersThisMonth,
        usersThisMonth,
        totalOrders,
        totalUsers,
        totalTours,
        activeCustomers,
      },
      monthlyIncome,
      activity,
    };
  }
}
