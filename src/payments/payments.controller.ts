import {
  Controller,
  Post,
  Body,
  InternalServerErrorException,
  BadRequestException,
  Param,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ApiParam } from '@nestjs/swagger';
import { OrdersService } from 'src/orders/orders.service';
import { OrderDocument } from 'src/orders/entities/order.entity';

interface KrCallbackBody {
  'kr-answer': string;
  'kr-hash': string;
}

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly ordersService: OrdersService,
  ) {}

  @Post('formtoken')
  async generateFormToken(@Body() dto: CreatePaymentDto) {
    try {
      return await this.paymentsService.generateFormToken(dto);
    } catch (error) {
      console.error('❌ Error al generar formtoken:', error);
      throw new InternalServerErrorException('No se pudo generar el formToken');
    }
  }

  @Post('callback')
  async handlePaymentCallback(@Body() body: KrCallbackBody) {
    console.log('🔔 Callback recibido:', body);

    const rawAnswer = body['kr-answer'];
    const hash = body['kr-hash'];

    if (!rawAnswer || !hash) {
      throw new BadRequestException(
        'Faltan datos en el callback (kr-answer o kr-hash).',
      );
    }

    const isValid = this.paymentsService.validateSignature(rawAnswer, hash);

    if (!isValid) {
      return { valid: false, message: 'Firma inválida' };
    }

    const answer = JSON.parse(rawAnswer) as {
      orderStatus: string;
      orderId?: string;
      orderDetails?: { orderId?: string };
      client?: { email?: string };
      amount?: number;
      transactions?: { uuid: string }[];
    };

    const transactionUuid = answer.transactions?.[0]?.uuid;
    const orderId = answer.orderDetails?.orderId || answer.orderId;

    if (answer.orderStatus === 'PAID') {
      if (!orderId) {
        throw new BadRequestException('No se pudo recuperar el orderId.');
      }

      const clientEmail = answer.client?.email;
      const amount = answer.amount ?? 0;

      await this.paymentsService.savePaymentFromCallback(answer);

      if (clientEmail) {
        await this.paymentsService.sendPaymentConfirmation(
          clientEmail,
          orderId,
          amount,
        );
      }

      await this.paymentsService.sendPaymentConfirmation(
        'fatekazama@gmail.com',
        orderId,
        amount,
      );

      const pendingOrder: OrderDocument | null =
        await this.ordersService.findByOrderId(orderId);

      if (!pendingOrder) {
        throw new InternalServerErrorException(
          'Orden no encontrada con ese ID',
        );
      }

      const response = await this.ordersService.create({
        user: pendingOrder.user?.toString(),
        items: pendingOrder.items.map((item) => ({
          tour: item.tour.toString(),
          startDate: item.startDate.toISOString(),
          people: item.people,
          pricePerPerson: item.pricePerPerson,
          total: item.total,
          notes: item.notes,
        })),
        totalPrice: amount,
        paymentMethod: 'card',
        notes: 'Orden generada desde callback Izipay',
        discountCodeUsed: pendingOrder.discountCodeUsed,
        customer: {
          fullName: pendingOrder.customer.fullName,
          email: pendingOrder.customer.email,
          phone: pendingOrder.customer.phone,
          nationality: pendingOrder.customer.nationality,
        },
      });

      const createdOrder: OrderDocument = response.data;

      return {
        valid: true,
        status: answer.orderStatus,
        orderId: createdOrder._id,
        transactionUuid,
        message: 'Pago exitoso. Orden creada y correos enviados.',
      };
    }

    return {
      valid: true,
      status: answer.orderStatus,
      message: 'El pago no fue completado',
    };
  }

  @Post('confirm')
  async confirmPayment(
    @Body() body: { email: string; orderId: string; amount: number },
  ) {
    return this.paymentsService.sendPaymentConfirmation(
      body.email,
      body.orderId,
      body.amount,
    );
  }

  @Post('capture/:uuid')
  @ApiParam({
    name: 'uuid',
    type: String,
    description: 'UUID de la transacción a capturar',
  })
  capture(@Param('uuid') uuid: string) {
    return this.paymentsService.captureTransaction(uuid);
  }
}
