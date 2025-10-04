import {
  Controller,
  Post,
  Body,
  InternalServerErrorException,
  BadRequestException,
  Param,
  Res,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ApiParam } from '@nestjs/swagger';
import { OrdersService } from 'src/orders/orders.service';
import { Response } from 'express';

type CallbackBody = Record<string, unknown>;

/** Shape expected after parsing kr-answer (básico) */
interface IzipayTransaction {
  uuid?: string;
}
interface IzipayAnswer {
  orderStatus?: string;
  orderId?: string;
  orderDetails?: { orderId?: string; orderPaidAmount?: number };
  customer?: { email?: string };
  transactions?: IzipayTransaction[];
}

export interface FormTokenResponse {
  formToken: string;
  [key: string]: unknown;
}

/** runtime validator para la respuesta parseada */
function isIzipayAnswer(u: unknown): u is IzipayAnswer {
  if (typeof u !== 'object' || u === null) return false;
  const o = u as Record<string, unknown>;
  if ('orderStatus' in o && typeof o['orderStatus'] === 'string') return true;
  if (
    'orderDetails' in o &&
    typeof o['orderDetails'] === 'object' &&
    o['orderDetails'] !== null
  )
    return true;
  if ('orderId' in o && typeof o['orderId'] === 'string') return true;
  return false;
}

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly ordersService: OrdersService,
  ) {}

  // ----------------- FRONT CALLBACK -----------------
  @Post('callback')
  async handlePaymentCallback(@Body() body: CallbackBody) {
    try {
      console.log('⚡ Callback recibido (front)');

      const rawAnswer = body['kr-answer'];
      const krHash = body['kr-hash'];

      if (typeof rawAnswer !== 'string' || typeof krHash !== 'string') {
        throw new BadRequestException(
          'kr-answer o kr-hash faltante o inválido',
        );
      }

      // validar firma con HMAC key
      const isValid = this.paymentsService.validateSignature(
        rawAnswer,
        krHash,
        this.paymentsService.hmacKey,
      );
      if (!isValid) {
        throw new BadRequestException('Firma HMAC inválida (callback front)');
      }

      // parsear JSON
      let parsed: unknown;
      try {
        parsed = JSON.parse(rawAnswer);
      } catch {
        throw new BadRequestException('kr-answer no contiene JSON válido');
      }
      if (!isIzipayAnswer(parsed)) {
        throw new BadRequestException(
          'kr-answer no tiene la estructura esperada',
        );
      }
      const answer = parsed;

      console.log('✅ Parsed kr-answer (callback):', answer);

      if (answer.orderStatus === 'PAID') {
        await this.paymentsService.savePaymentFromCallback(answer);

        const clientEmail = answer.customer?.email;
        const orderId =
          answer.orderDetails?.orderId ?? answer.orderId ?? 'unknown';
        const amount = answer.orderDetails?.orderPaidAmount ?? 0;

        if (clientEmail) {
          await this.paymentsService.sendPaymentConfirmation(
            clientEmail,
            orderId,
            amount,
          );
        }
        // notificación admin
        await this.paymentsService.sendPaymentConfirmation(
          'reservas.incatravelperu@gmail.com',
          orderId,
          amount,
        );

        return {
          valid: true,
          status: answer.orderStatus,
          orderId,
          message: 'Pago válido (front). Procesado.',
        };
      }

      return {
        valid: true,
        status: answer.orderStatus ?? 'UNKNOWN',
        message: 'Pago no completado (front)',
      };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error procesando callback';
      console.error('❌ Error en callback:', message);
      throw new InternalServerErrorException(message);
    }
  }

  // ----------------- IPN BACK -----------------
  // ----------------- IPN BACK -----------------
  @Post('ipn')
  async handleIPN(@Body() body: CallbackBody, @Res() res: Response) {
    try {
      console.log('⚡ IPN recibido (server-to-server)');

      const rawAnswer = body['kr-answer'];
      const krHash = body['kr-hash'];

      if (typeof rawAnswer !== 'string' || typeof krHash !== 'string') {
        throw new BadRequestException(
          'kr-answer o kr-hash faltante o inválido (IPN)',
        );
      }

      // validar firma con PASSWORD (según doc oficial)
      const isValid = this.paymentsService.validateSignature(
        rawAnswer,
        krHash,
        this.paymentsService.password,
      );
      if (!isValid) {
        throw new BadRequestException('Firma inválida (IPN)');
      }

      // parsear JSON
      let parsed: unknown;
      try {
        parsed = JSON.parse(rawAnswer);
      } catch {
        throw new BadRequestException(
          'kr-answer no contiene JSON válido (IPN)',
        );
      }
      if (!isIzipayAnswer(parsed)) {
        throw new BadRequestException(
          'kr-answer no tiene la estructura esperada (IPN)',
        );
      }
      const answer = parsed;

      console.log('✅ Parsed kr-answer (IPN):', answer);

      // Guardar en BD
      await this.paymentsService.savePaymentFromCallback(answer);

      const orderStatus = answer.orderStatus ?? 'UNKNOWN';
      const orderId =
        answer.orderDetails?.orderId ?? answer.orderId ?? 'unknown';
      const amount = answer.orderDetails?.orderPaidAmount ?? 0;
      const clientEmail = answer.customer?.email;

      // 👉 Enviar confirmación solo si está pagado
      if (orderStatus === 'PAID') {
        if (clientEmail) {
          await this.paymentsService.sendPaymentConfirmation(
            clientEmail,
            orderId,
            amount,
          );
        }
        // notificación admin
        await this.paymentsService.sendPaymentConfirmation(
          'reservas.incatravelperu@gmail.com',
          orderId,
          amount,
          'Pago confirmado - Admin',
          'Sistema de Pagos',
        );
      }

      // Respuesta obligatoria para izipay
      res.status(200).send(`OK! OrderStatus is ${orderStatus}`);

      return {
        valid: true,
        status: orderStatus,
        orderId,
        transactionUuid: answer.transactions?.[0]?.uuid ?? null,
      };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error procesando IPN';
      console.error('❌ Error en IPN:', message);
      throw new InternalServerErrorException(message);
    }
  }

  // ----------------- OTROS MÉTODOS -----------------
  @Post('formtoken')
  async generateFormToken(
    @Body() dto: CreatePaymentDto,
  ): Promise<FormTokenResponse> {
    try {
      return await this.paymentsService.generateFormToken(dto);
    } catch (err: unknown) {
      console.error('❌ Error generar formToken:', err);
      throw new InternalServerErrorException('No se pudo generar el formToken');
    }
  }

  @Post('confirm')
  async confirmPayment(
    @Body() body: { email: string; orderId: string; amount: number },
  ): Promise<{ success: boolean }> {
    try {
      await this.paymentsService.sendPaymentConfirmation(
        body.email,
        body.orderId,
        body.amount,
      );
      return { success: true };
    } catch (err: unknown) {
      console.error('❌ Error confirmPayment:', err);
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
  async capture(@Param('uuid') uuid: string): Promise<unknown> {
    try {
      return await this.paymentsService.captureTransaction(uuid);
    } catch (err: unknown) {
      console.error('❌ Error capture:', err);
      throw new InternalServerErrorException(
        'No se pudo capturar la transacción',
      );
    }
  }
}
