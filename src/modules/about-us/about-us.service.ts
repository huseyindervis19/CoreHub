import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAboutUsDto } from './dto/create-about-us.dto';
import { UpdateAboutUsDto } from './dto/update-about-us.dto';
import { wrapResponse, formatSingle } from '../../common';
import * as fs from 'fs/promises';
import * as fssync from 'fs';
import * as path from 'path';
import { extname } from 'path';

@Injectable()
export class AboutUsService {
  private readonly basePath = '/about-us';
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'about-us');

  constructor(private readonly prisma: PrismaService) {
    if (!fssync.existsSync(this.uploadDir)) {
      fssync.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  // ----------- CREATE (ONLY ONE) -----------
  async create(dto: CreateAboutUsDto, file?: Express.Multer.File) {
    const exists = await this.prisma.aboutUs.findFirst();
    if (exists) {
      throw new BadRequestException(
        'About Us already exists. You can only update it.',
      );
    }

    const imageUrl = file ? await this.saveUploadedFile(file) : dto.imageUrl;

    const created = await this.prisma.$transaction(async tx => {
      const base = await tx.aboutUs.create({
        data: { imageUrl },
      });

      await this.createTranslations(
        base.id,
        dto.story,
        dto.mission,
        dto.vision,
        dto.values,
      );

      return base;
    });

    const translations = await this.getTranslations(created.id);

    return wrapResponse(formatSingle({ ...created, translations }, this.basePath));
  }

  // ----------- PUBLIC GET BY LANG -----------
  async getByLanguage(langCode: string) {
    const about = await this.prisma.aboutUs.findFirst();
    if (!about) throw new NotFoundException('About Us not found');

    const lang = await this.prisma.language.findUnique({
      where: { code: langCode },
    });
    if (!lang) throw new NotFoundException(`Language '${langCode}' not found`);

    const translations = await this.prisma.dynamicTranslation.findMany({
      where: {
        tableName: 'AboutUs',
        rowId: about.id,
        languageId: lang.id,
      },
    });

    const translated = {
      story: translations.find(t => t.field === 'story')?.content || '',
      mission: translations.find(t => t.field === 'mission')?.content || '',
      vision: translations.find(t => t.field === 'vision')?.content || '',
      values: translations.find(t => t.field === 'values')?.content || '',
    };

    return wrapResponse(formatSingle({ ...about, translated }, this.basePath));
  }

  // ----------- UPDATE -----------
  async update(id: number, langCode: string, dto: UpdateAboutUsDto, file?: Express.Multer.File) {
    const about = await this.prisma.aboutUs.findFirst({
      where: { id },
    });
    if (!about) throw new NotFoundException('About Us record not found');

    const language = await this.prisma.language.findUnique({
      where: { code: langCode },
    });
    if (!language)
      throw new NotFoundException(`Language '${langCode}' not found`);

    let imageUrl = about.imageUrl;

    if (file) {
      if (about.imageUrl) await this.deleteImage(about.imageUrl);
      imageUrl = await this.saveUploadedFile(file);
    }

    const updated = await this.prisma.aboutUs.update({
      where: { id },
      data: { imageUrl },
    });

    await this.updateTranslations(id, language.id, dto);

    const translations = await this.getTranslations(id);

    return wrapResponse(formatSingle({ ...updated, translations }, this.basePath));
  }

  // ----------- DELETE -----------
  async remove(id: number) {
    const about = await this.prisma.aboutUs.findUnique({
      where: { id },
    });
    if (!about) throw new NotFoundException('About Us not found');

    if (about.imageUrl) await this.deleteImage(about.imageUrl);

    await this.prisma.dynamicTranslation.deleteMany({
      where: { tableName: 'AboutUs', rowId: id },
    });

    await this.prisma.aboutUs.delete({ where: { id } });

    return wrapResponse(formatSingle(about, this.basePath));
  }

  // ================= HELPERS =================

  private async saveUploadedFile(file: Express.Multer.File): Promise<string> {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    const filename = `about-${unique}${ext}`;
    const fullPath = path.join(this.uploadDir, filename);

    await fs.writeFile(fullPath, file.buffer);
    return `/uploads/about-us/${filename}`;
  }

  private async deleteImage(imageUrl?: string) {
    if (!imageUrl) return;

    const fullPath = path.join(process.cwd(), imageUrl);
    try {
      await fs.access(fullPath);
      await fs.unlink(fullPath);
    } catch {}
  }

  private async createTranslations(
    rowId: number,
    story?: string,
    mission?: string,
    vision?: string,
    values?: string,
  ) {
    const languages = await this.prisma.language.findMany();
    if (!languages.length) return;

    const data = languages.flatMap(lang => [
      {
        tableName: 'AboutUs',
        rowId,
        field: 'story',
        languageId: lang.id,
        content: story || '',
      },
      {
        tableName: 'AboutUs',
        rowId,
        field: 'mission',
        languageId: lang.id,
        content: mission || '',
      },
      {
        tableName: 'AboutUs',
        rowId,
        field: 'vision',
        languageId: lang.id,
        content: vision || '',
      },
      {
        tableName: 'AboutUs',
        rowId,
        field: 'values',
        languageId: lang.id,
        content: values || '',
      },
    ]);

    await this.prisma.dynamicTranslation.createMany({
      data,
      skipDuplicates: true,
    });
  }

  private async updateTranslations(rowId: number, languageId: number, dto: UpdateAboutUsDto) {
    const fields = ['story', 'mission', 'vision', 'values'] as const;

    for (const field of fields) {
      const value = dto[field];
      if (value !== undefined) {
        await this.prisma.dynamicTranslation.upsert({
          where: {
            tableName_rowId_field_languageId: {
              tableName: 'AboutUs',
              rowId,
              field,
              languageId,
            },
          },
          update: { content: value },
          create: {
            tableName: 'AboutUs',
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
      where: { tableName: 'AboutUs', rowId },
      include: { Language: true },
    });

    const grouped: Record<
      string,
      { story: string; mission: string; vision: string; values: string }
    > = {};

    for (const t of translations) {
      const lang = t.Language.code;
      if (!grouped[lang]) {
        grouped[lang] = { story: '', mission: '', vision: '', values: '' };
      }
      grouped[lang][t.field] = t.content;
    }

    return grouped;
  }
}
