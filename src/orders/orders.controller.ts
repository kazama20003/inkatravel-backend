import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PaginationDto } from 'src/common';
import { Request } from 'express';
import { RequestWithUser } from 'src/auth/interfaces/request-with-user';
import { AuthGuard } from '@nestjs/passport';
import { UseGuards } from '@nestjs/common/decorators/core/use-guards.decorator';
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}
  @UseGuards(AuthGuard('jwt')) // asegúrate de usar esto
  @Post()
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.userId; // ✅ este es el campo correcto
    return this.ordersService.create({ ...createOrderDto, user: userId });
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.ordersService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}
