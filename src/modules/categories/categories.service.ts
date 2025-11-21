import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Category } from '@prisma/client';
import { wrapResponse, formatSingle, formatList, ApiResponse } from '../../common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import * as fs from 'fs/promises';
import * as fssync from 'fs';
import * as path from 'path';
import { extname } from 'path';

@Injectable()
export class CategoryService {
  private readonly basePath = '/categories';
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'category');

  constructor(private readonly prisma: PrismaService) {
    if (!fssync.existsSync(this.uploadDir)) {
      fssync.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  // ---------------- CREATE ----------------
  async create(dto: CreateCategoryDto, file?: Express.Multer.File): Promise<ApiResponse<Category & { translations: Record<string, { name: string; description: string }> }>> {
    const imageUrl = file ? await this.saveUploadedFile(file) : dto.imageUrl;

    const category = await this.prisma.$transaction(async tx => {
      const cat = await tx.category.create({
        data: { imageUrl, isFeatured: dto.isFeatured ?? false },
      });
      await this.createDynamicTranslations(cat.id, dto.name, dto.description);
      return cat;
    });

    const translations = await this.getCategoryTranslations(category.id);
    return wrapResponse(formatSingle({ ...category, translations }, this.basePath));
  }

  // ---------------- READ ALL BY LANGUAGE ----------------
  async findAllByLanguage(langCode: string): Promise<ApiResponse<(Category & { translated: { name: string; description: string } })[]>> {
    const language = await this.prisma.language.findUnique({ where: { code: langCode } });
    if (!language) throw new NotFoundException(`Language '${langCode}' not found`);

    const categories = await this.prisma.category.findMany({
      orderBy: [{ id: 'asc' }],
    });
    const dataWithTranslation = await Promise.all(
      categories.map(async category => {
        const translations = await this.prisma.dynamicTranslation.findMany({
          where: { tableName: 'Category', rowId: category.id, languageId: language.id },
        });

        const translated = {
          name: translations.find(t => t.field === 'name')?.content || '',
          description: translations.find(t => t.field === 'description')?.content || '',
        };

        return { ...category, translated };
      })
    );

    const { data, meta, links } = formatList(dataWithTranslation, this.basePath);
    return wrapResponse(data, meta, links);
  }

  // ---------------- READ ONE ----------------
  async findOne(categoryId: number, langCode: string): Promise<ApiResponse<Category & { translated: { name: string; description: string } }>> {
    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) throw new NotFoundException(`Category ${categoryId} not found`);

    const language = await this.prisma.language.findUnique({ where: { code: langCode } });
    if (!language) throw new NotFoundException(`Language '${langCode}' not found`);

    const translations = await this.prisma.dynamicTranslation.findMany({
      where: { tableName: 'Category', rowId: category.id, languageId: language.id },
    });

    const translated = {
      name: translations.find(t => t.field === 'name')?.content || '',
      description: translations.find(t => t.field === 'description')?.content || '',
    };

    return wrapResponse(formatSingle({ ...category, translated }, this.basePath));
  }

  // ---------------- READ 5 FOR LANDING ----------------
  async findLandingPageCategories(langCode: string): Promise<ApiResponse<(Category & { translated: { name: string; description: string } })[]>> {
    const language = await this.prisma.language.findUnique({ where: { code: langCode } });
    if (!language) throw new NotFoundException(`Language '${langCode}' not found`);

    const featured = await this.prisma.category.findMany({ where: { isFeatured: true } });
    const notFeatured = await this.prisma.category.findMany({ where: { isFeatured: false } });

    const categories = await this.prisma.category.findMany({
      orderBy: [
        { isFeatured: 'desc' },
        { id: 'asc' }
      ],
    });
    const selected = categories.slice(0, 5);

    const dataWithTranslation = await Promise.all(
      selected.map(async category => {
        const translations = await this.prisma.dynamicTranslation.findMany({
          where: { tableName: 'Category', rowId: category.id, languageId: language.id },
        });

        const translated = {
          name: translations.find(t => t.field === 'name')?.content || '',
          description: translations.find(t => t.field === 'description')?.content || '',
        };

        return { ...category, translated };
      })
    );

    const { data, meta, links } = formatList(dataWithTranslation, this.basePath);
    return wrapResponse(data, meta, links);
  }

  // ---------------- UPDATE ----------------
  async update(categoryId: number, langCode: string, dto: UpdateCategoryDto, file?: Express.Multer.File): Promise<ApiResponse<Category & { translations: Record<string, { name: string; description: string }> }>> {
    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) throw new NotFoundException(`Category ${categoryId} not found`);

    const language = await this.prisma.language.findUnique({ where: { code: langCode } });
    if (!language) throw new NotFoundException(`Language '${langCode}' not found`);

    let imageUrl = category.imageUrl;
    if (file) {
      if (category.imageUrl) await this.deleteImage(category.imageUrl);
      imageUrl = await this.saveUploadedFile(file);
    }

    const updatedCategory = await this.prisma.category.update({
      where: { id: categoryId },
      data: {
        imageUrl,
        isFeatured: dto.isFeatured ?? category.isFeatured,
      },
    });

    if (dto.name !== undefined) {
      await this.prisma.dynamicTranslation.upsert({
        where: { tableName_rowId_field_languageId: { tableName: 'Category', rowId: categoryId, field: 'name', languageId: language.id } },
        update: { content: dto.name },
        create: { tableName: 'Category', rowId: categoryId, field: 'name', languageId: language.id, content: dto.name },
      });
    }

    if (dto.description !== undefined) {
      await this.prisma.dynamicTranslation.upsert({
        where: { tableName_rowId_field_languageId: { tableName: 'Category', rowId: categoryId, field: 'description', languageId: language.id } },
        update: { content: dto.description },
        create: { tableName: 'Category', rowId: categoryId, field: 'description', languageId: language.id, content: dto.description },
      });
    }

    const translations = await this.getCategoryTranslations(categoryId);
    return wrapResponse(formatSingle({ ...updatedCategory, translations }, this.basePath));
  }

  // ---------------- DELETE ----------------
  async remove(categoryId: number): Promise<ApiResponse<Category>> {
    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) throw new NotFoundException(`Category ${categoryId} not found`);

    if (category.imageUrl) await this.deleteImage(category.imageUrl);
    await this.prisma.dynamicTranslation.deleteMany({ where: { tableName: 'Category', rowId: categoryId } });
    await this.prisma.category.delete({ where: { id: categoryId } });

    return wrapResponse(formatSingle(category, this.basePath));
  }

  // ---------------- HELPERS ----------------
  private async saveUploadedFile(file: Express.Multer.File): Promise<string> {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileExt = extname(file.originalname);
    const filename = `category-${uniqueSuffix}${fileExt}`;
    const filepath = path.join(this.uploadDir, filename);
    await fs.writeFile(filepath, file.buffer);
    return `/uploads/category/${filename}`;
  }

  private async deleteImage(imageUrl?: string | null): Promise<void> {
    if (!imageUrl) return;
    const imagePath = path.join(process.cwd(), imageUrl);
    try {
      await fs.access(imagePath);
      await fs.unlink(imagePath);
    } catch { }
  }

  private async createDynamicTranslations(categoryId: number, name: string, description?: string) {
    const languages = await this.prisma.language.findMany();
    if (!languages.length) return;

    const translationsData = languages.flatMap(lang => [
      { tableName: 'Category', rowId: categoryId, field: 'name', languageId: lang.id, content: name },
      { tableName: 'Category', rowId: categoryId, field: 'description', languageId: lang.id, content: description || '' },
    ]);

    await this.prisma.dynamicTranslation.createMany({ data: translationsData, skipDuplicates: true });
  }

  private async getCategoryTranslations(categoryId: number) {
    const translations = await this.prisma.dynamicTranslation.findMany({
      where: { tableName: 'Category', rowId: categoryId },
      include: { Language: true },
    });

    const grouped: Record<string, { name: string; description: string }> = {};
    for (const t of translations) {
      const langCode = t.Language.code;
      if (!grouped[langCode]) grouped[langCode] = { name: '', description: '' };
      if (t.field === 'name') grouped[langCode].name = t.content;
      if (t.field === 'description') grouped[langCode].description = t.content;
    }

    return grouped;
  }
}
