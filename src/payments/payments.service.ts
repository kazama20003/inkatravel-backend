/* src/payments/payments.service.ts */
import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';

interface IzipayCallbackAnswer {
  transactions?: { uuid?: string }[];
  orderDetails?: { orderId?: string; orderPaidAmount?: number };
  orderId?: string;
  orderStatus?: string;
  amount?: number;
  customer?: { email?: string };
  client?: { email?: string }; // algunos payloads usan client
}

/** Minimal shape for axios errors we handle */
interface AxiosErrorShape {
  response?: { data?: { message?: string } };
}
function isAxiosError(err: unknown): err is AxiosErrorShape {
  return typeof err === 'object' && err !== null && 'response' in err;
}

/** Tipo usado cuando hacemos .lean() para evitar `any`. */
type ExistingPaymentLean = {
  _id: unknown;
  amount?: number;
  status?: string;
};

/**
 * Servicio de pagos - maneja formToken, validaciones HMAC, persistencia y emails.
 */
@Injectable()
export class PaymentsService {
  public username: string;
  public password: string; // usado para IPN
  public publicKey: string;
  public hmacKey: string; // usado para front (kr-answer)
  private baseUrl: string;
  private brevoApiKey: string;
  private brevoFrom: string;
  private secretKeyForCapture?: string;

  constructor(
    private configService: ConfigService,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
  ) {
    this.username = this.getEnvOrThrow('IZIPAY_USERNAME');
    this.password = this.getEnvOrThrow('IZIPAY_PASSWORD');
    this.hmacKey = this.getEnvOrThrow('IZIPAY_HMACSHA256');
    this.publicKey = this.getEnvOrThrow('IZIPAY_PUBLIC_KEY');
    this.baseUrl = this.getEnvOrThrow('IZIPAY_BASE_URL');
    this.brevoApiKey = this.configService.get<string>('BREVO_API_KEY') ?? '';
    this.brevoFrom = this.configService.get<string>('MAIL_FROM') ?? '';
    this.secretKeyForCapture =
      this.configService.get<string>('IZIPAY_SECRET_KEY') ?? undefined;
  }

  private getEnvOrThrow(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) throw new Error(`Missing env var: ${key}`);
    return value;
  }

  /** 1️⃣ Generar token de formulario */
  public async generateFormToken(
    dto: CreatePaymentDto,
  ): Promise<{ formToken: string; publicKey: string }> {
    if (!dto.customer?.email) {
      throw new BadRequestException('El campo customer.email es obligatorio');
    }

    const body = {
      amount: dto.amount * 100,
      currency: dto.currency ?? 'PEN',
      orderId: dto.orderId,
      customer: {
        email: dto.customer.email,
        billingDetails: {
          firstName: dto.customer.firstName ?? 'N/A',
          lastName: dto.customer.lastName ?? 'N/A',
          phoneNumber: dto.customer.phoneNumber ?? '',
          identityType: dto.customer.identityType ?? '',
          identityCode: dto.customer.identityCode ?? '',
          address: dto.customer.address ?? '',
          country: dto.customer.country ?? 'PE',
          city: dto.customer.city ?? '',
          state: dto.customer.state ?? '',
          zipCode: dto.customer.zipCode ?? '',
        },
      },
      contextMode: dto.contextMode ?? 'LIVE',
    };

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
          },
        },
      );

      const data = response.data as { answer?: { formToken?: string } };
      const formToken = data.answer?.formToken;
      if (!formToken)
        throw new InternalServerErrorException(
          'No se recibió formToken de Izipay',
        );

      return { formToken, publicKey: this.publicKey };
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const msg = err.response?.data?.message ?? 'Error al generar formToken';
        throw new InternalServerErrorException(msg);
      }
      throw new InternalServerErrorException(
        'Error desconocido al generar token',
      );
    }
  }

  /** 2️⃣ Capturar transacción (opcional según flujo) */
  public async captureTransaction(uuid: string): Promise<any> {
    const secretKey = this.secretKeyForCapture;
    if (!secretKey) {
      throw new InternalServerErrorException(
        'Falta IZIPAY_SECRET_KEY en la configuración',
      );
    }

    const body = { uuid };
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
        `${this.baseUrl}/V4/Charge/Capture`,
        body,
        { headers },
      );
      return response.data;
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        console.error('Error capturando transacción:', err.response?.data);
      } else {
        console.error('Error desconocido capturando transacción:', err);
      }
      throw new InternalServerErrorException(
        'Error al capturar la transacción',
      );
    }
  }

  /**
   * 3️⃣ Valida HMAC SHA256 comparando de forma segura (timing-safe).
   * krAnswer: string EXACTO recibido en 'kr-answer' (no decodificar antes de validar)
   * krHash: valor recibido en 'kr-hash' (hex)
   * key: la clave a usar (HMACSHA256 para front; PASSWORD para IPN según doc)
   */
  public validateSignature(
    krAnswer: string,
    krHash: string,
    key: string,
  ): boolean {
    if (typeof krAnswer !== 'string' || typeof krHash !== 'string')
      return false;
    if (!key || typeof key !== 'string') return false;

    try {
      const calcHex = crypto
        .createHmac('sha256', key)
        .update(krAnswer, 'utf8')
        .digest('hex');

      const a = Buffer.from(calcHex, 'hex');
      let b: Buffer;
      try {
        b = Buffer.from(krHash, 'hex');
      } catch {
        return false;
      }
      if (a.length !== b.length) return false;
      return crypto.timingSafeEqual(a, b);
    } catch (err) {
      console.error('validateSignature error:', err);
      return false;
    }
  }

  /**
   * 4️⃣ Guarda en BD el pago (idempotente).
   * Recibe el objeto ya parseado (IzipayCallbackAnswer).
   * Método público para que el controller lo invoque.
   */
  public async savePaymentFromCallback(answer: IzipayCallbackAnswer) {
    try {
      // Extraer uuid de forma segura (sin usar `any`)
      let uuid: string | null = null;
      if (
        Array.isArray(answer.transactions) &&
        answer.transactions.length > 0
      ) {
        const t0 = answer.transactions[0];
        if (t0 && typeof t0 === 'object') {
          const maybeUuid = (t0 as { uuid?: unknown }).uuid;
          if (typeof maybeUuid === 'string') uuid = maybeUuid;
        }
      }

      // Extraer orderId de forma segura
      let orderId: string | null = null;
      if (
        answer.orderDetails &&
        typeof answer.orderDetails === 'object' &&
        typeof answer.orderDetails.orderId === 'string'
      ) {
        orderId = answer.orderDetails.orderId;
      } else if (typeof answer.orderId === 'string') {
        orderId = answer.orderId;
      }

      // criterio de idempotencia: preferir uuid si viene, si no usar orderId
      const query: Record<string, unknown> = {};
      if (uuid) query['uuid'] = uuid;
      else if (orderId) query['orderId'] = orderId;

      if (Object.keys(query).length > 0) {
        // usamos .lean<ExistingPaymentLean>() para que TS no infiera any
        const existing = await this.paymentModel
          .findOne(query)
          .lean<ExistingPaymentLean | null>();

        if (existing) {
          // actualizar datos importantes si cambian
          const newStatus = answer.orderStatus ?? existing.status;
          const newAmount =
            answer.amount ??
            answer.orderDetails?.orderPaidAmount ??
            existing.amount;

          await this.paymentModel.updateOne(
            { _id: existing._id },
            {
              $set: {
                status: newStatus,
                amount: newAmount,
                fullAnswerRaw: answer,
              },
            },
          );

          return existing;
        }
      }

      const paymentDoc = new this.paymentModel({
        uuid,
        orderId,
        status: answer.orderStatus,
        amount: answer.amount ?? answer.orderDetails?.orderPaidAmount ?? 0,
        customerEmail: answer.customer?.email ?? answer.client?.email ?? null,
        currency: 'PEN',
        fullAnswerRaw: answer,
        createdAt: new Date(),
      });

      const saved = await paymentDoc.save();
      return saved;
    } catch (err) {
      console.error('savePaymentFromCallback error:', err);
      throw new InternalServerErrorException('Error guardando pago en BD');
    }
  }

  /**
   * 5️⃣ Enviar confirmación por correo (Brevo).
   * Implementación básica; ajusta HTML y manejo de errores a tu gusto.
   */
  public async sendPaymentConfirmation(
    email: string,
    orderId: string,
    amount: number,
    subject = 'Confirmación de pago',
    senderName = 'Tu Empresa',
  ) {
    try {
      if (!this.brevoApiKey || !this.brevoFrom) {
        throw new InternalServerErrorException(
          'Brevo no configurado (BREVO_API_KEY o MAIL_FROM faltan)',
        );
      }

      await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: { email: this.brevoFrom, name: senderName },
          to: [{ email }],
          subject,
          htmlContent: `<h2>${subject}</h2>
            <p>Tu pago fue procesado correctamente.</p>
            <p><strong>Pedido:</strong> ${orderId}</p>
            <p><strong>Monto:</strong> S/ ${(amount / 100).toFixed(2)}</p>`,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.brevoApiKey,
          },
        },
      );
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        console.error('Error enviando correo:', err.response?.data);
      } else {
        console.error('Error desconocido enviando correo:', err);
      }
      throw new InternalServerErrorException(
        'No se pudo enviar la confirmación por correo',
      );
    }
  }
}
