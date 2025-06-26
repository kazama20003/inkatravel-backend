import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TransportDocument = Transport & Document;

export enum TransportType {
  Premium = 'Premium',
  Basico = 'Basico',
}

@Schema({ timestamps: true })
export class Transport {
  @Prop({ required: true, enum: TransportType })
  type: TransportType;

  @Prop({ required: true })
  vehicle: string;

  @Prop([String])
  services: string[];

  @Prop()
  imageUrl?: string;

  @Prop()
  imageId?: string;
}

export const TransportSchema = SchemaFactory.createForClass(Transport);
