import { Injectable, NotFoundException, BadRequestException} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { wrapResponse, formatList, formatSingle } from '../../common';
import { CreateHomeSliderDto } from './dto/create-home-slider.dto';
import { UpdateHomeSliderDto } from './dto/update-home-slider.dto';
import * as fs from 'fs/promises';
import * as fssync from 'fs';
import * as path from 'path';
import { extname } from 'path';

@Injectable()
export class HomeSliderService {
  private readonly basePath = '/home-slider';
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'home-slider');

  constructor(private readonly prisma: PrismaService) {
    if (!fssync.existsSync(this.uploadDir)) {
      fssync.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  // ---------------- CREATE  ----------------
async create(dto: CreateHomeSliderDto, file?: Express.Multer.File) {
  let imageUrl = dto.imageUrl;

  if (file) {
    imageUrl = await this.saveUploadedFile(file);
  }

  if (!imageUrl) {
    throw new BadRequestException('imageUrl or uploaded file is required');
  }

  const slider = await this.prisma.$transaction(async tx => {
    const created = await tx.homeSlider.create({
      data: {
        imageUrl,
        ctaLink: dto.ctaLink,
      },
    });

    await this.createDynamicTranslations(
      created.id,
      dto.title,
      dto.subTitle,
      dto.ctaText,
    );

    return created;
  });

  const translations = await this.getTranslations(slider.id);

  return wrapResponse(formatSingle({ ...slider, translations }, this.basePath));
}

  // ---------------- GET ALL BY LANGUAGE ----------------
  async getAllByLanguage(langCode: string) {
    const language = await this.prisma.language.findUnique({
      where: { code: langCode },
    });
    if (!language) throw new NotFoundException(`Language '${langCode}' not found`);

    const sliders = await this.prisma.homeSlider.findMany({
      orderBy: { id: 'asc' },
    });

    const result = await Promise.all(
      sliders.map(async slider => {
        const translations = await this.prisma.dynamicTranslation.findMany({
          where: {
            tableName: 'HomeSlider',
            rowId: slider.id,
            languageId: language.id,
          },
        });

        const translated = {
          title: translations.find(t => t.field === 'title')?.content || '',
          subTitle: translations.find(t => t.field === 'subTitle')?.content || '',
          ctaText: translations.find(t => t.field === 'ctaText')?.content || '',
        };

        return { ...slider, translated };
      }),
    );

    const { data, meta, links } = formatList(result, this.basePath);
    return wrapResponse(data, meta, links);
  }

  // ---------------- UPDATE ----------------
  async update(id: number, langCode: string, dto: UpdateHomeSliderDto, file?: Express.Multer.File) {
    const slider = await this.prisma.homeSlider.findUnique({ where: { id } });
    if (!slider) throw new NotFoundException(`HomeSlider ${id} not found`);

    const language = await this.prisma.language.findUnique({
      where: { code: langCode },
    });
    if (!language) throw new NotFoundException(`Language '${langCode}' not found`);

    let imageUrl = slider.imageUrl;
    if (file) {
      if (slider.imageUrl) await this.deleteImage(slider.imageUrl);
      imageUrl = await this.saveUploadedFile(file);
    }

    const updated = await this.prisma.homeSlider.update({
      where: { id },
      data: {
        imageUrl,
        ctaLink: dto.ctaLink ?? slider.ctaLink,
      },
    });

    await this.updateDynamicTranslations(id, language.id, dto);

    const translations = await this.getTranslations(id);

    return wrapResponse(formatSingle({ ...updated, translations }, this.basePath));
  }

  // ---------------- DELETE ----------------
  async remove(id: number) {
    const slider = await this.prisma.homeSlider.findUnique({ where: { id } });
    if (!slider) throw new NotFoundException(`HomeSlider ${id} not found`);

    if (slider.imageUrl) await this.deleteImage(slider.imageUrl);

    await this.prisma.dynamicTranslation.deleteMany({
      where: { tableName: 'HomeSlider', rowId: id },
    });

    await this.prisma.homeSlider.delete({ where: { id } });

    return wrapResponse(formatSingle(slider, this.basePath));
  }

  // ---------------- HELPERS ----------------
  private async saveUploadedFile(file: Express.Multer.File): Promise<string> {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileExt = extname(file.originalname);
    const filename = `slider-${uniqueSuffix}${fileExt}`;
    const filepath = path.join(this.uploadDir, filename);
    await fs.writeFile(filepath, file.buffer);
    return `/uploads/home-slider/${filename}`;
  }

  private async deleteImage(imageUrl?: string | null) {
    if (!imageUrl) return;
    const imagePath = path.join(process.cwd(), imageUrl);
    try {
      await fs.access(imagePath);
      await fs.unlink(imagePath);
    } catch {}
  }

  private async createDynamicTranslations(
    rowId: number,
    title: string,
    subTitle?: string,
    ctaText?: string,
  ) {
    const languages = await this.prisma.language.findMany();
    if (!languages.length) return;

    const data = languages.flatMap(lang => [
      {
        tableName: 'HomeSlider',
        rowId,
        field: 'title',
        languageId: lang.id,
        content: title,
      },
      {
        tableName: 'HomeSlider',
        rowId,
        field: 'subTitle',
        languageId: lang.id,
        content: subTitle || '',
      },
      {
        tableName: 'HomeSlider',
        rowId,
        field: 'ctaText',
        languageId: lang.id,
        content: ctaText || '',
      },
    ]);

    await this.prisma.dynamicTranslation.createMany({ data, skipDuplicates: true });
  }

  private async updateDynamicTranslations(
    rowId: number,
    languageId: number,
    dto: UpdateHomeSliderDto,
  ) {
    const fields = ['title', 'subTitle', 'ctaText'] as const;

    for (const field of fields) {
      const value = dto[field];
      if (value !== undefined) {
        await this.prisma.dynamicTranslation.upsert({
          where: {
            tableName_rowId_field_languageId: {
              tableName: 'HomeSlider',
              rowId,
              field,
              languageId,
            },
          },
          update: { content: value },
          create: {
            tableName: 'HomeSlider',
            rowId,
            field,
            languageId,
            content: value,
          },
        });
      }
    }
  }

  private async getTranslations(rowId: number) {
    const translations = await this.prisma.dynamicTranslation.findMany({
      where: { tableName: 'HomeSlider', rowId },
      include: { Language: true },
    });

    const grouped: Record<
      string,
      { title: string; subTitle: string; ctaText: string }
    > = {};

    for (const t of translations) {
      const lang = t.Language.code;
      if (!grouped[lang]) grouped[lang] = { title: '', subTitle: '', ctaText: '' };
      grouped[lang][t.field] = t.content;
    }

    return grouped;
  }
}
