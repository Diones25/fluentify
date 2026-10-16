import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import { pipeSse } from '../common/sse.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { TutorService } from './tutor.service.js';
import { UsageService } from '../ai/usage.service.js';

@UseGuards(JwtAuthGuard)
@Controller('tutor')
export class TutorController {
  constructor(
    private tutor: TutorService,
    private readonly usage: UsageService
  ) { }

  @Throttle({ default: { limit: 20, ttl: 60_000 } }) // 20 mensagens/min
  @Post('message')
  async message(@CurrentUser() u: { id: string }, @Body() dto: SendMessageDto, @Res() res: Response) {
    await this.usage.assertWithinQuota(u.id, 'tutor');
    await pipeSse(res, this.tutor.reply(u.id, dto));
  }
}
