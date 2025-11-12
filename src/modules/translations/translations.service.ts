import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Translation } from '@prisma/client';
import { formatSingle, formatList, wrapResponse, ApiResponse } from '../../common';
import { CreateTranslationDto } from './dto/create-translation.dto';
import { UpdateTranslationDto } from './dto/update-translation.dto';

@Injectable()
export class TranslationService {
  constructor(private readonly prisma: PrismaService) { }

  private basePath = '/translations';

  // ---------------- CREATE ----------------
  async create(data: CreateTranslationDto): Promise<ApiResponse<Translation>> {

    const translation = await this.prisma.translation.create({ data });

    return wrapResponse(formatSingle(translation, this.basePath));
  }

  // ---------------- READ ALL ----------------
  async findAll(): Promise<ApiResponse<Translation[]>> {
    const translations = await this.prisma.translation.findMany({
      include: { TranslationKey: true, Language: true },
    });

    const { data, meta, links } = formatList(translations, this.basePath);
    return wrapResponse(data, meta, links);
  }

  // ---------------- READ BY LANGUAGE ----------------
  async findByLanguage(languageId: number): Promise<any> {
    const translations = await this.prisma.translation.findMany({
      where: { languageId },
      include: {
        TranslationKey: true,
        Language: true,
      },
      orderBy: { id: 'asc' },
    });

    if (!translations.length) {
      throw new NotFoundException(`No translations found for language ID ${languageId}`);
    }

    const language = {
      id: translations[0].Language.id,
      code: translations[0].Language.code,
      name: translations[0].Language.name,
    };

    const formattedTranslations = translations.reduce((acc, t) => {
      acc[t.TranslationKey.key] = t.value;
      return acc;
    }, {});

    return {
      language,
      translations: formattedTranslations,
      message: 'successful',
      statusCode: 200,
    };
  }


  // ---------------- READ ONE ----------------
  async findOne(id: number): Promise<ApiResponse<Translation>> {
    const translation = await this.prisma.translation.findUnique({
      where: { id },
      include: { TranslationKey: true, Language: true },
    });

    if (!translation) throw new NotFoundException(`Translation with id ${id} not found`);

    return wrapResponse(formatSingle(translation, this.basePath));
  }

  // ---------------- UPDATE ----------------
  async update(id: number, data: UpdateTranslationDto): Promise<ApiResponse<Translation>> {
    const translation = await this.prisma.translation.update({ where: { id }, data });

    return wrapResponse(formatSingle(translation, this.basePath));
  }

  // ---------------- DELETE ----------------
  async remove(id: number): Promise<ApiResponse<Translation>> {
    const translation = await this.prisma.translation.delete({ where: { id } });
    return wrapResponse(formatSingle(translation, this.basePath));
  }
}
