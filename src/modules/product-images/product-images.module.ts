import { Module } from '@nestjs/common';
import { ProductImageService } from './product-images.service';
import { ProductImageController } from './product-images.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ProductImageService],
  controllers: [ProductImageController],
})
export class ProductImageModule {}
