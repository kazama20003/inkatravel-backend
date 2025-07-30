import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ToursService } from './tours.service';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { PaginationDto } from 'src/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FilterTourDto } from './dto/dto/filter-tour.dto';
import { Difficulty } from './dto/create-tour.dto';
import { PackageType } from './entities/tour.entity';
import { TourCategory } from './entities/tour.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
@ApiTags('Tours') // 🏷 Agrupa los endpoints bajo la etiqueta 'Tours'
@Controller('tours')
export class ToursController {
  constructor(private readonly toursService: ToursService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard) // <-- esto protege con token Y rol
  @Roles('admin')
  @ApiOperation({ summary: 'Crear un nuevo tour' })
  @ApiResponse({ status: 201, description: 'Tour creado exitosamente.' })
  @ApiResponse({ status: 500, description: 'Error del servidor.' })
  create(@Body() createTourDto: CreateTourDto) {
    return this.toursService.create(createTourDto);
  }

  @Get('transport')
  async getTransportTours(@Query() paginationDto: PaginationDto) {
    return this.toursService.findTransportTours(paginationDto);
  }
  @Get()
  @ApiOperation({ summary: 'Obtener todos los tours con filtros y paginación' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false, enum: TourCategory })
  @ApiQuery({ name: 'difficulty', required: false, enum: Difficulty })
  @ApiQuery({ name: 'packageType', required: false, enum: PackageType })
  @ApiQuery({ name: 'region', required: false, type: String })
  @ApiQuery({ name: 'location', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Lista de tours obtenida correctamente.',
  })
  findAll(
    @Query() query: PaginationDto & FilterTourDto, // ✅ Recibir todo junto
  ) {
    return this.toursService.findAll(query); // ✅ Solo un argumento
  }

  @Get('ids/title')
  @ApiOperation({ summary: 'Obtener solo los IDs y títulos de tours' })
  @ApiResponse({ status: 200, description: 'Lista de IDs y títulos.' })
  getTourIds() {
    return this.toursService.getTourIds();
  }
  @Get('top')
  @ApiOperation({ summary: 'Obtener los 10 tours con más reviews' })
  @ApiResponse({
    status: 200,
    description: 'Top 10 tours obtenidos correctamente.',
  })
  getTopTours() {
    return this.toursService.getTopTours();
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Obtener un tour por slug con traducción' })
  @ApiQuery({
    name: 'lang',
    required: false,
    type: String,
    description: 'Idioma (es o en)',
  })
  @ApiResponse({
    status: 200,
    description: 'Tour obtenido correctamente por slug',
  })
  @ApiResponse({ status: 404, description: 'Tour no encontrado.' })
  findBySlug(
    @Param('slug') slug: string,
    @Query('lang') lang: 'es' | 'en' = 'es',
  ) {
    return this.toursService.findBySlug(slug, lang);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un tour por ID' })
  @ApiParam({ name: 'id', description: 'ID del tour', type: String })
  @ApiResponse({ status: 200, description: 'Tour obtenido correctamente.' })
  @ApiResponse({ status: 404, description: 'Tour no encontrado.' })
  findOne(@Param('id') id: string) {
    return this.toursService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard) // <-- esto protege con token Y rol
  @Roles('admin')
  @ApiOperation({ summary: 'Actualizar un tour por ID' })
  @ApiParam({ name: 'id', description: 'ID del tour', type: String })
  @ApiResponse({ status: 200, description: 'Tour actualizado correctamente.' })
  @ApiResponse({ status: 404, description: 'Tour no encontrado.' })
  update(@Param('id') id: string, @Body() updateTourDto: UpdateTourDto) {
    return this.toursService.update(id, updateTourDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard) // <-- esto protege con token Y rol
  @Roles('admin')
  @ApiOperation({ summary: 'Eliminar un tour por ID' })
  @ApiParam({ name: 'id', description: 'ID del tour', type: String })
  @ApiResponse({ status: 200, description: 'Tour eliminado correctamente.' })
  @ApiResponse({ status: 404, description: 'Tour no encontrado.' })
  remove(@Param('id') id: string) {
    return this.toursService.remove(id);
  }
}
