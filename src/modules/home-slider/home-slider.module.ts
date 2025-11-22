import { Module } from '@nestjs/common';
import { HomeSliderService } from './home-slider.service';
import { HomeSliderController } from './home-slider.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductModule } from '../products/products.module';

@Module({
  imports: [PrismaModule, ProductModule],
  providers: [HomeSliderService],
  controllers: [HomeSliderController]
})
export class HomeSliderModule {}