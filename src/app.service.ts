import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Bienvenido a la api de inka travel peru - solo acceder personas con permiso!';
  }
}
