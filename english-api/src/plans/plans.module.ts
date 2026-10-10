import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PlansController } from './plans.controller.js';
import { PlansService } from './plans.service.js';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (c: ConfigService) => ({
        connection: {
          host: c.get('REDIS_HOST') ?? 'localhost',
          port: Number(c.get('REDIS_PORT') ?? 6379)
        },
      }),
    }),
    BullModule.registerQueue({ name: 'plans' }),
    BullBoardModule.forFeature({ name: 'plans', adapter: BullMQAdapter }),
  ],
  controllers: [PlansController],
  providers: [PlansService]
})
export class PlansModule {}
