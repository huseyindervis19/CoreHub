import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  const configService = app.get(ConfigService);
  const origins = configService.get<string>('CORS_ORIGIN');

  app.enableCors({
    origin: origins
      ? origins.split(',')
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });

  // Global Exception Filter for Prisma errors
  app.useGlobalFilters(new PrismaExceptionFilter());

  // Global Validation Pipe for DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
