import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { HomeSliderService } from './home-slider.service';
import { CreateHomeSliderDto } from './dto/create-home-slider.dto';
import { UpdateHomeSliderDto } from './dto/update-home-slider.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('home-slider')
export class HomeSliderController {
  constructor(private readonly homeSliderService: HomeSliderService) {}

  // ----------- CREATE -----------
  @Post()
  @UseInterceptors(FileInterceptor('imageUrl'))
  async create(
    @Body() dto: CreateHomeSliderDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.homeSliderService.create(dto, file);
  }

  // ----------- GET ALL BY LANGUAGE -----------
  @Get()
  async getAllByLanguage(@Query('lang') lang: string) {
    return this.homeSliderService.getAllByLanguage(lang);
  }

  // ----------- UPDATE -----------
  @Patch(':id')
  @UseInterceptors(FileInterceptor('imageUrl'))
  async update(
    @Param('id') id: string,
    @Query('lang') lang: string,
    @Body() dto: UpdateHomeSliderDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.homeSliderService.update(Number(id), lang, dto, file);
  }

  // ----------- DELETE -----------
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.homeSliderService.remove(Number(id));
  }
}
