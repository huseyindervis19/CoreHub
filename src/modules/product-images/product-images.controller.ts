import { Controller, Post, Patch, Delete, Get, Param, Body, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductImageService } from './product-images.service';
import { CreateProductImageDto } from './dto/create-product-image.dto';
import { UpdateProductImageDto } from './dto/update-product-image.dto';

@Controller('product-images')
export class ProductImageController {
  constructor(private readonly productImageService: ProductImageService) { }

  // ---------------- CREATE ----------------
  @Post()
  @UseInterceptors(FileInterceptor('url'))
  async create(
    @Body() dto: CreateProductImageDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.productImageService.create(dto, file);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductImageDto,
  ) {
    return this.productImageService.update(Number(id), dto.isMain);
  }

  // ---------------- DELETE ----------------
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.productImageService.remove(Number(id));
  }

  // ---------------- GET ALL BY PRODUCT ----------------
  @Get('product/:productId')
  async getByProductId(@Param('productId') productId: string) {
    return this.productImageService.findAllByProduct(Number(productId));
  }
}
