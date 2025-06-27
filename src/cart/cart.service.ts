import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId, Types } from 'mongoose';
import { Cart, CartDocument } from './entities/cart.entity';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
  ) {}

  async create(createCartDto: CreateCartDto) {
    const { items, userId, totalPrice } = createCartDto;

    if (!userId) {
      throw new UnauthorizedException(
        'Debes estar autenticado para crear un carrito.',
      );
    }

    if (!items || items.length === 0) {
      throw new BadRequestException('El carrito no puede estar vacío.');
    }

    // ✅ Conversión segura de datos
    const cartItems = items.map((item) => ({
      tour: new Types.ObjectId(item.tour),
      startDate: new Date(item.startDate),
      people: item.people,
      pricePerPerson: item.pricePerPerson,
      total: item.total,
      notes: item.notes,
    }));

    const existingCart = await this.cartModel.findOne({
      userId,
      isOrdered: false,
    });

    if (existingCart) {
      existingCart.items.push(...cartItems);
      existingCart.totalPrice += totalPrice;

      const updated = await existingCart.save();

      return {
        message: '🛒 Tours añadidos a tu carrito existente',
        data: updated,
      };
    }

    const newCart = new this.cartModel({
      userId,
      items: cartItems,
      totalPrice,
    });

    const saved = await newCart.save();

    return {
      message: '🛒 Carrito creado correctamente',
      data: saved,
    };
  }

  async findAll(paginationDto: PaginationDto, userId: string) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [carts, total] = await Promise.all([
      this.cartModel
        .find({ userId }) // 👈 solo carritos del usuario autenticado
        .skip(skip)
        .limit(limit)
        .populate('items.tour', 'title price slug imageUrl')
        .exec(),
      this.cartModel.countDocuments({ userId }).exec(), // 👈 contar solo sus carritos
    ]);

    return {
      message: '🛒 Lista de tus carritos paginada',
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: carts,
    };
  }

  async findOne(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID inválido');
    }

    const cart = await this.cartModel
      .findById(id)
      .populate('items.tour', 'title price slug imageUrl');

    if (!cart) {
      throw new NotFoundException(`No se encontró el carrito con ID ${id}`);
    }

    return {
      message: '🛍️ Carrito encontrado',
      data: cart,
    };
  }

  async update(id: string, updateCartDto: UpdateCartDto, userId: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID inválido');
    }

    const cart = await this.cartModel.findById(id);

    if (!cart) {
      throw new NotFoundException(`No se encontró el carrito con ID ${id}`);
    }

    // Verificar que el carrito pertenezca al usuario
    if (cart.userId?.toString() !== userId) {
      throw new UnauthorizedException(
        'No tienes permiso para editar este carrito.',
      );
    }

    // ✅ Si se va a actualizar el array de items
    if (updateCartDto.items) {
      // Validamos cada item (esto se recomienda pero es opcional si ya pasaron DTO)
      for (const item of updateCartDto.items) {
        if (
          !item.tour ||
          !item.startDate ||
          item.people < 1 ||
          item.total < 0
        ) {
          throw new BadRequestException('Datos de item inválidos');
        }
      }

      // Recalcular totalPrice automáticamente si modifican items
      updateCartDto.totalPrice = updateCartDto.items.reduce(
        (sum, item) => sum + item.total,
        0,
      );
    }

    const updated = await this.cartModel.findByIdAndUpdate(id, updateCartDto, {
      new: true,
    });

    return {
      message: '📝 Carrito actualizado correctamente',
      data: updated,
    };
  }

  async remove(id: string, userId: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID inválido');
    }

    const cart = await this.cartModel.findById(id);

    if (!cart) {
      throw new NotFoundException(`No se encontró el carrito con ID ${id}`);
    }

    // 🛡️ Verificación de dueño
    if (cart.userId?.toString() !== userId) {
      throw new UnauthorizedException(
        'No tienes permiso para eliminar este carrito.',
      );
    }

    await cart.deleteOne();

    return {
      message: '🗑️ Carrito eliminado exitosamente',
      data: { id: cart._id },
    };
  }
  async removeItemFromCart(cartId: string, userId: string, tourId: string) {
    if (!isValidObjectId(cartId) || !isValidObjectId(tourId)) {
      throw new BadRequestException('ID inválido');
    }

    const cart = await this.cartModel.findById(cartId);

    if (!cart) {
      throw new NotFoundException(`No se encontró el carrito con ID ${cartId}`);
    }

    if (cart.userId?.toString() !== userId) {
      throw new UnauthorizedException('No tienes acceso a este carrito');
    }

    const originalLength = cart.items.length;

    cart.items = cart.items.filter((item) => item.tour.toString() !== tourId);

    if (cart.items.length === originalLength) {
      throw new NotFoundException('El tour no se encontró en el carrito');
    }

    // Recalcular total
    cart.totalPrice = cart.items.reduce((sum, i) => sum + i.total, 0);

    const saved = await cart.save();

    return {
      message: '🗑️ Tour eliminado del carrito',
      data: saved,
    };
  }
  async updateCartItem(
    cartId: string,
    userId: string,
    tourId: string,
    people?: number,
    startDate?: string,
    notes?: string,
  ) {
    if (!isValidObjectId(cartId) || !isValidObjectId(tourId)) {
      throw new BadRequestException('ID inválido');
    }

    const cart = await this.cartModel.findById(cartId);
    if (!cart) {
      throw new NotFoundException(`No se encontró el carrito con ID ${cartId}`);
    }

    if (cart.userId?.toString() !== userId) {
      throw new UnauthorizedException('No tienes acceso a este carrito');
    }

    const item = cart.items.find((i) => i.tour.toString() === tourId);
    if (!item) {
      throw new NotFoundException('El tour no se encontró en el carrito');
    }

    // 🔁 Actualizar campos si se enviaron
    if (people !== undefined) {
      item.people = people;
      item.total = item.pricePerPerson * people;
    }

    if (startDate) {
      item.startDate = new Date(startDate);
    }

    if (notes !== undefined) {
      item.notes = notes;
    }

    // 🔄 Recalcular total del carrito
    cart.totalPrice = cart.items.reduce((sum, i) => sum + i.total, 0);

    const saved = await cart.save();

    return {
      message: '✅ Ítem del carrito actualizado correctamente',
      data: saved,
    };
  }
}
