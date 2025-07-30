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
interface AxiosErrorShape {
  response?: {
    data?: {
      message?: string;
    };
  };
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
}
