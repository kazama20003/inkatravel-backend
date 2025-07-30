import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CartDocument = Cart & Document;

export enum CartItemType {
  Tour = 'Tour',
  Transport = 'TourTransport',
}

@Schema()
export class CartItem {
  @Prop({ required: true, enum: CartItemType })
  productType: CartItemType;

  @Prop({ type: Types.ObjectId, required: true, refPath: 'items.productType' })
  productId: Types.ObjectId;

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

const CartItemSchema = SchemaFactory.createForClass(CartItem);

@Schema({ timestamps: true })
export class Cart {
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  userId?: Types.ObjectId;

  @Prop({ type: [CartItemSchema], default: [] })
  items: CartItem[];

  @Prop({ default: 0 })
  totalPrice: number;

  @Prop({ default: false })
  isOrdered: boolean;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
