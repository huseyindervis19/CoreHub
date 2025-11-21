import { Controller, Get, Post, Patch, Delete, Param, Body, UploadedFile, UseInterceptors, Query } from '@nestjs/common';
import { CategoryService } from './categories.service';
import { ProductService } from '../products/products.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService, private readonly productService: ProductService,) { }

  @Post()
  @UseInterceptors(FileInterceptor('imageUrl'))
  async create(@Body() dto: CreateCategoryDto, @UploadedFile() file: Express.Multer.File) {
    return this.categoryService.create(dto, file);
  }

  @Get()
  async findAllByLanguage(@Query('lang') lang: string) {
    return this.categoryService.findAllByLanguage(lang);
  }

  @Get('landing')
  async landingCategories(@Query('lang') lang: string) {
    return this.categoryService.findLandingPageCategories(lang);
  }

  @Get(':id/products')
  async getProductsByCategory(
    @Param('id') id: string,
    @Query('lang') lang: string
  ) {
    return this.productService.findByCategory(Number(id), lang);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Query('lang') lang: string) {
    return this.categoryService.findOne(Number(id), lang);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('imageUrl'))
  async update(@Param('id') id: string, @Query('lang') lang: string, @Body() dto: UpdateCategoryDto, @UploadedFile() file: Express.Multer.File) {
    return this.categoryService.update(Number(id), lang, dto, file);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.categoryService.remove(Number(id));
  }
}
