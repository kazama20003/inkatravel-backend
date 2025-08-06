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

    // 🔐 Verifica autenticación
    if (!userId) {
      throw new UnauthorizedException(
        'Debes estar autenticado para crear un carrito.',
      );
    }

    // 📦 Verifica que haya al menos un item
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('El carrito no puede estar vacío.');
    }

    // 🧼 Sanitiza y valida cada item
    const cartItems = items.map((item, index) => {
      if (!item.productId) {
        throw new BadRequestException(
          `Item #${index + 1} le falta 'productId'.`,
        );
      }

      if (!item.productType) {
        throw new BadRequestException(
          `Item #${index + 1} le falta 'productType'.`,
        );
      }

      return {
        productType: item.productType,
        productId: new Types.ObjectId(item.productId),
        startDate: new Date(item.startDate),
        people: item.people,
        pricePerPerson: item.pricePerPerson,
        total: item.total,
        notes: item.notes,
        productTitle: item.productTitle,
        productImageUrl: item.productImageUrl,
        productSlug: item.productSlug,
      };
    });

    // 🔄 Verifica si ya existe un carrito no ordenado para este usuario
    const existingCart = await this.cartModel.findOne({
      userId,
      isOrdered: false,
    });

    if (existingCart) {
      // 📥 Añade nuevos ítems al carrito existente
      existingCart.items.push(...cartItems);
      existingCart.totalPrice += totalPrice;

      const updatedCart = await existingCart.save();

      return {
        message: '🛒 Productos añadidos a tu carrito existente',
        data: updatedCart,
      };
    }

    // 🆕 Si no hay carrito, crea uno nuevo
    const newCart = new this.cartModel({
      userId,
      items: cartItems,
      totalPrice,
    });

    const savedCart = await newCart.save();

    return {
      message: '🛒 Carrito creado correctamente',
      data: savedCart,
    };
  }

  async findAll(paginationDto: PaginationDto, userId: string) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [carts, total] = await Promise.all([
      this.cartModel
        .find({ userId })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'items.productId',
          select: 'title price slug imageUrl',
        })
        .exec(),
      this.cartModel.countDocuments({ userId }).exec(),
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

  async update(updateCartDto: UpdateCartDto, userId: string) {
    const cart = await this.cartModel.findOne({ userId });

    if (!cart) {
      throw new NotFoundException(`No se encontró un carrito para el usuario`);
    }

    if (updateCartDto.items) {
      for (const item of updateCartDto.items) {
        if (
          !item.productId ||
          !item.startDate ||
          item.people < 1 ||
          item.total < 0
        ) {
          throw new BadRequestException('Datos de item inválidos');
        }
      }

      updateCartDto.totalPrice = updateCartDto.items.reduce(
        (sum, item) => sum + item.total,
        0,
      );
    }

    const updated = await this.cartModel.findByIdAndUpdate(
      cart._id,
      updateCartDto,
      {
        new: true,
      },
    );

    return {
      message: '📝 Carrito actualizado correctamente',
      data: updated,
    };
  }

  async remove(userId: string) {
    const cart = await this.cartModel.findOne({ userId });

    if (!cart) {
      throw new NotFoundException(`No se encontró un carrito para el usuario`);
    }

    await cart.deleteOne();

    return {
      message: '🗑️ Carrito eliminado exitosamente',
      data: { id: cart._id },
    };
  }

  async removeItemFromCart(cartId: string, userId: string, productId: string) {
    if (!isValidObjectId(cartId) || !isValidObjectId(productId)) {
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

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId,
    );

    if (cart.items.length === originalLength) {
      throw new NotFoundException('El producto no se encontró en el carrito');
    }

    cart.totalPrice = cart.items.reduce((sum, i) => sum + i.total, 0);

    const saved = await cart.save();

    return {
      message: '🗑️ Producto eliminado del carrito',
      data: saved,
    };
  }

  async updateCartItem(
    cartId: string,
    userId: string,
    productId: string,
    people?: number,
    startDate?: string,
    notes?: string,
  ) {
    if (!isValidObjectId(cartId) || !isValidObjectId(productId)) {
      throw new BadRequestException('ID inválido');
    }

    const cart = await this.cartModel.findById(cartId);
    if (!cart) {
      throw new NotFoundException(`No se encontró el carrito con ID ${cartId}`);
    }

    if (cart.userId?.toString() !== userId) {
      throw new UnauthorizedException('No tienes acceso a este carrito');
    }

    const item = cart.items.find((i) => i.productId.toString() === productId);

    if (!item) {
      throw new NotFoundException('El producto no se encontró en el carrito');
    }

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

    cart.totalPrice = cart.items.reduce((sum, i) => sum + i.total, 0);

    const saved = await cart.save();

    return {
      message: '✅ Ítem del carrito actualizado correctamente',
      data: saved,
    };
  }
}
