import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OfferDocument = Offer & Document;

@Schema({ timestamps: true })
export class Offer {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ required: true, min: 0, max: 100 })
  discountPercentage: number;

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date, required: true })
  endDate: Date;

  // Ahora por ID (relación real con Tour)
  @Prop({ type: [Types.ObjectId], ref: 'Tour', default: [] })
  applicableTours: Types.ObjectId[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ unique: true, sparse: true }) // Código manual tipo "INTIRAYMI2025"
  discountCode?: string;
}

export const OfferSchema = SchemaFactory.createForClass(Offer);
