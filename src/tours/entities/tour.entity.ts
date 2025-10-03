import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TranslatedTextDto } from 'src/common/dto/translated-text.dto';

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
export class RoutePoint {
  @Prop({ type: TranslatedTextDto, required: true })
  location: TranslatedTextDto;

  @Prop({ type: TranslatedTextDto })
  description?: TranslatedTextDto;

  @Prop()
  imageId?: string;

  @Prop()
  imageUrl?: string;
}
const RoutePointSchema = SchemaFactory.createForClass(RoutePoint);

@Schema()
export class ItineraryDay {
  @Prop({ required: true })
  day: number;

  @Prop({ type: TranslatedTextDto, required: true })
  title: TranslatedTextDto;

  @Prop({ type: TranslatedTextDto, required: true })
  description: TranslatedTextDto;

  @Prop({ type: [TranslatedTextDto], default: [] })
  activities: TranslatedTextDto[];

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
  @Prop({ type: TranslatedTextDto, required: true })
  title: TranslatedTextDto;

  @Prop({ type: TranslatedTextDto, required: true })
  subtitle: TranslatedTextDto;

  @Prop({ required: true })
  imageUrl: string;

  @Prop()
  imageId?: string;

  @Prop({ required: true })
  price: number;

  @Prop()
  originalPrice?: number;

  @Prop({ type: TranslatedTextDto, required: true })
  duration: TranslatedTextDto;

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

  @Prop({ type: [TranslatedTextDto] })
  highlights: TranslatedTextDto[];

  @Prop()
  featured?: boolean;

  @Prop({ type: [Types.ObjectId], ref: 'Transport', default: [] })
  transportOptionIds: Types.ObjectId[];

  @Prop({ type: [ItineraryDaySchema], default: [] })
  itinerary: ItineraryDay[];

  @Prop({ type: [TranslatedTextDto] })
  includes?: TranslatedTextDto[];

  @Prop({ type: [TranslatedTextDto] })
  notIncludes?: TranslatedTextDto[];

  @Prop({ type: [TranslatedTextDto] })
  toBring?: TranslatedTextDto[];

  @Prop({ type: [TranslatedTextDto] })
  conditions?: TranslatedTextDto[];

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ required: true })
  startTime: string; // Ejemplo: "08:00 AM"
}

export const TourSchema = SchemaFactory.createForClass(Tour);
