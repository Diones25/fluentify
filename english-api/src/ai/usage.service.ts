import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';


// Limites diários por funcionalidade. Mais tarde (item 20) viram por plano (FREE/PRO).
export const LIMITS = {
  FREE: { tutor: 30, tip: 40, plan: 3, analysis: 60, mission: 40 },
} as const;
export type Feature = keyof (typeof LIMITS)['FREE'];

@Injectable()
export class UsageService {
  constructor(private readonly prisma: PrismaService) { }
  
  private today() {
    return new Date().toISOString().slice(0, 10);
  }

  async record(userId: string, feature: string, inputTokens: number, outputTokens: number) {
    const day = this.today();
    await this.prisma.aiUsage.upsert({
      where: { userId_day_feature: { userId, day, feature } },
      create: { userId, day, feature, inputTokens, outputTokens, calls: 1 },
      update: {
        inputTokens: { increment: inputTokens },
        outputTokens: { increment: outputTokens },
        calls: { increment: 1 },
      },
    });
  }

  /** Lança 429 se o usuário passou da cota de hoje. */
  async assertWithinQuota(userId: string, feature: Feature) {
    const limit = LIMITS.FREE[feature];
    const row = await this.prisma.aiUsage.findUnique({
      where: { userId_day_feature: { userId, day: this.today(), feature } },
    });
    if ((row?.calls ?? 0) >= limit) {
      throw new HttpException(
        { code: 'QUOTA_EXCEEDED', feature, message: 'Você atingiu o limite diário. Volte amanhã ou assine o plano PRO.' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}