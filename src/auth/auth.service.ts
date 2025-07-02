import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UserRole, UserDocument } from '../users/entities/user.entity';
import { AuthProvider } from '../users/entities/user.entity'; // asegúrate de importar esto
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateOAuthLogin(
    oauthUser: { email: string; fullName: string },
    provider: AuthProvider = AuthProvider.GOOGLE,
  ): Promise<{ access_token: string; user: UserDocument }> {
    const { email, fullName } = oauthUser;

    if (!email || !fullName) {
      throw new Error(
        '❌ No se recibió el nombre completo o el email desde OAuth',
      );
    }

    let user: UserDocument | null;

    try {
      user = await this.usersService.findByEmail(email);
    } catch (error) {
      console.error('❌ Error al buscar usuario:', error);
      throw error;
    }

    if (!user) {
      try {
        user = await this.usersService.create({
          fullName,
          email,
          role: UserRole.USER,
          authProvider: provider,
        });
      } catch (error) {
        console.error('❌ Error al crear usuario:', error);
        throw error;
      }
    }

    const payload = {
      sub: user._id,
      email: user.email,
      role: user.role,
    };

    const token = this.jwtService.sign(payload);
    return { access_token: token, user };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user || !user.password) {
      throw new Error('Credenciales inválidas');
    }

    let isMatch: boolean;
    try {
      isMatch = await bcrypt.compare(loginDto.password, user.password);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('❌ Error al comparar contraseñas:', error.message);
        throw new Error('Error al validar credenciales');
      } else {
        console.error('❌ Error inesperado:', error);
        throw new Error('Error desconocido al validar credenciales');
      }
    }

    if (!isMatch) {
      throw new Error('Credenciales inválidas');
    }

    const token = this.jwtService.sign({
      sub: user._id,
      email: user.email,
      role: user.role,
    });

    return { access_token: token, user };
  }
  async register(createUserDto: CreateUserDto) {
    // Verifica si el usuario ya existe
    const existingUser = await this.usersService.findByEmail(
      createUserDto.email,
    );
    if (existingUser) {
      throw new Error('El correo ya está registrado');
    }

    // Crea el usuario
    const newUser = await this.usersService.create({
      ...createUserDto,
      role: createUserDto.role ?? UserRole.USER, // asignar rol por defecto si no se envía
      authProvider: createUserDto.authProvider ?? AuthProvider.LOCAL, // por defecto local
    });

    const payload = {
      sub: newUser._id,
      email: newUser.email,
    };

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: newUser,
    };
  }
}
