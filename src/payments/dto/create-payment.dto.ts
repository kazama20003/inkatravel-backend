import { IsEmail, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsNumber()
  amount: number; // En centavos: 10.00 => 1000

  @IsEmail()
  customerEmail: string;

  @IsString()
  @IsNotEmpty()
  customerName: string;
}
