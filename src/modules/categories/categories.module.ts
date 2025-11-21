import { Module } from '@nestjs/common';
import { CategoryService } from './categories.service';
import { CategoryController } from './categories.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductModule } from '../products/products.module';

@Module({
  imports: [PrismaModule, ProductModule],
  providers: [CategoryService],
  controllers: [CategoryController]
})
export class CategoryModule {}