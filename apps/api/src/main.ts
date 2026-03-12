import 'reflect-metadata';

import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaService } from './prisma/prisma.service';

declare const process: {
  env: Record<string, string | undefined>;
};

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  const port = Number(process.env.PORT ?? '3000');
  const isProduction = process.env.NODE_ENV === 'production';

  // Trust first proxy (nginx) for correct client IP via X-Forwarded-For
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  // CORS: split CORS_ORIGIN by comma, fallback to localhost for dev
  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:5173'];
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  // Swagger only in non-production
  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Mini-Zapier API')
      .setDescription('REST API for workflows, triggers, executions, connections, and stats.')
      .setVersion('1.0.0')
      .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('/api/docs', app, swaggerDocument);
  }

  app.get(PrismaService);

  await app.listen(port);
}

void bootstrap();
