import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { TranslationService } from './translations.service';
import { CreateTranslationDto } from './dto/create-translation.dto';
import { UpdateTranslationDto } from './dto/update-translation.dto';

@Controller('translations')
export class TranslationController {
  constructor(private readonly translationService: TranslationService) { }

  // ---------------- CREATE ----------------
  @Post()
  async create(@Body() data: CreateTranslationDto) {
    return this.translationService.create(data);
  }

  // ---------------- READ ALL ----------------
  @Get()
  async findAll() {
    return this.translationService.findAll();
  }

  // ---------------- READ BY LANGUAGE ----------------
  @Get('language/:languageId')
  async findByLanguage(@Param('languageId') languageId: string) {
    return this.translationService.findByLanguage(Number(languageId));
  }

  // ---------------- READ ONE ----------------
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.translationService.findOne(Number(id));
  }

  // ---------------- UPDATE ----------------
  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: UpdateTranslationDto) {
    return this.translationService.update(Number(id), data);
  }

  // ---------------- DELETE ----------------
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.translationService.remove(Number(id));
  }
}
