import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './entities/user.entity';
import { PaginationDto } from 'src/common';
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    try {
      const existingUser = await this.userModel.findOne({
        email: createUserDto.email,
      });
      if (existingUser) {
        throw new BadRequestException(
          `El correo ${createUserDto.email} ya está registrado.`,
        );
      }

      const createdUser = new this.userModel(createUserDto);
      return await createdUser.save();
    } catch {
      throw new InternalServerErrorException('Error al crear el usuario.');
    }
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<{ message: string; data: User[] }> {
    const { page = 1, limit = 10 } = paginationDto;

    const skip = (page - 1) * limit;

    try {
      const users = await this.userModel.find().skip(skip).limit(limit).exec();
      const total = await this.userModel.countDocuments();

      return {
        message: `Usuarios obtenidos correctamente. Página ${page} de ${Math.ceil(total / limit)}`,
        data: users,
      };
    } catch {
      throw new InternalServerErrorException('Error al obtener los usuarios.');
    }
  }

  async findOne(id: string): Promise<{ message: string; data: User }> {
    try {
      const user = await this.userModel.findById(id).exec();

      if (!user) {
        throw new NotFoundException(`Usuario con ID "${id}" no encontrado.`);
      }

      return {
        message: 'Usuario encontrado correctamente.',
        data: user,
      };
    } catch {
      throw new InternalServerErrorException('Error al buscar el usuario.');
    }
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<{ message: string; data: User }> {
    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(id, updateUserDto, {
          new: true,
          runValidators: true,
        })
        .exec();

      if (!updatedUser) {
        throw new NotFoundException(`Usuario con ID "${id}" no encontrado.`);
      }

      return {
        message: 'Usuario actualizado correctamente.',
        data: updatedUser,
      };
    } catch {
      throw new InternalServerErrorException('Error al actualizar el usuario.');
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    try {
      const result = await this.userModel.findByIdAndDelete(id).exec();

      if (!result) {
        throw new NotFoundException(`Usuario con ID "${id}" no encontrado.`);
      }

      return { message: 'Usuario eliminado correctamente.' };
    } catch {
      throw new InternalServerErrorException('Error al eliminar el usuario.');
    }
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    try {
      return await this.userModel.findOne({ email }).exec();
    } catch {
      throw new InternalServerErrorException(
        'Error al buscar el usuario por email.',
      );
    }
  }

  async findAllNames(): Promise<{
    message: string;
    data: { _id: string; fullName: string }[];
  }> {
    try {
      const users = await this.userModel.find({}, { fullName: 1 }).exec();

      const data = users.map((user) => ({
        _id: user._id as string, // ✅ conversión segura
        fullName: user.fullName,
      }));

      return {
        message: 'Lista de nombres de usuarios obtenida correctamente.',
        data,
      };
    } catch (error) {
      console.error('Error en findAllNames:', error);
      throw new InternalServerErrorException(
        'Error al obtener los nombres de los usuarios.',
      );
    }
  }
}
