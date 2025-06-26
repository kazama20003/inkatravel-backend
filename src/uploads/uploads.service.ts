import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import type { Express } from 'express'; // ✅ sólo para tipos

@Injectable()
export class UploadsService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(
    file: Express.Multer.File,
  ): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'uploads' },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error) {
            return reject(
              new InternalServerErrorException(
                'Error al subir el archivo a Cloudinary',
              ),
            );
          }
          if (!result) {
            return reject(
              new InternalServerErrorException(
                'Subida fallida: No se obtuvo un resultado',
              ),
            );
          }
          resolve({ url: result.secure_url, publicId: result.public_id });
        },
      );

      try {
        // Validación explícita para evitar warning de eslint
        if (!file || !(file.buffer instanceof Buffer)) {
          return reject(
            new InternalServerErrorException(
              'El archivo no tiene contenido válido',
            ),
          );
        }

        const readableStream = new Readable();
        readableStream.push(file.buffer); //
        readableStream.push(null);
        readableStream.pipe(uploadStream);
      } catch {
        reject(
          new InternalServerErrorException(
            'Error desconocido al procesar el archivo',
          ),
        );
      }
    });
  }

  async deleteFile(publicId: string): Promise<{ message: string }> {
    try {
      const fullPublicId = `uploads/${publicId}`;
      const result = (await cloudinary.uploader.destroy(fullPublicId)) as {
        result: string;
      };

      if (result.result !== 'ok') {
        throw new InternalServerErrorException(
          'No se pudo eliminar el archivo',
        );
      }

      return { message: 'Archivo eliminado correctamente' };
    } catch {
      throw new InternalServerErrorException(
        'Error al eliminar el archivo en Cloudinary',
      );
    }
  }
}
