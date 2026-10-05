import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import { EvaluateDto } from './dto/evaluate.dto.js';
import { SpeakingService } from './speaking.service.js';

@UseGuards(JwtAuthGuard)
@Controller('speaking')
export class SpeakingController {
  constructor(private speaking: SpeakingService) { }

  @Post('evaluate')
  evaluate(@CurrentUser() u: { id: string }, @Body() dto: EvaluateDto) {
    return this.speaking.evaluate(u.id, dto);
  }
}
