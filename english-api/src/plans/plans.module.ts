import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { Redis } from 'ioredis';
import { PlansController } from './plans.controller.js';
import { PlansService } from './plans.service.js';
import { PlansProcessor } from './plans.processor.js';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (c: ConfigService) => ({
        connection: new Redis({
          host: c.get('REDIS_HOST') ?? 'localhost',
          port: Number(c.get('REDIS_PORT') ?? 6379),
          maxRetriesPerRequest: null,
        }),
      }),
    }),
    BullModule.registerQueue({ name: 'plans' }),
    BullBoardModule.forFeature({ name: 'plans', adapter: BullMQAdapter }),
  ],
  controllers: [PlansController],
  providers: [PlansService, PlansProcessor]
})
export class PlansModule {}
