import { Module } from '@nestjs/common';
import { ProgressModule } from '../progress/progress.module.js';
import { ReviewsModule } from '../reviews/reviews.module.js';
import { LessonsController } from './lessons.controller.js';
import { LessonsService } from './lessons.service.js';

@Module({
  imports: [ProgressModule, ReviewsModule],
  controllers: [LessonsController],
  providers: [LessonsService]
})
export class LessonsModule {}
