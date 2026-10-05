import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { TutorService } from './tutor.service.js';

@UseGuards(JwtAuthGuard)
@Controller('tutor')
export class TutorController {
  constructor(private tutor: TutorService) { }

  @Throttle({ default: { limit: 20, ttl: 60_000 } }) // 20 mensagens/min
  @Post('message')
  async message(@CurrentUser() u: { id: string }, @Body() dto: SendMessageDto, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      for await (const ev of this.tutor.reply(u.id, dto)) {
        res.write(`data: ${JSON.stringify(ev)}\n\n`); // formato SSE
      }
    } catch {
      res.write(`data: ${JSON.stringify({ type: 'error' })}\n\n`);
    } finally {
      res.end();
    }
  }
}
