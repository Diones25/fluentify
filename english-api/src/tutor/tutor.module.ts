import { Module } from '@nestjs/common';
import { ReviewsModule } from '../reviews/reviews.module.js';
import { TutorController } from './tutor.controller.js';
import { TutorService } from './tutor.service.js';

@Module({
  imports: [ReviewsModule],
  controllers: [TutorController],
  providers: [TutorService]
})
export class TutorModule {}
