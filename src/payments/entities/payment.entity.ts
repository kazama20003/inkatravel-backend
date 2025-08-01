import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ required: true })
  uuid: string;

  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true })
  status: string;

  @Prop({ required: false })
  amount?: number;

  @Prop({ required: false })
  currency?: string;

  @Prop({ required: false })
  customerEmail?: string;

  @Prop({ required: false })
  ipnUrl?: string;

  @Prop({ type: Object }) // guarda toda la respuesta del callback
  fullAnswerRaw?: any;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
