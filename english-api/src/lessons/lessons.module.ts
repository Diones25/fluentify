import { Module } from '@nestjs/common';
import { ProgressModule } from '../progress/progress.module.js';
import { LessonsController } from './lessons.controller.js';
import { LessonsService } from './lessons.service.js';

@Module({
  imports: [ProgressModule],
  controllers: [LessonsController],
  providers: [LessonsService]
})
export class LessonsModule {}
