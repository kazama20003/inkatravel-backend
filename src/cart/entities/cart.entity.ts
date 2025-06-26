import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CartDocument = Cart & Document;

@Schema()
export class CartItem {
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

const CartItemSchema = SchemaFactory.createForClass(CartItem);

@Schema({ timestamps: true })
export class Cart {
  @Prop({ type: Types.ObjectId, ref: 'User', required: false }) // o Customer
  userId?: Types.ObjectId;

  @Prop({ type: [CartItemSchema], default: [] })
  items: CartItem[];

  @Prop({ default: 0 })
  totalPrice: number;

  @Prop({ default: false })
  isOrdered: boolean;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
