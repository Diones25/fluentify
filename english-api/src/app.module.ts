import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module.js';
import { ProfileModule } from './profile/profile.module.js';
import { PlansModule } from './plans/plans.module.js';
import { LessonsModule } from './lessons/lessons.module.js';
import { SpeakingModule } from './speaking/speaking.module.js';
import { TutorModule } from './tutor/tutor.module.js';
import { ProgressModule } from './progress/progress.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AiModule } from './ai/ai.module.js';
import { ScheduleModule } from '@nestjs/schedule';
import basicAuth from 'express-basic-auth';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { LoggerModule } from 'nestjs-pino';
import { APP_FILTER } from '@nestjs/core';
import { SentryModule, SentryGlobalFilter } from '@sentry/nestjs/setup';
import { HealthController } from './health.controller.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    SentryModule.forRoot(),
    ScheduleModule.forRoot(), // Habilita o @Cron() e outros agendamentos
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'english-api',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 60
      }// 60 req/min por IP
    ]),
    BullBoardModule.forRoot({
      route: '/queues',
      adapter: ExpressAdapter,
      middleware: basicAuth({
        challenge: true,
        users: { [process.env.DASHBOARD_USER ?? 'admin']: process.env.DASHBOARD_PASS ?? 'admin' },
      }),
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        redact: ['req.headers.authorization', 'req.headers.cookie'], // nunca logue token!
        transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
      },
    }),
    AuthModule,
    ProfileModule,
    PlansModule,
    LessonsModule,
    SpeakingModule,
    TutorModule,
    ProgressModule,
    PrismaModule,
    AiModule,
  ],
  controllers: [
    HealthController
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    },
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter
    }
  ],
})
export class AppModule {}
