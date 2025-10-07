import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TranslatedTextDto } from 'src/common/dto/translated-text.dto';
import { GeoLocationDto } from 'src/common/dto/geoLocation.dto';

export type TourTransportDocument = TourTransport & Document;

class RouteStop {
  @Prop({ type: Object, required: true })
  location: GeoLocationDto;

  @Prop({ type: Object })
  description: TranslatedTextDto;

  @Prop()
  imageUrl?: string;

  @Prop()
  imageId?: string;

  @Prop()
  stopTime?: string;
}

class ItineraryDay {
  @Prop({ required: true })
  day: number;

  @Prop({ type: Object })
  title: TranslatedTextDto;

  @Prop({ type: Object })
  description: TranslatedTextDto;

  @Prop()
  imageUrl: string;

  @Prop()
  imageId: string;

  @Prop({ type: [RouteStop], default: [] })
  route?: RouteStop[];
}

@Schema({ timestamps: true })
export class TourTransport {
  @Prop({ type: Object })
  title: TranslatedTextDto;

  @Prop({ type: Object })
  description: TranslatedTextDto;

  @Prop({ type: Object })
  termsAndConditions: TranslatedTextDto;

  @Prop({ type: Object, required: true })
  origin: GeoLocationDto;

  @Prop({ type: Object, required: true })
  destination: GeoLocationDto;

  @Prop({ type: [Object], default: [] })
  intermediateStops: GeoLocationDto[];

  @Prop({
    type: [String],
    enum: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ],
  })
  availableDays: string[];

  @Prop()
  departureTime: string;

  @Prop()
  arrivalTime: string;

  @Prop()
  durationInHours: number;

  @Prop()
  duration: string;

  // 💰 Precio actual
  @Prop()
  price: number;

  // 💵 Precio anterior (para descuentos/promociones)
  @Prop()
  oldPrice?: number;

  @Prop()
  rating: number;

  @Prop()
  vehicleId: Types.ObjectId;

  @Prop()
  routeCode: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  slug: string;

  @Prop({ type: [ItineraryDay], default: [] })
  itinerary: ItineraryDay[];

  @Prop()
  imageUrl: string;

  @Prop()
  imageId: string;

  @Prop({ default: false })
  isFeatured: boolean;

  // 🚍 Tipo de servicio (solo: basic o privatePremium)
  @Prop({
    type: String,
    enum: ['basic', 'privatePremium'],
    default: 'basic',
  })
  serviceType: string;

  // 💰 Precio adicional opcional según tipo de servicio
  @Prop()
  servicePrice?: number;
}

export const TourTransportSchema = SchemaFactory.createForClass(TourTransport);
