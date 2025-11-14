import { Controller, Get, Post, Patch, Delete, Param, Body, UploadedFile, UseInterceptors, Query, UseGuards } from '@nestjs/common';
import { CategoryService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // ---------------- CREATE ----------------
  @Post()
  @UseInterceptors(FileInterceptor('image_url'))
  async create(
    @Body() dto: CreateCategoryDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.categoryService.create(dto, file);
  }

  // ---------------- READ ALL ----------------
  @Get('all')
  async findAll() {
    return this.categoryService.findAll();
  }

  // ---------------- READ ALL BY LANGUAGE ----------------
  @Get()
  async findAllByLanguage(@Query('lang') lang: string) {
    return this.categoryService.findAllByLanguage(lang);
  }

  // ---------------- READ ONE ----------------
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.categoryService.findOne(Number(id));
  }

  // ---------------- UPDATE FULL ----------------
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image_url'))
  async update(
    @Param('id') id: string,
    @Query('lang') lang: string,
    @Body() dto: UpdateCategoryDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.categoryService.update(Number(id), lang, dto, file);
  }

  // ---------------- DELETE ----------------
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.categoryService.remove(Number(id));
  }
}

