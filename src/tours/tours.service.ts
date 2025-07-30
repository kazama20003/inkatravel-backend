import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { Tour, TourDocument } from './entities/tour.entity';
import { PaginationDto } from 'src/common';

@Injectable()
export class ToursService {
  constructor(
    @InjectModel(Tour.name)
    private readonly tourModel: Model<TourDocument>,
  ) {}

  async create(createTourDto: CreateTourDto): Promise<{
    message: string;
    data: Tour;
  }> {
    try {
      const createdTour = new this.tourModel(createTourDto);
      const savedTour = await createdTour.save();

      const populatedTour = await savedTour.populate('transportOptionIds');

      return {
        message: 'Tour creado exitosamente.',
        data: populatedTour,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message); // ✔️ acceso seguro
      }
      throw new Error('Unknown error'); // fallback
    }
  }

  async findAll(paginationDto: PaginationDto): Promise<{
    message: string;
    data: any[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const { page = 1, limit = 10, lang = 'es' } = paginationDto;
    const skip = (page - 1) * limit;

    try {
      const [tours, total] = await Promise.all([
        this.tourModel
          .find()
          .skip(skip)
          .limit(limit)
          .populate('transportOptionIds')
          .lean()
          .exec(),
        this.tourModel.countDocuments(),
      ]);

      const translatedTours = tours.map((tour) => ({
        ...tour,
        title: tour.title?.[lang] || '',
        subtitle: tour.subtitle?.[lang] || '',
        duration: tour.duration?.[lang] || '',
        highlights: tour.highlights?.map((h) => h?.[lang] || '') || [],
        includes: tour.includes?.map((i) => i?.[lang] || '') || [],
        notIncludes: tour.notIncludes?.map((i) => i?.[lang] || '') || [],
        toBring: tour.toBring?.map((i) => i?.[lang] || '') || [],
        conditions: tour.conditions?.map((i) => i?.[lang] || '') || [],
        itinerary:
          tour.itinerary?.map((day) => ({
            ...day,
            title: day.title?.[lang] || '',
            description: day.description?.[lang] || '',
            activities: day.activities?.map((a) => a?.[lang] || '') || [],
            route: day.route?.map((point) => ({
              ...point,
              location: point.location?.[lang] || '',
              description: point.description?.[lang] || '',
            })),
          })) || [],
      }));

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
      if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
      throw new InternalServerErrorException('Unknown error');
    }
  }

  async findOne(id: string): Promise<{
    message: string;
    data: Tour;
  }> {
    try {
      const tour = await this.tourModel
        .findById(id)
        .populate('transportOptionIds') // 👈 Aquí también
        .exec();

      if (!tour) {
        throw new NotFoundException(`No se encontró el tour con ID "${id}".`);
      }

      return {
        message: 'Tour obtenido correctamente.',
        data: tour,
      };
    } catch {
      throw new InternalServerErrorException('Error al buscar el tour.');
    }
  }

  async update(
    id: string,
    updateTourDto: UpdateTourDto,
  ): Promise<{
    message: string;
    data: Tour;
  }> {
    try {
      const updatedTour = await this.tourModel
        .findByIdAndUpdate(id, updateTourDto, {
          new: true,
          runValidators: true,
        })
        .populate('transportOptionIds') // 👈 También aquí si quieres el resultado poblado
        .exec();

      if (!updatedTour) {
        throw new NotFoundException(`No se encontró el tour con ID "${id}".`);
      }

      return {
        message: 'Tour actualizado correctamente.',
        data: updatedTour,
      };
    } catch {
      throw new InternalServerErrorException('Error al actualizar el tour.');
    }
  }

  async remove(id: string): Promise<{
    message: string;
  }> {
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
  // tours.service.ts
  async getTourIds() {
    return this.tourModel.find({}, '_id title'); // Solo devuelve _id y title
  }
  async findBySlug(
    slug: string,
    lang: 'es' | 'en' = 'es',
  ): Promise<{
    message: string;
    data: any;
  }> {
    try {
      const tour = await this.tourModel
        .findOne({ slug })
        .populate('transportOptionIds')
        .lean()
        .exec();

      if (!tour) {
        throw new NotFoundException(
          lang === 'en'
            ? `Tour with slug "${slug}" not found.`
            : `No se encontró el tour con slug "${slug}".`,
        );
      }

      // ✅ Traducir los campos al idioma solicitado
      const translatedTour = {
        ...tour,
        title: tour.title?.[lang] || '',
        subtitle: tour.subtitle?.[lang] || '',
        duration: tour.duration?.[lang] || '',
        highlights: tour.highlights?.map((h) => h?.[lang] || '') || [],
        includes: tour.includes?.map((i) => i?.[lang] || '') || [],
        notIncludes: tour.notIncludes?.map((i) => i?.[lang] || '') || [],
        toBring: tour.toBring?.map((i) => i?.[lang] || '') || [],
        conditions: tour.conditions?.map((i) => i?.[lang] || '') || [],
        itinerary:
          tour.itinerary?.map((day) => ({
            ...day,
            title: day.title?.[lang] || '',
            description: day.description?.[lang] || '',
            route: day.route?.map((point) => ({
              ...point,
              location: point.location?.[lang] || '',
              description: point.description?.[lang] || '',
            })),
          })) || [],
      };

      return {
        message:
          lang === 'en'
            ? 'Tour successfully retrieved by slug.'
            : 'Tour obtenido correctamente por slug.',
        data: translatedTour,
      };
    } catch {
      throw new InternalServerErrorException(
        lang === 'en'
          ? 'Error retrieving the tour by slug.'
          : 'Error al buscar el tour por slug.',
      );
    }
  }

  async getTopTours(lang: 'es' | 'en' = 'es'): Promise<{
    message: string;
    data: any[];
  }> {
    try {
      const topTours = await this.tourModel
        .find()
        .sort({ reviews: -1 })
        .limit(10)
        .populate('transportOptionIds')
        .lean() // Para trabajar con objetos planos
        .exec();

      const translatedTours = topTours.map((tour) => ({
        ...tour,
        title: tour.title?.[lang] || '',
        subtitle: tour.subtitle?.[lang] || '',
        duration: tour.duration?.[lang] || '',
        highlights: tour.highlights?.map((h) => h?.[lang] || '') || [],
        includes: tour.includes?.map((i) => i?.[lang] || '') || [],
        notIncludes: tour.notIncludes?.map((i) => i?.[lang] || '') || [],
        toBring: tour.toBring?.map((i) => i?.[lang] || '') || [],
        conditions: tour.conditions?.map((i) => i?.[lang] || '') || [],
        itinerary:
          tour.itinerary?.map((day) => ({
            ...day,
            title: day.title?.[lang] || '',
            description: day.description?.[lang] || '',
            route: day.route?.map((point) => ({
              ...point,
              location: point.location?.[lang] || '',
              description: point.description?.[lang] || '',
            })),
          })) || [],
      }));

      return {
        message:
          lang === 'en'
            ? 'Top 10 most popular tours.'
            : 'Top 10 tours más populares.',
        data: translatedTours,
      };
    } catch {
      throw new InternalServerErrorException(
        lang === 'en'
          ? 'Error retrieving the most popular tours.'
          : 'Error al obtener los tours más populares.',
      );
    }
  }
  async findTransportTours(paginationDto: PaginationDto): Promise<{
    message: string;
    data: Tour[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    try {
      const [tours, total] = await Promise.all([
        this.tourModel
          .find({ category: 'Transporte Turistico' })
          .skip(skip)
          .limit(limit)
          .populate('transportOptionIds')
          .exec(),
        this.tourModel.countDocuments({ category: 'Transporte Turistico' }),
      ]);

      return {
        message: tours.length
          ? 'Tours de transporte turístico obtenidos correctamente.'
          : 'No hay tours de transporte turístico registrados.',
        data: tours,
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
}
