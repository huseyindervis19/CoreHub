import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Product } from '@prisma/client';
import { wrapResponse, formatSingle, formatList, ApiResponse } from '../../common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  private readonly basePath = '/products';

  constructor(private readonly prisma: PrismaService) { }

  // ---------------- CREATE ----------------
  async create(dto: CreateProductDto, langCode: string): Promise<ApiResponse<Product & { translations: Record<string, { name: string; slug?: string; description?: string }> }>> {
    const product = await this.prisma.$transaction(async tx => {
      const p = await tx.product.create({
        data: {
          stockQuantity: dto.stockQuantity ?? 0,
          isActive: dto.isActive ?? true,
          isFeatured: dto.isFeatured ?? false,
          categoryId: dto.categoryId,
        },
      });

      await this.createDynamicTranslations(p.id, langCode, dto.name, dto.slug, dto.description);
      return p;
    });

    const translations = await this.getProductTranslations(product.id);
    return wrapResponse(formatSingle({ ...product, translations }, this.basePath));
  }

  // ---------------- READ ALL ----------------
  async findAll(): Promise<ApiResponse<(Product & { translations: Record<string, { name: string; slug?: string; description?: string }> })[]>> {
    const products = await this.prisma.product.findMany();
    const dataWithTranslations = await Promise.all(
      products.map(async p => ({ ...p, translations: await this.getProductTranslations(p.id) }))
    );
    const { data, meta, links } = formatList(dataWithTranslations, this.basePath);
    return wrapResponse(data, meta, links);
  }

  // ---------------- READ ALL BY LANGUAGE ----------------
  async findAllByLanguage(langCode: string): Promise<ApiResponse<(Product & { translated: { name: string; slug?: string; description?: string } })[]>> {
    const language = await this.prisma.language.findUnique({ where: { code: langCode } });
    if (!language) throw new NotFoundException(`Language '${langCode}' not found`);

    const products = await this.prisma.product.findMany();

    const dataWithTranslation = await Promise.all(
      products.map(async p => {
        const translations = await this.prisma.dynamicTranslation.findMany({
          where: { tableName: 'Product', rowId: p.id, languageId: language.id },
        });

        return {
          ...p,
          translated: {
            name: translations.find(t => t.field === 'name')?.content || '',
            slug: translations.find(t => t.field === 'slug')?.content || '',
            description: translations.find(t => t.field === 'description')?.content || '',
          },
        };
      })
    );

    const { data, meta, links } = formatList(dataWithTranslation, this.basePath);
    return wrapResponse(data, meta, links);
  }

  // ---------------- READ BY CATEGORY ----------------
  async findByCategory(
    categoryId: number,
    langCode: string
  ): Promise<ApiResponse<(Product & { translated: { name: string; slug?: string; description?: string }, mainImage?: string })[]>> {
    const language = await this.prisma.language.findUnique({ where: { code: langCode } });
    if (!language) throw new NotFoundException(`Language '${langCode}' not found`);

    const products = await this.prisma.product.findMany({
      where: { categoryId },
      select: {
        id: true,
        categoryId: true,
        stockQuantity: true,
        isActive: true,
        isFeatured: true,
        createdAt: true,
        updatedAt: true,
        Images: {
          where: { isMain: true },
          select: { url: true }
        },
      },
    });

    const dataWithTranslation = await Promise.all(
      products.map(async p => {
        const translations = await this.prisma.dynamicTranslation.findMany({
          where: { tableName: 'Product', rowId: p.id, languageId: language.id },
        });

        return {
          ...p,
          translated: {
            name: translations.find(t => t.field === 'name')?.content || '',
            slug: translations.find(t => t.field === 'slug')?.content || '',
            description: translations.find(t => t.field === 'description')?.content || '',
          },
        };
      })
    );

    const { data, meta, links } = formatList(dataWithTranslation, this.basePath);
    return wrapResponse(data, meta, links);
  }

  // ---------------- READ ONE ----------------
  async findOne(productId: number): Promise<ApiResponse<Product & { translations: Record<string, { name: string; slug?: string; description?: string }> }>> {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException(`Product ${productId} not found`);

    const translations = await this.getProductTranslations(product.id);
    return wrapResponse(formatSingle({ ...product, translations }, this.basePath));
  }

  // ---------------- UPDATE ----------------
  async update(productId: number, langCode: string, dto: UpdateProductDto): Promise<ApiResponse<Product & { translations: Record<string, { name: string; slug?: string; description?: string }> }>> {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException(`Product ${productId} not found`);

    const language = await this.prisma.language.findUnique({ where: { code: langCode } });
    if (!language) throw new NotFoundException(`Language '${langCode}' not found`);

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        stockQuantity: dto.stockQuantity ?? product.stockQuantity,
        isActive: dto.isActive ?? product.isActive,
        isFeatured: dto.isFeatured ?? product.isFeatured,
        categoryId: dto.categoryId ?? product.categoryId,
      },
    });

    if (dto.name !== undefined) {
      await this.prisma.dynamicTranslation.upsert({
        where: { tableName_rowId_field_languageId: { tableName: 'Product', rowId: productId, field: 'name', languageId: language.id } },
        update: { content: dto.name },
        create: { tableName: 'Product', rowId: productId, field: 'name', languageId: language.id, content: dto.name },
      });
    }

    if (dto.slug !== undefined) {
      await this.prisma.dynamicTranslation.upsert({
        where: { tableName_rowId_field_languageId: { tableName: 'Product', rowId: productId, field: 'slug', languageId: language.id } },
        update: { content: dto.slug },
        create: { tableName: 'Product', rowId: productId, field: 'slug', languageId: language.id, content: dto.slug },
      });
    }

    if (dto.description !== undefined) {
      await this.prisma.dynamicTranslation.upsert({
        where: { tableName_rowId_field_languageId: { tableName: 'Product', rowId: productId, field: 'description', languageId: language.id } },
        update: { content: dto.description },
        create: { tableName: 'Product', rowId: productId, field: 'description', languageId: language.id, content: dto.description },
      });
    }

    const translations = await this.getProductTranslations(productId);
    return wrapResponse(formatSingle({ ...product, translations }, this.basePath));
  }

  // ---------------- DELETE ----------------
  async remove(productId: number): Promise<ApiResponse<Product>> {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException(`Product ${productId} not found`);

    await this.prisma.dynamicTranslation.deleteMany({ where: { tableName: 'Product', rowId: productId } });
    await this.prisma.product.delete({ where: { id: productId } });

    return wrapResponse(formatSingle(product, this.basePath));
  }

  // ---------------- HELPERS ----------------
  private async createDynamicTranslations(productId: number, langCode: string, name: string, slug?: string, description?: string) {
    const languages = await this.prisma.language.findMany();
    if (!languages.length) return;

    const translationsData = languages.flatMap(lang => [
      { tableName: 'Product', rowId: productId, field: 'name', languageId: lang.id, content: name },
      { tableName: 'Product', rowId: productId, field: 'slug', languageId: lang.id, content: slug || '' },
      { tableName: 'Product', rowId: productId, field: 'description', languageId: lang.id, content: description || '' },
    ]);

    await this.prisma.dynamicTranslation.createMany({ data: translationsData, skipDuplicates: true });
  }

  private async getProductTranslations(productId: number) {
    const translations = await this.prisma.dynamicTranslation.findMany({
      where: { tableName: 'Product', rowId: productId },
      include: { Language: true },
    });

    const grouped: Record<string, { name: string; slug?: string; description?: string }> = {};
    for (const t of translations) {
      const langCode = t.Language.code;
      if (!grouped[langCode]) grouped[langCode] = { name: '', slug: '', description: '' };
      if (t.field === 'name') grouped[langCode].name = t.content;
      if (t.field === 'slug') grouped[langCode].slug = t.content;
      if (t.field === 'description') grouped[langCode].description = t.content;
    }

    return grouped;
  }
}
