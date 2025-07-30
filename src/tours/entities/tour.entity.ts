import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TourDocument = Tour & Document;

export enum TourCategory {
  Aventura = 'Aventura',
  Cultural = 'Cultural',
  Relajacion = 'Relajación',
  Naturaleza = 'Naturaleza',
  Trekking = 'Trekking',
  Panoramico = 'Panoramico',
  TransporteTuristico = 'Transporte Turistico',
}

export enum PackageType {
  Basico = 'Basico',
  Premium = 'Premium',
}

@Schema()
class RoutePoint {
  @Prop({ type: Object, required: true })
  location: Record<string, string>;

  @Prop({ type: Object })
  description?: Record<string, string>;

  @Prop()
  imageId?: string;

  @Prop()
  imageUrl?: string;
}

const RoutePointSchema = SchemaFactory.createForClass(RoutePoint);

@Schema()
class ItineraryDay {
  @Prop({ required: true })
  day: number;

  @Prop({ type: Object, required: true })
  title: Record<string, string>;

  @Prop({ type: Object, required: true })
  description: Record<string, string>;

  @Prop({ type: [Object], default: [] })
  activities: Record<string, string>[]; // ✅ Ahora multilenguaje

  @Prop([String])
  meals?: string[];

  @Prop()
  accommodation?: string;

  @Prop()
  imageId?: string;

  @Prop()
  imageUrl?: string;

  @Prop({ type: [RoutePointSchema], default: [] })
  route: RoutePoint[];
}

const ItineraryDaySchema = SchemaFactory.createForClass(ItineraryDay);

@Schema({ timestamps: true })
export class Tour {
  @Prop({ type: Object, required: true })
  title: Record<string, string>;

  @Prop({ type: Object, required: true })
  subtitle: Record<string, string>;

  @Prop({ required: true })
  imageUrl: string;

  @Prop()
  imageId?: string;

  @Prop({ required: true })
  price: number;

  @Prop()
  originalPrice?: number;

  @Prop({ type: Object, required: true })
  duration: Record<string, string>; // ahora traducible

  @Prop({ required: true })
  rating: number;

  @Prop({ required: true })
  reviews: number;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  region: string;

  @Prop({ required: true, enum: TourCategory })
  category: TourCategory;

  @Prop({ required: true, enum: ['Facil', 'Moderado', 'Dificil'] })
  difficulty: string;

  @Prop({ required: true, enum: PackageType })
  packageType: PackageType;

  @Prop({ type: [Object] })
  highlights: Record<string, string>[];

  @Prop()
  featured?: boolean;

  @Prop({ type: [Types.ObjectId], ref: 'Transport', default: [] })
  transportOptionIds: Types.ObjectId[];

  @Prop({ type: [ItineraryDaySchema], default: [] })
  itinerary: ItineraryDay[];

  @Prop({ type: [Object] })
  includes?: Record<string, string>[];

  @Prop({ type: [Object] })
  notIncludes?: Record<string, string>[];

  @Prop({ type: [Object] })
  toBring?: Record<string, string>[];

  @Prop({ type: [Object] })
  conditions?: Record<string, string>[];

  @Prop({ required: true, unique: true })
  slug: string;
}

export const TourSchema = SchemaFactory.createForClass(Tour);
