import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ProductService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  // ---------------- CREATE ----------------
  @Post()
  async create(
    @Body() dto: CreateProductDto,
    @Query('lang') lang: string,
  ) {
    return this.productService.create(dto, lang);
  }

  // ---------------- READ ALL BY LANGUAGE ----------------
  @Get()
  async findAllByLanguage(@Query('lang') lang: string) {
    return this.productService.findAllByLanguage(lang);
  }

  // ---------------- READ 5 FOR LANDING PRODUCTS ----------------
  @Get('landing')
  async landingProducts(@Query('lang') lang: string) {
    return this.productService.findLandingPageProducts(lang);
  }

  // ---------------- READ ONE ----------------
  @Get(':id')
  async findOne(@Param('id') id: string, @Query('lang') lang: string) {
    return this.productService.findOne(Number(id), lang);
  }
  
  // ---------------- UPDATE ----------------
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Query('lang') lang: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productService.update(Number(id), lang, dto);
  }

  // ---------------- DELETE ----------------
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.productService.remove(Number(id));
  }
}
