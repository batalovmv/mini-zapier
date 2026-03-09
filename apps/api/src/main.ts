import 'reflect-metadata';

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
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Mini-Zapier API')
    .setDescription('REST API for workflows, triggers, executions, connections, and stats.')
    .setVersion('1.0.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors({
    origin: 'http://localhost:5173',
  });
  SwaggerModule.setup('/api/docs', app, swaggerDocument);

  app.get(PrismaService);

  await app.listen(port);
}

void bootstrap();
