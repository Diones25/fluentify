import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import { ProgressService } from './progress.service.js';

@UseGuards(JwtAuthGuard)
@Controller('progress')
export class ProgressController {
  constructor(private progress: ProgressService) { }

  @Get() summary(@CurrentUser() u: { id: string }) {
    return this.progress.summary(u.id);
  }

  @Get('weak-points') weak(@CurrentUser() u: { id: string }) {
    return this.progress.weakPoints(u.id);
  }

  @Post('practice') practice(@CurrentUser() u: { id: string }) {
    return this.progress.practice(u.id);
  }
}
