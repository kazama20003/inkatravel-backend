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

// Estructura del body que envía Izipay
interface KrCallbackBody {
  'kr-answer': string;
  'kr-hash': string;
}

// Estructura de la respuesta decodificada de Izipay
interface IzipayAnswer {
  orderStatus: string;
  orderId?: string;
  orderDetails?: { orderId?: string };
  client?: { email?: string };
  amount?: number;
  transactions?: { uuid: string }[];
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

    try {
      const rawAnswer = body['kr-answer'];
      const hash = body['kr-hash'];

      if (!rawAnswer || !hash) {
        console.error('❌ Faltan datos en el callback');
        throw new BadRequestException(
          'Faltan datos en el callback (kr-answer o kr-hash).',
        );
      }

      // Validar firma
      const isValid = this.paymentsService.validateSignature(rawAnswer, hash);
      console.log('🔐 Firma válida:', isValid);

      if (!isValid) {
        return { valid: false, message: 'Firma inválida' };
      }

      const answer = JSON.parse(rawAnswer) as IzipayAnswer;
      console.log('📦 Respuesta de Izipay:', answer);

      const transactionUuid = answer.transactions?.[0]?.uuid;
      const orderId = answer.orderDetails?.orderId || answer.orderId;

      console.log('🆔 OrderId recibido:', orderId);
      console.log('💳 Estado de pago:', answer.orderStatus);

      // Solo procesar pagos exitosos
      if (answer.orderStatus === 'PAID') {
        if (!orderId) {
          console.error('❌ No se recibió orderId en el callback');
          throw new BadRequestException('No se pudo recuperar el orderId.');
        }

        const clientEmail = answer.client?.email;
        const amount = answer.amount ?? 0;

        console.log('💰 Monto pagado:', amount);
        console.log('📨 Email del cliente:', clientEmail);

        // Guardar en BD
        await this.paymentsService.savePaymentFromCallback(answer);
        console.log('✅ Pago guardado en base de datos');

        // Confirmación al cliente
        if (clientEmail) {
          await this.paymentsService.sendPaymentConfirmation(
            clientEmail,
            orderId,
            amount,
          );
          console.log('📧 Correo de confirmación enviado al cliente');
        }

        // Copia interna
        await this.paymentsService.sendPaymentConfirmation(
          'reservas.incatravelperu@gmail.com',
          orderId,
          amount,
        );
        console.log('📧 Correo de copia enviado a fatekazama');

        // Buscar orden pendiente
        console.log('🔎 Buscando orden pendiente con ID:', orderId);
        const pendingOrder: OrderDocument | null =
          await this.ordersService.findByOrderId(orderId);

        if (!pendingOrder) {
          console.error(
            '❌ No se encontró una orden pendiente con ese orderId',
          );
          throw new InternalServerErrorException(
            'Orden no encontrada con ese ID',
          );
        }

        console.log('📦 Orden pendiente encontrada:', pendingOrder);

        // Crear orden confirmada
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
            phoneNumber: pendingOrder.customer.phone, // ✅ corregido
            nationality: pendingOrder.customer.nationality,
          },
        });

        const createdOrder: OrderDocument = response.data;
        console.log('✅ Orden creada correctamente:', createdOrder);

        return {
          valid: true,
          status: answer.orderStatus,
          orderId: createdOrder._id,
          transactionUuid,
          message: 'Pago exitoso. Orden creada y correos enviados.',
        };
      }

      // Caso: pago fallido o pendiente
      console.warn('⚠️ El pago no fue completado:', answer.orderStatus);
      return {
        valid: true,
        status: answer.orderStatus,
        message: 'El pago no fue completado',
      };
    } catch (error) {
      console.error('❌ Error en callback:', error);
      throw new InternalServerErrorException(
        'Error procesando el callback de pago',
      );
    }
  }

  @Post('confirm')
  async confirmPayment(
    @Body() body: { email: string; orderId: string; amount: number },
  ) {
    try {
      return await this.paymentsService.sendPaymentConfirmation(
        body.email,
        body.orderId,
        body.amount,
      );
    } catch (error) {
      console.error('❌ Error enviando confirmación manual:', error);
      throw new InternalServerErrorException(
        'No se pudo enviar la confirmación de pago',
      );
    }
  }

  @Post('capture/:uuid')
  @ApiParam({
    name: 'uuid',
    type: String,
    description: 'UUID de la transacción a capturar',
  })
  async capture(@Param('uuid') uuid: string) {
    try {
      return await this.paymentsService.captureTransaction(uuid);
    } catch (error) {
      console.error('❌ Error capturando transacción:', error);
      throw new InternalServerErrorException(
        'No se pudo capturar la transacción',
      );
    }
  }
}
