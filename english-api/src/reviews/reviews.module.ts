import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service.js';
import { ReviewsController } from './reviews.controller.js';

@Module({
  providers: [ReviewsService],
  exports: [ReviewsService],
  controllers: [ReviewsController]
})
export class ReviewsModule {}
