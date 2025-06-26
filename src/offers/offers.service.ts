import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Offer, OfferDocument } from './entities/offer.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class OffersService {
  constructor(
    @InjectModel(Offer.name) private readonly offerModel: Model<OfferDocument>,
  ) {}

  async create(createOfferDto: CreateOfferDto) {
    if (createOfferDto.startDate >= createOfferDto.endDate) {
      throw new BadRequestException(
        'La fecha de inicio debe ser menor a la fecha de fin.',
      );
    }

    const offer = new this.offerModel({
      ...createOfferDto,
      isActive: createOfferDto.isActive ?? true,
    });

    const saved = await offer.save();

    return {
      message: '✅ Oferta creada correctamente',
      data: saved,
    };
  }

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [offers, total] = await Promise.all([
      this.offerModel
        .find()
        .skip(skip)
        .limit(limit)
        .populate('applicableTours', 'title price slug') // ✅ Populate activo
        .exec(),
      this.offerModel.countDocuments().exec(),
    ]);

    return {
      message: '📦 Lista de ofertas paginada',
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: offers,
    };
  }

  async findOne(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID inválido');
    }

    const offer = await this.offerModel
      .findById(id)
      .populate('applicableTours', 'title price slug'); // ✅ Populate activo

    if (!offer) {
      throw new NotFoundException(`No se encontró la oferta con ID ${id}`);
    }

    return {
      message: '🔍 Oferta encontrada',
      data: offer,
    };
  }

  async update(id: string, updateOfferDto: UpdateOfferDto) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID inválido');
    }

    const updated = await this.offerModel.findByIdAndUpdate(
      id,
      updateOfferDto,
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException(
        `No se pudo actualizar: oferta #${id} no existe`,
      );
    }

    return {
      message: '✏️ Oferta actualizada correctamente',
      data: updated,
    };
  }

  async remove(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID inválido');
    }

    const deleted = await this.offerModel.findByIdAndDelete(id);

    if (!deleted) {
      throw new NotFoundException(
        `No se encontró la oferta #${id} para eliminar`,
      );
    }

    return {
      message: '🗑️ Oferta eliminada exitosamente',
      data: { id: deleted._id },
    };
  }
}
