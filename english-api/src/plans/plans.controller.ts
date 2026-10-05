import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import { PlansService } from './plans.service.js';

@UseGuards(JwtAuthGuard)
@Controller('plans')
export class PlansController {
  constructor(private plans: PlansService) { }

  // Rota cara (várias chamadas de IA): limite de 3 por hora.
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @Post('generate')
  generate(@CurrentUser() u: { id: string }) {
    return this.plans.generate(u.id);
  }

  @Get('active')
  active(@CurrentUser() u: { id: string }) {
    return this.plans.active(u.id);
  }
}
