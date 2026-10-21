import './instrument.js';
import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
    bufferLogs: true,
  });

  app.use(cookieParser());

  // FRONTEND_URL aceita uma lista separada por vírgula (LAN, túnel, produção).
  // Em desenvolvimento liberamos qualquer origem para facilitar o teste no celular.
  const allowedOrigins = (process.env.FRONTEND_URL ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const isProd = process.env.NODE_ENV === 'production';

  app.enableCors({
    origin: !isProd || allowedOrigins.length === 0 ? true : allowedOrigins,
    credentials: true
  }); // credentials: permite cookie

  app.useLogger(app.get(Logger));

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
await bootstrap();
