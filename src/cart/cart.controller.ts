import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { PaginationDto } from 'src/common';
import { AuthGuard } from '@nestjs/passport';
import { RequestWithUser } from 'src/auth/interfaces/request-with-user';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Body() createCartDto: CreateCartDto, @Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.cartService.create({ ...createCartDto, userId });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(@Query() paginationDto: PaginationDto, @Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.cartService.findAll(paginationDto, userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cartService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  update(
    @Param('id') id: string,
    @Body() updateCartDto: UpdateCartDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.userId;
    return this.cartService.update(id, updateCartDto, userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.cartService.remove(id, userId);
  }

  @Delete(':cartId/items/:tourId')
  @UseGuards(AuthGuard('jwt'))
  async removeItem(
    @Param('cartId') cartId: string,
    @Param('tourId') tourId: string,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.userId;
    return await this.cartService.removeItemFromCart(cartId, userId, tourId);
  }
  @Patch('items/:tourId')
  @UseGuards(AuthGuard('jwt'))
  async updateItem(
    @Param('tourId') tourId: string,
    @Body()
    body: {
      cartId: string;
      people?: number;
      startDate?: string;
      notes?: string;
    },
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.userId;
    return this.cartService.updateCartItem(
      body.cartId,
      userId,
      tourId,
      body.people,
      body.startDate,
      body.notes,
    );
  }
}
