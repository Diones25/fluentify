import { Controller, Get, UseGuards } from '@nestjs/common';
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
}