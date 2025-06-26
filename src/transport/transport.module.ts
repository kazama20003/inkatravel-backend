import { Module } from '@nestjs/common';
import { TransportService } from './transport.service';
import { TransportController } from './transport.controller';
import { Transport, TransportSchema } from './entities/transport.entity';
import { MongooseModule } from '@nestjs/mongoose';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transport.name, schema: TransportSchema },
    ]),
  ],
  controllers: [TransportController],
  providers: [TransportService],
})
export class TransportModule {}
