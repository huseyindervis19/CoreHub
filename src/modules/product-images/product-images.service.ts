import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs/promises';
import * as fssync from 'fs';
import * as path from 'path';
import { extname } from 'path';
import { CreateProductImageDto } from './dto/create-product-image.dto';
import { ProductImage } from '@prisma/client';
import { wrapResponse, formatSingle, formatList, ApiResponse } from '../../common';

@Injectable()
export class ProductImageService {
  private readonly basePath = '/product-images';
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'product');

  constructor(private readonly prisma: PrismaService) {
    if (!fssync.existsSync(this.uploadDir)) {
      fssync.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  // ---------------- CREATE ----------------
  async create(dto: CreateProductImageDto, file: Express.Multer.File): Promise<ApiResponse<ProductImage>> {
    const url = await this.saveUploadedFile(file);
    const existingMainImage = await this.prisma.productImage.findFirst({
      where: { productId: dto.productId, isMain: true },
    });

    let isMain = dto.isMain ?? false;
    if (!existingMainImage) isMain = true;
    if (dto.isMain === true) {
      await this.prisma.productImage.updateMany({
        where: { productId: dto.productId },
        data: { isMain: false },
      });
      isMain = true;
    }

    const image = await this.prisma.productImage.create({
      data: { productId: dto.productId, url, isMain },
    });

    return wrapResponse(formatSingle(image, this.basePath));
  }

  // ---------------- UPDATE ----------------
  async update(id: number, isMain?: boolean): Promise<ApiResponse<ProductImage>> {
    const image = await this.prisma.productImage.findUnique({ where: { id } });
    if (!image) throw new NotFoundException(`ProductImage ${id} not found`);

    if (isMain === false) {
      const productImages = await this.prisma.productImage.findMany({ where: { productId: image.productId } });
      if (productImages.length === 1) {
        throw new BadRequestException(`Cannot unset main image: this is the only image of the product`);
      }

      const otherMainImage = productImages.find(img => img.isMain && img.id !== id);
      if (!otherMainImage) {
        const firstOther = productImages.find(img => img.id !== id);
        if (firstOther) {
          await this.prisma.productImage.update({
            where: { id: firstOther.id },
            data: { isMain: true },
          });
        }
      }
    }

    if (isMain === true) {
      await this.prisma.productImage.updateMany({
        where: { productId: image.productId, id: { not: id } },
        data: { isMain: false },
      });
    }

    const updated = await this.prisma.productImage.update({
      where: { id },
      data: { isMain: isMain ?? image.isMain },
    });

    return wrapResponse(formatSingle(updated, this.basePath));
  }

  // ---------------- DELETE ----------------
  async remove(id: number): Promise<ApiResponse<ProductImage>> {
    const image = await this.prisma.productImage.findUnique({ where: { id } });
    if (!image) throw new NotFoundException(`ProductImage ${id} not found`);

    if (image.isMain) throw new BadRequestException('Cannot delete the main image of the product');

    await this.deleteFile(image.url);
    await this.prisma.productImage.delete({ where: { id } });

    return wrapResponse(formatSingle(image, this.basePath));
  }

  // ---------------- GET ALL BY PRODUCT ----------------
  async findAllByProduct(productId: number): Promise<ApiResponse<ProductImage[]>> {
    const images = await this.prisma.productImage.findMany({ where: { productId } });
    const { data, meta, links } = formatList(images, this.basePath);
    return wrapResponse(data, meta, links);
  }

  // ---------------- HELPERS ----------------
  private async saveUploadedFile(file: Express.Multer.File): Promise<string> {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileExt = extname(file.originalname);
    const filename = `product-${uniqueSuffix}${fileExt}`;
    const filepath = path.join(this.uploadDir, filename);
    await fs.writeFile(filepath, file.buffer);
    return `/uploads/product/${filename}`;
  }

  private async deleteFile(fileUrl: string) {
    const filePath = path.join(process.cwd(), fileUrl);
    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
    } catch { }
  }
}
