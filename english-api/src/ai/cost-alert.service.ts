import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CostAlertService {
  private readonly logger = new Logger(CostAlertService.name);
  constructor(private prisma: PrismaService, private config: ConfigService) { }

  @Cron(CronExpression.EVERY_HOUR)
  async check() {
    const day = new Date().toISOString().slice(0, 10);
    const agg = await this.prisma.aiUsage.aggregate({
      where: { day },
      _sum: { inputTokens: true, outputTokens: true },
    });
    const total = (agg._sum.inputTokens ?? 0) + (agg._sum.outputTokens ?? 0);
    const limit = Number(this.config.get('AI_DAILY_TOKEN_ALERT') ?? 2_000_000);
    if (total > limit) {
      // Esse logger.error pode virar um alerta de e-mail.
      this.logger.error(`Consumo de IA acima do limite hoje: ${total} tokens`);
    }
  }
}
