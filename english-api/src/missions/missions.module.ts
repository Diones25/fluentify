import { Module } from '@nestjs/common';
import { GamificationModule } from '../gamification/gamification.module.js';
import { TutorModule } from '../tutor/tutor.module.js';
import { MissionsController } from './missions.controller.js';
import { MissionsService } from './missions.service.js';

@Module({
  imports: [TutorModule, GamificationModule],
  controllers: [MissionsController],
  providers: [MissionsService]
})
export class MissionsModule {}
