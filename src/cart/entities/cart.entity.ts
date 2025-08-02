import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CartDocument = Cart & Document;

export enum CartItemType {
  Tour = 'Tour',
  Transport = 'TourTransport',
}

@Schema({ _id: false }) // Evita que cada CartItem tenga su propio _id si no es necesario
export class CartItem {
  @Prop({ required: true, enum: CartItemType })
  productType: CartItemType;

  @Prop({ type: Types.ObjectId, required: true, refPath: 'items.productType' })
  productId: Types.ObjectId;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true, min: 1 })
  people: number;

  @Prop({ required: true })
  pricePerPerson: number;

  @Prop({ required: true })
  total: number;

  @Prop()
  notes?: string;

  // ✅ Campos denormalizados
  @Prop()
  productTitle?: string;

  @Prop()
  productImageUrl?: string;

  @Prop()
  productSlug?: string;
}

const CartItemSchema = SchemaFactory.createForClass(CartItem);

@Schema({ timestamps: true })
export class Cart {
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  userId?: Types.ObjectId;

  @Prop({ type: [CartItemSchema], default: [] })
  items: CartItem[];

  @Prop({ required: true, default: 0 })
  totalPrice: number;

  @Prop({ default: false })
  isOrdered: boolean;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
