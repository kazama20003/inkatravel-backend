import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { TourTransportService } from './tour-transport.service';
import { CreateTourTransportDto } from './dto/create-tour-transport.dto';
import { UpdateTourTransportDto } from './dto/update-tour-transport.dto';
import { PaginationDto } from 'src/common';

@Controller('tour-transport')
export class TourTransportController {
  constructor(private readonly tourTransportService: TourTransportService) {}

  @Post()
  async create(@Body() createDto: CreateTourTransportDto) {
    return await this.tourTransportService.create(createDto);
  }

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('lang', new DefaultValuePipe('')) lang: string,
  ) {
    const pagination: PaginationDto = { page, limit, lang };
    return await this.tourTransportService.findAll(pagination);
  }
  @Get('all/:id')
  async findOneAll(@Param('id') id: string) {
    return await this.tourTransportService.findOneAll(id);
  }

  @Get('featured')
  async findFeatured(@Query('lang', new DefaultValuePipe('')) lang: string) {
    return await this.tourTransportService.findFeatured(lang);
  }

  @Get('slug/:slug')
  async findBySlug(
    @Param('slug') slug: string,
    @Query('lang', new DefaultValuePipe('')) lang: string,
  ) {
    return await this.tourTransportService.findBySlug(slug, lang);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('lang', new DefaultValuePipe('')) lang: string,
  ) {
    return await this.tourTransportService.findOne(id, lang);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTourTransportDto,
    @Query('lang', new DefaultValuePipe('')) lang: string,
  ) {
    return await this.tourTransportService.update(id, updateDto, lang);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.tourTransportService.remove(id);
    return { message: 'TourTransport removed successfully' };
  }
}
