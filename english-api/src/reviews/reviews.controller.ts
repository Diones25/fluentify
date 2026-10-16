import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { IsInt, Max, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import { ReviewsService } from './reviews.service.js';
import { Quality } from './sm2.js';

class GradeDto {
  @IsInt() @Min(0) @Max(5) quality: number;
}

@UseGuards(JwtAuthGuard)
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) { }

  @Get('due')
  due(@CurrentUser() u: { id: string }) {
    return this.reviewsService.due(u.id);
  }

  @Post(':id/grade')
  grade(@CurrentUser() u: { id: string }, @Param('id', new ParseUUIDPipe()) id: string, @Body() dto: GradeDto) {
    return this.reviewsService.grade(u.id, id, dto.quality as Quality);
  }
}
