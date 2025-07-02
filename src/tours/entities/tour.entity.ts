import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TourDocument = Tour & Document;

export enum TourCategory {
  Aventura = 'Aventura',
  Cultural = 'Cultural',
  Relajacion = 'Relajación',
  Naturaleza = 'Naturaleza',
  Trekking = 'Trekking', // Aceptable, es común en turismo
  Panoramico = 'Panoramico',
  TransporteTuristico = 'Transporte Turistico',
}

export enum PackageType {
  Basico = 'Basico',
  Premium = 'Premium',
}

@Schema()
class RoutePoint {
  @Prop({ required: true })
  location: string;

  @Prop()
  description?: string;

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

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop([String])
  activities: string[];

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
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  subtitle: string;

  @Prop({ required: true })
  imageUrl: string;

  @Prop()
  imageId?: string;

  @Prop({ required: true })
  price: number;

  @Prop()
  originalPrice?: number;

  @Prop({ required: true })
  duration: string;

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

  @Prop([String])
  highlights: string[];

  @Prop()
  featured?: boolean;

  @Prop({ type: [Types.ObjectId], ref: 'Transport', default: [] })
  transportOptionIds: Types.ObjectId[];

  @Prop({ type: [ItineraryDaySchema], default: [] })
  itinerary: ItineraryDay[];

  @Prop([String])
  includes?: string[];

  @Prop([String])
  notIncludes?: string[];

  @Prop([String])
  toBring?: string[];

  @Prop([String])
  conditions?: string[];

  @Prop({ required: true, unique: true })
  slug: string;
}

export const TourSchema = SchemaFactory.createForClass(Tour);
