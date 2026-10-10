import { Controller, ForbiddenException, Get, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import { PlansService } from './plans.service.js';
import { UsageService } from '../ai/usage.service.js';

@UseGuards(JwtAuthGuard)
@Controller('plans')
export class PlansController {
  constructor(
    private readonly plansService: PlansService,
    private readonly usageService: UsageService,
    @InjectQueue('plans') private readonly queue: Queue
  ) {}

  // Rota cara (várias chamadas de IA): limite de 3 por hora.
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @Post('generate')
  async generate(@CurrentUser() u: { id: string }) {
    await this.usageService.assertWithinQuota(u.id, 'plan');
    const job = await this.queue.add(
      'generate',
      {
        userId: u.id 
      },
      {
        attempts: 2, // tenta de novo se falhar
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { age: 3600 },
        removeOnFail: { age: 86400 }
      }
    );
    return { jobId: job.id }; // o status HTTP padrão do POST é 201; o front só precisa do jobId
  }

  @Get('jobs/:id')
  async job(@CurrentUser() u: { id: string }, @Param('id') id: string) {
    const job = await this.queue.getJob(id);
    if (!job) {
      throw new NotFoundException();
    }
    if (job.data.userId !== u.id) {
      throw new ForbiddenException(); // nunca mostre o job dos outros
    }
    const state = await job.getState(); // waiting | active | completed | failed | delayed
    return {
      state,
      result: job.returnvalue ?? null,
      error: state === 'failed' ? job.failedReason : null
    };
  }

  @Get('active')
  active(@CurrentUser() u: { id: string }) {
    return this.plansService.active(u.id);
  }
}
