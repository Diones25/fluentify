import { Module } from '@nestjs/common';
import { ReviewsModule } from '../reviews/reviews.module.js';
import { SpeakingController } from './speaking.controller.js';
import { SpeakingService } from './speaking.service.js';

@Module({
  imports: [ReviewsModule],
  controllers: [SpeakingController],
  providers: [SpeakingService]
})
export class SpeakingModule {}
