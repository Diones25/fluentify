import { Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import { LessonsService } from './lessons.service.js';

@UseGuards(JwtAuthGuard)
@Controller('lessons')
export class LessonsController {
  constructor(private lessons: LessonsService) { }

  @Get('today') today(@CurrentUser() u: { id: string }) {
    return this.lessons.today(u.id);
  }

  @Post('days/:id/complete')
  complete(@CurrentUser() u: { id: string }, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.lessons.complete(u.id, id);
  }
}
