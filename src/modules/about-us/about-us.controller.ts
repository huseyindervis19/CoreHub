import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UploadedFile,
  UseInterceptors,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { AboutUsService } from './about-us.service';
import { CreateAboutUsDto } from './dto/create-about-us.dto';
import { UpdateAboutUsDto } from './dto/update-about-us.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('about-us')
export class AboutUsController {
  constructor(private readonly aboutUsService: AboutUsService) {}

  // ----------- CREATE (ADMIN) -----------
  @Post()
  @UseInterceptors(FileInterceptor('imageUrl'))
  async create(
    @Body() dto: CreateAboutUsDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.aboutUsService.create(dto, file);
  }

  // ----------- GET TRANSLATED (PUBLIC) -----------
  @Get()
  async getData(@Query('lang') lang: string) {
    if (!lang) throw new BadRequestException('lang is required');
    return this.aboutUsService.getByLanguage(lang);
  }

  // ----------- UPDATE (ADMIN) -----------
  @Patch(':id')
  @UseInterceptors(FileInterceptor('imageUrl'))
  async update(
    @Param('id') id: string,
    @Query('lang') lang: string,
    @Body() dto: UpdateAboutUsDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.aboutUsService.update(Number(id), lang, dto, file);
  }

  // ----------- DELETE (ADMIN) -----------
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.aboutUsService.remove(Number(id));
  }
}
