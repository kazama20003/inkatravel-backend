import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Offer, OfferDocument } from 'src/offers/entities/offer.entity';
import { PaginationDto } from 'src/common';
import { Tour, TourDocument } from 'src/tours/entities/tour.entity'; // ✅ IMPORTADO
@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Offer.name) private readonly offerModel: Model<OfferDocument>,
    @InjectModel(Tour.name) private readonly tourModel: Model<TourDocument>,
  ) {}

  async create(createOrderDto: CreateOrderDto & { user: string }) {
    const {
      items,
      totalPrice,
      customer,
      paymentMethod,
      notes,
      discountCodeUsed,
      user,
    } = createOrderDto;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('La orden debe contener al menos un ítem.');
    }

    let finalPrice = totalPrice;
    let appliedOffer: Types.ObjectId | null = null;

    // Validar el descuento si se proporciona
    if (discountCodeUsed) {
      const offer = await this.offerModel.findOne({
        isActive: true,
        discountCode: discountCodeUsed,
        applicableTours: { $in: items.map((i) => i.tour) }, // tours incluidos
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
      });

      if (!offer) {
        throw new BadRequestException(
          `El código de descuento "${discountCodeUsed}" no es válido o no está activo para los tours seleccionados.`,
        );
      }

      const discount = (totalPrice * offer.discountPercentage) / 100;
      finalPrice = Math.round(totalPrice - discount);
      appliedOffer = offer._id as Types.ObjectId;
    }

    // Convertir tours a ObjectId
    const orderItems = items.map((item) => ({
      tour: new Types.ObjectId(item.tour),
      startDate: new Date(item.startDate),
      people: item.people,
      notes: item.notes,
      pricePerPerson: item.pricePerPerson,
      total: item.total,
    }));

    const createdOrder = new this.orderModel({
      items: orderItems,
      customer,
      totalPrice: finalPrice,
      paymentMethod,
      notes,
      discountCodeUsed: discountCodeUsed || undefined,
      appliedOffer,
      user: new Types.ObjectId(user),
    });

    const saved = await createdOrder.save();

    return {
      message: '🧾 Orden creada correctamente',
      data: saved,
    };
  }

  async findAll(paginationDto: PaginationDto): Promise<{
    message: string;
    data: Order[];
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
      const [orders, total] = await Promise.all([
        this.orderModel
          .find()
          .skip(skip)
          .limit(limit)
          .populate('items.tour', 'title imageUrl price') // populate de los tours dentro de items
          .populate('appliedOffer', 'title discountPercentage')
          .populate('user', 'fullName email')
          .exec(),
        this.orderModel.countDocuments(),
      ]);

      return {
        message: orders.length
          ? 'Lista de órdenes obtenida correctamente.'
          : 'No hay órdenes registradas.',
        data: orders,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Error al obtener las órdenes.');
    }
  }

  async findOne(id: string) {
    const order = await this.orderModel
      .findById(id)
      .populate('items.tour', 'title imageUrl price') // ✅ CORRECTO
      .populate('appliedOffer', 'title discountPercentage')
      .populate('user', 'fullName email')
      .exec();

    if (!order) {
      throw new NotFoundException(`No se encontró la orden con ID ${id}`);
    }

    return {
      message: 'Orden encontrada',
      data: order,
    };
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    const updated = await this.orderModel
      .findByIdAndUpdate(id, updateOrderDto, { new: true })
      .populate('items.tour', 'title imageUrl price') // ✅ CORRECTO
      .populate('appliedOffer', 'title')
      .populate('user', 'fullName email')
      .exec();

    if (!updated) {
      throw new NotFoundException(
        `No se pudo actualizar: orden #${id} no existe`,
      );
    }

    return {
      message: 'Orden actualizada correctamente',
      data: updated,
    };
  }

  async remove(id: string) {
    const deleted = await this.orderModel.findByIdAndDelete(id).exec();

    if (!deleted) {
      throw new NotFoundException(
        `No se encontró la orden #${id} para eliminar`,
      );
    }

    return {
      message: 'Orden eliminada exitosamente',
      data: { id: deleted._id },
    };
  }
}
