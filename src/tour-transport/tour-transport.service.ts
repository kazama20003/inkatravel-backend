/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateTourTransportDto } from './dto/create-tour-transport.dto';
import { UpdateTourTransportDto } from './dto/update-tour-transport.dto';
import {
  TourTransport,
  TourTransportDocument,
} from './entities/tour-transport.entity';
import { PaginationDto } from 'src/common';

@Injectable()
export class TourTransportService {
  constructor(
    @InjectModel(TourTransport.name)
    private readonly tourTransportModel: Model<TourTransportDocument>,
  ) {}

  async create(createDto: CreateTourTransportDto): Promise<TourTransport> {
    const created = new this.tourTransportModel(createDto);
    return await created.save();
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<{ data: Partial<TourTransport>[]; total: number }> {
    const { page = 1, limit = 10, lang = '' } = paginationDto;
    const skip = (page - 1) * limit;

    const items = (await this.tourTransportModel
      .find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean()
      .exec()) as TourTransport[];
    const total = await this.tourTransportModel.countDocuments().exec();

    const data = items.map((doc) => this.projectByLang(doc, lang));
    return { data, total };
  }

  async findOne(id: string, lang = ''): Promise<Partial<TourTransport>> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`TourTransport with id ${id} not found`);
    }
    const doc = await this.tourTransportModel.findById(id).lean().exec();
    if (!doc) {
      throw new NotFoundException(`TourTransport with id ${id} not found`);
    }
    return this.projectByLang(doc, lang);
  }

  async update(
    id: string,
    updateDto: UpdateTourTransportDto,
    lang = '',
  ): Promise<Partial<TourTransport>> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`TourTransport with id ${id} not found`);
    }
    const updated = await this.tourTransportModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .lean()
      .exec();
    if (!updated) {
      throw new NotFoundException(`TourTransport with id ${id} not found`);
    }
    return this.projectByLang(updated, lang);
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`TourTransport with id ${id} not found`);
    }
    const result = await this.tourTransportModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`TourTransport with id ${id} not found`);
    }
  }

  /**
   * Obtener transportes destacados (máximo 10 últimos creados)
   */
  async findFeatured(lang = ''): Promise<Partial<TourTransport>[]> {
    const featured = (await this.tourTransportModel
      .find({ isFeatured: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
      .exec()) as TourTransport[];

    return featured.map((doc) => this.projectByLang(doc, lang));
  }

  async findBySlug(slug: string, lang = ''): Promise<Partial<TourTransport>> {
    let doc: TourTransport | null = null;

    if (lang) {
      // intenta buscar slug multilenguaje (ej: slug.de)
      doc = await this.tourTransportModel
        .findOne({ [`slug.${lang}`]: slug })
        .lean()
        .exec();
    }

    // si no encuentra nada, intenta como string plano
    if (!doc) {
      doc = await this.tourTransportModel.findOne({ slug }).lean().exec();
    }

    if (!doc) {
      throw new NotFoundException(
        `TourTransport with slug "${slug}" not found`,
      );
    }

    return this.projectByLang(doc, lang);
  }

  async findOneAll(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`TourTransport with id ${id} not found`);
    }
    const doc = await this.tourTransportModel.findById(id).lean().exec();
    if (!doc) {
      throw new NotFoundException(`TourTransport with id ${id} not found`);
    }
    return doc; // 👈 aquí devolvemos todo sin aplicar projectByLang
  }

  /**
   * Proyecta campos multilenguaje al idioma solicitado.
   */
  private projectByLang(
    doc: TourTransport,
    lang: string,
  ): Partial<TourTransport> {
    const pick = (field: Record<string, any>) =>
      (lang && field?.[lang]) || Object.values(field ?? {})[0] || '';

    return {
      ...doc,
      title: pick(doc.title as Record<string, any>),
      description: pick(doc.description as Record<string, any>),
      termsAndConditions: pick(doc.termsAndConditions as Record<string, any>),
      itinerary: Array.isArray(doc.itinerary)
        ? doc.itinerary.map((day) => ({
            ...day,
            title: pick(day.title as Record<string, any>),
            description: pick(day.description as Record<string, any>),
            route: Array.isArray(day.route)
              ? day.route.map((stop) => ({
                  ...stop,
                  location: pick(stop.location as Record<string, any>),
                  description: pick(stop.description as Record<string, any>),
                }))
              : [],
          }))
        : [],
    };
  }
}
