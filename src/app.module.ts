import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { LanguagesModule } from './modules/languages/languages.module';
import { TranslationKeyModule } from './modules/translation-keys/translation-keys.module';
import { TranslationModule } from './modules/translations/translations.module';
import { DynamicTranslationModule } from './modules/dynamic-translations/dynamic-translations.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { RolePermissionModule } from './modules/role-permissions/role-permissions.module';
import { UsersModule } from './modules/users/users.module';
import { UserRolesModule } from './modules/user-roles/user-roles.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoryModule } from './modules/categories/categories.module';
import { ProductModule } from './modules/products/products.module';
import { ProductImageModule } from './modules/product-images/product-images.module';
import { HomeSliderModule } from './modules/home-slider/home-slider.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    LanguagesModule,
    TranslationKeyModule,
    TranslationModule,
    DynamicTranslationModule,
    RolesModule,
    PermissionsModule,
    RolePermissionModule,
    UsersModule,
    UserRolesModule,
    AuthModule,
    CategoryModule,
    ProductModule,
    ProductImageModule,
    HomeSliderModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
