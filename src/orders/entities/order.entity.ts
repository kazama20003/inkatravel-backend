// order.entity.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

export enum OrderStatus {
  Created = 'created',
  Confirmed = 'confirmed',
  Cancelled = 'cancelled',
  Completed = 'completed',
}

@Schema()
export class CustomerInfo {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  phone?: string;

  @Prop()
  nationality?: string;
}

const CustomerInfoSchema = SchemaFactory.createForClass(CustomerInfo);

@Schema()
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Tour', required: true })
  tour: Types.ObjectId;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  people: number;

  @Prop()
  notes?: string;

  @Prop({ required: true })
  pricePerPerson: number;

  @Prop({ required: true })
  total: number;
}

const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  @Prop({ type: CustomerInfoSchema, required: true })
  customer: CustomerInfo;

  @Prop({ required: true })
  totalPrice: number;

  @Prop({ enum: OrderStatus, default: OrderStatus.Created })
  status: OrderStatus;

  @Prop()
  paymentMethod?: string;

  @Prop()
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'Offer' })
  appliedOffer?: Types.ObjectId;

  @Prop()
  discountCodeUsed?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
