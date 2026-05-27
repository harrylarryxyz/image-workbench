import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: process.env.WEB_ORIGIN?.split(',') ?? true, credentials: true });
  const port = Number(process.env.API_PORT ?? 3100);
  const host = process.env.API_HOST ?? '127.0.0.1';
  await app.listen(port, host);
}

void bootstrap();
