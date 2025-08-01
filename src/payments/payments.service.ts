import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { CreatePaymentDto } from './dto/create-payment.dto';
import axios from 'axios';
import { MailerService } from '@nestjs-modules/mailer';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from './entities/payment.entity';
interface AxiosErrorShape {
  response?: {
    data?: {
      message?: string;
    };
  };
}
interface IzipayCallbackAnswer {
  transactions?: { uuid?: string }[];
  orderDetails?: { orderId?: string };
  orderId?: string;
  orderStatus?: string;
  amount?: number;
  client?: { email?: string };
}

function isAxiosError(error: unknown): error is AxiosErrorShape {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as Record<string, unknown>).response === 'object'
  );
}

@Injectable()
export class PaymentsService {
  private username: string;
  private password: string;
  private publicKey: string;
  private hmacKey: string;
  private baseUrl: string;

  constructor(
    private configService: ConfigService,
    private readonly mailerService: MailerService,
    @InjectModel(Payment.name)
    private paymentModel: Model<PaymentDocument>,
  ) {
    this.username = this.getEnvOrThrow('IZIPAY_USERNAME');
    this.password = this.getEnvOrThrow('IZIPAY_PASSWORD');
    this.hmacKey = this.getEnvOrThrow('IZIPAY_HMACSHA256');
    this.publicKey = this.getEnvOrThrow('IZIPAY_PUBLIC_KEY');
    this.baseUrl = this.getEnvOrThrow('IZIPAY_BASE_URL');
  }

  private getEnvOrThrow(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) throw new Error(`Missing env var: ${key}`);
    return value;
  }

  async generateFormToken(dto: CreatePaymentDto) {
    if (!dto.customer?.email) {
      throw new BadRequestException('El campo customer.email es obligatorio');
    }

    const body = {
      amount: dto.amount,
      currency: dto.currency || 'PEN',
      action: 'PAYMENT',
      mode: 'SINGLE',
      contractNumber: 'IZI-PERU-001',
      order: {
        orderId: dto.orderId,
      },
      buyer: {
        email: dto.customer.email,
      },
      customer: {
        email: dto.customer.email,
      },
      contextMode: dto.contextMode || 'TEST',
    };

    const jsonBody = JSON.stringify(body);
    const digest = crypto
      .createHmac('sha256', this.hmacKey)
      .update(jsonBody)
      .digest('base64');

    try {
      const response = await axios.post(
        `${this.baseUrl}/V4/Charge/CreatePayment`,
        body,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization:
              'Basic ' +
              Buffer.from(`${this.username}:${this.password}`).toString(
                'base64',
              ),
            'X-Salt': digest,
          },
        },
      );

      const data = response.data as { answer: { formToken: string } };
      return {
        formToken: data.answer.formToken,
        publicKey: this.publicKey,
      };
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        const msg =
          error.response?.data?.message || 'Error al generar el formToken';
        throw new InternalServerErrorException(msg);
      }
      throw new InternalServerErrorException('Error desconocido');
    }
  }
  async captureTransaction(uuid: string) {
    const secretKey = this.configService.get<string>('IZIPAY_SECRET_KEY');
    if (!secretKey) {
      throw new InternalServerErrorException(
        'Falta IZIPAY_SECRET_KEY en el .env',
      );
    }

    const body = {
      uuid: uuid,
    };

    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(JSON.stringify(body))
      .digest('base64');

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `V2-HMAC-SHA256, Signature=${signature}`,
    };

    try {
      const response = await axios.post(
        'https://api.micuentaweb.pe/api-payment/V4/Charge/Charge/capture',
        body,
        { headers },
      );

      return response.data;
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        console.error('Error capturando la transacción:', error.response?.data);
      } else {
        console.error('Error desconocido al capturar transacción:', error);
      }

      throw new InternalServerErrorException(
        'Error al capturar la transacción',
      );
    }
  }

  validateSignature(rawClientAnswer: string, hash: string): boolean {
    const calculatedHash = crypto
      .createHmac('sha256', this.hmacKey)
      .update(rawClientAnswer)
      .digest('base64');

    return calculatedHash === hash;
  }
  async sendPaymentConfirmation(
    email: string,
    orderId: string,
    amount: number,
  ) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Confirmación de pago',
      template: './confirmation', // sin extensión, debe existir `templates/confirmation.hbs`
      context: {
        email,
        orderId,
        amount,
      },
    });
  }
  async savePaymentFromCallback(answer: IzipayCallbackAnswer) {
    const payment = new this.paymentModel({
      uuid: answer.transactions?.[0]?.uuid,
      orderId: answer.orderDetails?.orderId || answer.orderId,
      status: answer.orderStatus,
      amount: answer.amount ?? 0,
      customerEmail: answer.client?.email,
      currency: 'PEN',
      fullAnswerRaw: answer,
    });

    await payment.save();
  }
}
