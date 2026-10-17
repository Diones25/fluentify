import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import { pipeSse } from '../common/sse.js';
import { SendMessageDto } from '../tutor/dto/send-message.dto.js';
import { MissionsService } from './missions.service.js';

@UseGuards(JwtAuthGuard)
@Controller('missions')
export class MissionsController {
  constructor(private readonly missions: MissionsService) { }

  @Get() list(@CurrentUser() u: { id: string }) { return this.missions.list(u.id); }

  @Post(':id/start') start(@CurrentUser() u: { id: string }, @Param('id') id: string) { return this.missions.start(u.id, id); }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('runs/:runId/message')
  async message(@CurrentUser() u: { id: string }, @Param('runId', new ParseUUIDPipe()) runId: string, @Body() dto: SendMessageDto, @Res() res: Response) {
    await this.missions.assertCanSend(u.id, runId); // antes de abrir o stream
    await pipeSse(res, this.missions.message(u.id, runId, dto));
  }

  @Post('runs/:runId/finish')
  finish(@CurrentUser() u: { id: string }, @Param('runId', new ParseUUIDPipe()) runId: string) {
    return this.missions.finish(u.id, runId);
  }
}
