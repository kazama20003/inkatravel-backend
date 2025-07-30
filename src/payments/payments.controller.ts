import {
  Controller,
  Post,
  Body,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

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
    };

    console.log('✅ Respuesta Izipay:', answer);

    if (answer.orderStatus === 'PAID') {
      const orderId = answer.orderDetails?.orderId || answer.orderId;
      const clientEmail = answer.client?.email;
      const adminEmail = 'fatekazama@gmail.com';
      const amount = answer.amount || 0;

      try {
        // 📧 Enviar correo al cliente si tiene email
        if (clientEmail) {
          await this.paymentsService.sendPaymentConfirmation(
            clientEmail,
            orderId!,
            amount,
          );
          console.log(
            '📧 Correo de confirmación enviado al cliente:',
            clientEmail,
          );
        }

        // 📧 Enviar correo al admin (tú)
        await this.paymentsService.sendPaymentConfirmation(
          adminEmail,
          orderId!,
          amount,
        );
        console.log('📧 Correo de notificación enviado al admin:', adminEmail);
      } catch (err) {
        console.error('❌ Error al enviar correo:', err);
      }

      return {
        valid: true,
        status: answer.orderStatus,
        orderId,
        clientEmail,
        adminEmail,
        message:
          'Pago exitoso. Correos enviados al cliente y al administrador.',
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
}
