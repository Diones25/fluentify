import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { EvaluateDto } from './dto/evaluate.dto.js';
import { UsageService } from '../ai/usage.service.js';
import { ReviewsService } from '../reviews/reviews.service.js';
import { GamificationService, XP } from '../gamification/gamification.service.js';
import { lcsMatches, normalize } from './lcs.js';

@Injectable()
export class SpeakingService {
  private readonly logger = new Logger(SpeakingService.name);
  constructor(
    private prisma: PrismaService,
    private readonly ai: AiService,
    private readonly usage: UsageService,
    private readonly reviews: ReviewsService,
    private readonly game: GamificationService
  ) { }

  async evaluate(userId: string, dto: EvaluateDto) {
    const expected = normalize(dto.expected);
    const spoken = normalize(dto.transcript);
    const matched = lcsMatches(expected, spoken);

    const words = expected.map((word, i) => ({ word, ok: matched[i] }));
    const score = expected.length ? Math.round((matched.filter(Boolean).length / expected.length) * 100) : 0;

    // Dica da IA só quando errou bastante (economiza dinheiro).
    let tip: string | null = null;

    try {
      await this.usage.assertWithinQuota(userId, 'tip'); /* ...gera a dica... */
    }
    catch {
      /* sem dica hoje */
    }

    if (score < 80) {
      try {
        tip = await this.ai.text(
          'You are a pronunciation coach for Brazilian Portuguese speakers learning English. Answer in Portuguese, max 2 short sentences.',
          `Frase esperada: "${dto.expected}". O aluno falou: "${dto.transcript}". Dê uma dica prática.`,
          { userId, feature: 'tip' },
          { tier: 'fast', maxTokens: 150 },
        );
      } catch (e) {
        this.logger.warn(`Falha ao gerar dica: ${(e as Error).message}`);
      }
    }

    // Frase falada mal (< 80%) vira cartão de revisão.
    if (score < 80) {
      await this.reviews.addMany(userId, [{ front: dto.expected, back: dto.translation ?? 'Repita em voz alta' }]);
    }

    // XP: só na 1ª vez que acerta ≥ 90% NESTE exercício (evita abuso).
    let xpGained = 0;
    if (score >= 90 && dto.lessonId) {
      const already = await this.prisma.attempt.count({ where: { userId, lessonId: dto.lessonId, score: { gte: 90 } } });
      if (already === 0) xpGained = XP.SPEAKING_GREAT;
    }

    await this.prisma.attempt.create({
      data: {
        userId,
        lessonId: dto.lessonId,
        expected: dto.expected,
        transcript: dto.transcript,
        score,
        feedback: { words, tip },
      },
    });

    if (xpGained) await this.game.award(userId, xpGained);
    const newAchievements = score === 100 ? await this.game.check(userId) : [];

    return { score, words, tip, xpGained, newAchievements };
  }
}
