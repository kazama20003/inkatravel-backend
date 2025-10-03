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

  @Prop()
  price: number;

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

  // 👇 Nuevo campo para transportes destacados
  @Prop({ default: false })
  isFeatured: boolean;
}

export const TourTransportSchema = SchemaFactory.createForClass(TourTransport);
