import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

export enum PaymentStatus {
  Pending = 'pending',
  Paid = 'paid',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ required: true })
  amount: number; // en centavos (ej. S/.10.00 => 1000)

  @Prop({ required: true })
  customerEmail: string;

  @Prop({ required: true })
  customerName: string;

  @Prop({ enum: PaymentStatus, default: PaymentStatus.Pending })
  status: PaymentStatus;

  @Prop()
  izipayTransactionId?: string;

  @Prop()
  paymentMethod?: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
