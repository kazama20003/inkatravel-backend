import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateTransportDto } from './dto/create-transport.dto';
import { UpdateTransportDto } from './dto/update-transport.dto';
import { Transport, TransportDocument } from './entities/transport.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class TransportService {
  constructor(
    @InjectModel(Transport.name)
    private readonly transportModel: Model<TransportDocument>,
  ) {}

  // ✅ Crear transporte
  async create(createTransportDto: CreateTransportDto) {
    try {
      const newTransport = new this.transportModel(createTransportDto);
      const saved = await newTransport.save();

      return {
        success: true,
        message: 'Transporte creado exitosamente',
        data: saved,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      return {
        success: false,
        message: 'Error al crear el transporte',
        error: message,
      };
    }
  }

  // ✅ Obtener todos los transportes con paginación
  async findAll(paginationDto: PaginationDto) {
    try {
      const { page = 1, limit = 10 } = paginationDto;
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.transportModel.find().skip(skip).limit(limit).exec(),
        this.transportModel.countDocuments().exec(),
      ]);

      return {
        success: true,
        message:
          total === 0
            ? 'No hay transportes registrados'
            : 'Lista de transportes obtenida correctamente',
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      return {
        success: false,
        message: 'Error al obtener la lista de transportes',
        error: message,
      };
    }
  }

  // ✅ Obtener un solo transporte por ID
  async findOne(id: string) {
    try {
      const transport = await this.transportModel.findById(id).exec();
      if (!transport) {
        return {
          success: false,
          message: `Transporte con ID ${id} no encontrado`,
          data: null,
        };
      }

      return {
        success: true,
        message: 'Transporte encontrado',
        data: transport,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      return {
        success: false,
        message: 'Error al obtener el transporte',
        error: message,
      };
    }
  }

  // ✅ Actualizar un transporte
  async update(id: string, updateTransportDto: UpdateTransportDto) {
    try {
      const updated = await this.transportModel
        .findByIdAndUpdate(id, updateTransportDto, { new: true })
        .exec();

      if (!updated) {
        return {
          success: false,
          message: `Transporte con ID ${id} no encontrado`,
          data: null,
        };
      }

      return {
        success: true,
        message: 'Transporte actualizado correctamente',
        data: updated,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      return {
        success: false,
        message: 'Error al actualizar el transporte',
        error: message,
      };
    }
  }

  // ✅ Eliminar un transporte
  async remove(id: string) {
    try {
      const result = await this.transportModel.findByIdAndDelete(id).exec();
      if (!result) {
        return {
          success: false,
          message: `Transporte con ID ${id} no encontrado`,
          data: null,
        };
      }

      return {
        success: true,
        message: `Transporte con ID ${id} eliminado correctamente`,
        data: result,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      return {
        success: false,
        message: 'Error al eliminar el transporte',
        error: message,
      };
    }
  }
}
