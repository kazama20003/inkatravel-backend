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
interface KrCallbackBody {
  'kr-answer': string;
  'kr-hash': string;
}

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

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
    console.log('🆔 UUID de la transacción:', transactionUuid); // 👈 nuevo

    if (answer.orderStatus === 'PAID') {
      const orderId = answer.orderDetails?.orderId || answer.orderId;
      const clientEmail = answer.client?.email;
      const amount = answer.amount || 0;

      // 🧠 Guardar en base de datos
      await this.paymentsService.savePaymentFromCallback(answer);

      // 📧 Enviar correos
      if (clientEmail) {
        await this.paymentsService.sendPaymentConfirmation(
          clientEmail,
          orderId!,
          amount,
        );
      }

      await this.paymentsService.sendPaymentConfirmation(
        'fatekazama@gmail.com',
        orderId!,
        amount,
      );

      return {
        valid: true,
        status: answer.orderStatus,
        orderId,
        transactionUuid: answer.transactions?.[0]?.uuid,
        message: 'Pago exitoso. Correos enviados.',
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
