import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import {
  Tour,
  TourDocument,
  ItineraryDay,
  RoutePoint,
} from './entities/tour.entity';
import { PaginationDto } from 'src/common';

// 🔑 DTO multilanguage
export interface TranslatedTextDto {
  es?: string;
  en?: string;
  fr?: string;
  de?: string;
  it?: string;
}

// 🔑 Tipo plano cuando usamos .lean()
type TourLean = Omit<Tour, keyof Document> & { _id: string };

// 🔑 Tipo traducido de salida
export type Translated<T> = {
  [K in keyof T]: T[K] extends TranslatedTextDto
    ? string
    : T[K] extends Array<infer U>
      ? Array<Translated<U>>
      : T[K] extends object
        ? Translated<T[K]>
        : T[K];
};

// 🔑 Tipos auxiliares para itinerario traducido
type TranslatedRoutePoint = Omit<RoutePoint, 'location' | 'description'> & {
  location: string;
  description: string;
};

export type TranslatedItineraryDay = Omit<
  ItineraryDay,
  'title' | 'description' | 'activities' | 'route'
> & {
  title: string;
  description: string;
  activities: string[];
  route: TranslatedRoutePoint[];
};

@Injectable()
export class ToursService {
  constructor(
    @InjectModel(Tour.name)
    private readonly tourModel: Model<TourDocument>,
  ) {}

  // 🚀 Crear tour
  async create(createTourDto: CreateTourDto) {
    try {
      const createdTour = new this.tourModel(createTourDto);
      const savedTour = await createdTour.save();
      const populatedTour = await savedTour.populate('transportOptionIds');

      return {
        message: 'Tour creado exitosamente.',
        data: populatedTour.toObject() as TourLean,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  // 🚀 Obtener tours con paginación
  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10, lang = 'es' } = paginationDto;
    const skip = (page - 1) * limit;

    try {
      const [tours, total] = await Promise.all([
        this.tourModel
          .find()
          .skip(skip)
          .limit(limit)
          .populate('transportOptionIds')
          .lean<TourLean[]>()
          .exec(),
        this.tourModel.countDocuments(),
      ]);

      const translatedTours: (TourLean & {
        title: string;
        subtitle: string;
        duration: string;
        highlights: string[];
        includes: string[];
        notIncludes: string[];
        toBring: string[];
        conditions: string[];
        itinerary: TranslatedItineraryDay[];
      })[] = tours.map((tour) =>
        this.projectTourByLang(tour, lang as keyof TranslatedTextDto),
      );

      return {
        message: translatedTours.length
          ? 'Lista de tours obtenida correctamente.'
          : 'No hay tours registrados.',
        data: translatedTours,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  // 🚀 Obtener por ID
  async findOne(id: string, lang: keyof TranslatedTextDto = 'es') {
    try {
      const tour = await this.tourModel
        .findById(id)
        .populate('transportOptionIds')
        .lean<TourLean>()
        .exec();

      if (!tour) {
        throw new NotFoundException(`No se encontró el tour con ID "${id}".`);
      }

      return {
        message: 'Tour obtenido correctamente.',
        data: this.projectTourByLang(tour, lang),
      };
    } catch {
      throw new InternalServerErrorException('Error al buscar el tour.');
    }
  }

  // 🚀 Actualizar
  async update(id: string, updateTourDto: UpdateTourDto) {
    try {
      const updatedTour = await this.tourModel
        .findByIdAndUpdate(id, updateTourDto, {
          new: true,
          runValidators: true,
        })
        .populate('transportOptionIds')
        .lean<TourLean>()
        .exec();

      if (!updatedTour) {
        throw new NotFoundException(`No se encontró el tour con ID "${id}".`);
      }

      return {
        message: 'Tour actualizado correctamente.',
        data: this.projectTourByLang(updatedTour, 'es'),
      };
    } catch {
      throw new InternalServerErrorException('Error al actualizar el tour.');
    }
  }

  // 🚀 Eliminar
  async remove(id: string) {
    try {
      const deletedTour = await this.tourModel.findByIdAndDelete(id).exec();

      if (!deletedTour) {
        throw new NotFoundException(`No se encontró el tour con ID "${id}".`);
      }

      return {
        message: 'Tour eliminado correctamente.',
      };
    } catch {
      throw new InternalServerErrorException('Error al eliminar el tour.');
    }
  }

  // 🚀 Solo IDs + títulos
  async getTourIds(): Promise<Array<{ _id: string; title: string }>> {
    const tours = await this.tourModel.find({}, '_id title').lean();
    return tours.map((t) => ({
      _id: (t._id as unknown as { toString: () => string }).toString(),
      title: (t.title as TranslatedTextDto)?.es ?? '',
    }));
  }

  // 🚀 Buscar por slug
  async findBySlug(slug: string, lang: keyof TranslatedTextDto = 'es') {
    try {
      const tour = await this.tourModel
        .findOne({ slug })
        .populate('transportOptionIds')
        .lean<TourLean>()
        .exec();

      if (!tour) {
        throw new NotFoundException(
          lang === 'en'
            ? `Tour with slug "${slug}" not found.`
            : `No se encontró el tour con slug "${slug}".`,
        );
      }

      return {
        message:
          lang === 'en'
            ? 'Tour successfully retrieved by slug.'
            : 'Tour obtenido correctamente por slug.',
        data: this.projectTourByLang(tour, lang),
      };
    } catch {
      throw new InternalServerErrorException(
        lang === 'en'
          ? 'Error retrieving the tour by slug.'
          : 'Error al buscar el tour por slug.',
      );
    }
  }

  async getTopTours(lang: keyof TranslatedTextDto = 'es') {
    const topTours = await this.tourModel
      .find()
      .sort({ reviews: -1 })
      .limit(10)
      .populate('transportOptionIds')
      .lean<TourLean[]>()
      .exec();

    const translatedTours = topTours.map((tour) =>
      this.projectTourByLang(tour, lang),
    );

    return {
      message:
        lang === 'en'
          ? 'Top 10 most popular tours.'
          : lang === 'fr'
            ? 'Top 10 des circuits les plus populaires.'
            : lang === 'de'
              ? 'Top 10 der beliebtesten Touren.'
              : lang === 'it'
                ? 'I 10 tour più popolari.'
                : 'Top 10 tours más populares.',
      data: translatedTours,
    };
  }

  // 🚀 Tours de transporte
  async findTransportTours(paginationDto: PaginationDto) {
    const { page = 1, limit = 10, lang = 'es' } = paginationDto;
    const skip = (page - 1) * limit;

    try {
      const [tours, total] = await Promise.all([
        this.tourModel
          .find({ category: 'Transporte Turistico' })
          .skip(skip)
          .limit(limit)
          .populate('transportOptionIds')
          .lean<TourLean[]>()
          .exec(),
        this.tourModel.countDocuments({ category: 'Transporte Turistico' }),
      ]);

      const translatedTours = tours.map((tour) =>
        this.projectTourByLang(tour, lang as keyof TranslatedTextDto),
      );

      return {
        message: translatedTours.length
          ? 'Tours de transporte turístico obtenidos correctamente.'
          : 'No hay tours de transporte turístico registrados.',
        data: translatedTours,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch {
      throw new InternalServerErrorException(
        'Error al obtener los tours de transporte turístico.',
      );
    }
  }
  // 🚀 Obtener TODOS los tours completos (sin lang, con todos los idiomas)
  async findAllToursAll() {
    try {
      const tours = await this.tourModel
        .find()
        .populate('transportOptionIds')
        .lean<TourLean[]>()
        .exec();

      return {
        message: tours.length
          ? 'Lista de todos los tours obtenida correctamente.'
          : 'No hay tours registrados.',
        data: tours,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : 'Error al obtener todos los tours.',
      );
    }
  }
  // 🚀 Obtener un tour completo por ID (sin lang)
  async findOneTourAll(id: string) {
    try {
      const tour = await this.tourModel
        .findById(id)
        .populate('transportOptionIds')
        .lean<TourLean>()
        .exec();

      if (!tour) {
        throw new NotFoundException(`No se encontró el tour con ID "${id}".`);
      }

      return {
        message: 'Tour completo obtenido correctamente.',
        data: tour,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Error al obtener el tour.',
      );
    }
  }

  // 🔑 Proyecta campos multilenguaje al idioma solicitado
  private projectTourByLang(tour: TourLean, lang: keyof TranslatedTextDto) {
    const pick = (field: TranslatedTextDto | undefined) =>
      field ? (field[lang] ?? field.es ?? '') : '';

    const pickItinerary = (
      itinerary: ItineraryDay[] = [],
    ): TranslatedItineraryDay[] =>
      itinerary.map((day, index) => ({
        ...day,
        day: day.day ?? index + 1,
        title: pick(day.title),
        description: pick(day.description),
        activities: day.activities?.map((a) => pick(a)) ?? [],
        route:
          day.route?.map((r) => ({
            ...r,
            location: pick(r.location),
            description: pick(r.description),
          })) ?? [],
      }));

    return {
      ...tour,
      title: pick(tour.title),
      subtitle: pick(tour.subtitle),
      duration: pick(tour.duration),
      highlights: tour.highlights?.map((h) => pick(h)) ?? [],
      includes: tour.includes?.map((i) => pick(i)) ?? [],
      notIncludes: tour.notIncludes?.map((n) => pick(n)) ?? [],
      toBring: tour.toBring?.map((t) => pick(t)) ?? [],
      conditions: tour.conditions?.map((c) => pick(c)) ?? [],
      itinerary: pickItinerary(tour.itinerary),
    };
  }
}
