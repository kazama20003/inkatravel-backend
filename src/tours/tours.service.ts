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
    } catch {
      throw new InternalServerErrorException('Error al crear el tour.');
    }
  }

  async findAll(paginationDto: PaginationDto): Promise<{
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
          .find()
          .skip(skip)
          .limit(limit)
          .populate('transportOptionIds') // 👈 Aquí el populate
          .exec(),
        this.tourModel.countDocuments(),
      ]);

      return {
        message: tours.length
          ? 'Lista de tours obtenida correctamente.'
          : 'No hay tours registrados.',
        data: tours,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch {
      throw new InternalServerErrorException('Error al obtener los tours.');
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
  async findBySlug(slug: string): Promise<{
    message: string;
    data: Tour;
  }> {
    try {
      const tour = await this.tourModel
        .findOne({ slug })
        .populate('transportOptionIds')
        .exec();

      if (!tour) {
        throw new NotFoundException(
          `No se encontró el tour con slug "${slug}".`,
        );
      }

      return {
        message: 'Tour obtenido correctamente por slug.',
        data: tour,
      };
    } catch {
      throw new InternalServerErrorException(
        'Error al buscar el tour por slug.',
      );
    }
  }
  async getTopTours(): Promise<{
    message: string;
    data: Tour[];
  }> {
    try {
      const topTours = await this.tourModel
        .find()
        .sort({ reviews: -1 }) // 👈 Ordena por reviews descendente
        .limit(10)
        .populate('transportOptionIds')
        .exec();

      return {
        message: 'Top 10 tours más populares.',
        data: topTours,
      };
    } catch {
      throw new InternalServerErrorException(
        'Error al obtener los tours más populares.',
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
