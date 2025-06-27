import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { envs } from './config/envs';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const logger = new Logger('Main');
  const app = await NestFactory.create(AppModule);

  // Prefijo global para rutas
  app.setGlobalPrefix('api');

  // Seguridad con Helmet
  app.use(helmet());

  // Compresión gzip
  app.use(compression());

  // CORS configurado según entorno
  app.enableCors({
    origin:
      envs.nodeEnv === 'production'
        ? [
            'https://cabanacondecuscobybus.com',
            'https://www.cabanacondecuscobybus.com',
          ]
        : '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Mostrar Swagger si está habilitado
  if (envs.enableSwagger) {
    const config = new DocumentBuilder()
      .setTitle('API Peru Travel')
      .setDescription(
        'Documentación de la API para el sitio de reservas de tours',
      )
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  // Errores globales
  process.on('uncaughtException', (err) => {
    logger.error('❌ Uncaught Exception:', err);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('❌ Unhandled Rejection:', reason);
  });

  // Iniciar servidor
  await app.listen(envs.port);
  logger.log(`✅ Backend running at http://localhost:${envs.port}/api`);
  if (envs.enableSwagger) {
    logger.log(`📘 Swagger docs at http://localhost:${envs.port}/docs`);
  }
}

bootstrap();
