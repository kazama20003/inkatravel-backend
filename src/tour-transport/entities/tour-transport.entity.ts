import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TranslatedTextDto } from 'src/common/dto/translated-text.dto';

export type TourTransportDocument = TourTransport & Document;

class RouteStop {
  @Prop({ type: Object })
  location: TranslatedTextDto;

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

  @Prop({ required: true })
  originCity: string;

  @Prop({ required: true })
  destinationCity: string;

  @Prop({ type: [String], default: [] })
  intermediateStops: string[];

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
}

export const TourTransportSchema = SchemaFactory.createForClass(TourTransport);
