import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './entities/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ], // Importing MongooseModule with User schema
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Exporting UsersService to be used in other modules
})
export class UsersModule {}
