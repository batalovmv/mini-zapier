import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

declare const process: {
  env: Record<string, string | undefined>;
};

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  const port = Number(process.env.PORT ?? '3000');

  app.get(PrismaService);

  await app.listen(port);
}

void bootstrap();
