import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole, AuthProvider } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({
    example: 'Juan Pérez',
    description: 'Nombre completo del usuario',
  })
  @IsString()
  readonly fullName: string;

  @ApiProperty({
    example: 'juan@email.com',
    description: 'Correo electrónico válido',
  })
  @IsEmail()
  readonly email: string;

  @ApiPropertyOptional({
    example: 'securePass123',
    minLength: 6,
    description: 'Contraseña (opcional si usa OAuth)',
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  readonly password?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    enumName: 'UserRole',
    description: 'Rol del usuario (admin o user)',
    example: 'user',
  })
  @IsOptional()
  @IsEnum(UserRole)
  readonly role?: UserRole;

  @ApiPropertyOptional({
    enum: AuthProvider,
    enumName: 'AuthProvider',
    description: 'Proveedor de autenticación (email, google, etc.)',
    example: 'email',
  })
  @IsOptional()
  @IsEnum(AuthProvider)
  readonly authProvider?: AuthProvider;

  @ApiPropertyOptional({
    example: '+51987654321',
    description: 'Teléfono del usuario',
  })
  @IsOptional()
  @IsString()
  readonly phone?: string;

  @ApiPropertyOptional({ example: 'Perú', description: 'País de residencia' })
  @IsOptional()
  @IsString()
  readonly country?: string;
}
