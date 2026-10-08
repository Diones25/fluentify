import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { EvaluateDto } from './dto/evaluate.dto.js';
import { UsageService } from '../ai/usage.service.js';

const normalize = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9'\s]/g, '').split(/\s+/).filter(Boolean);

/** Marca quais palavras de "a" aparecem em "b" respeitando a ordem. */
function lcsMatches(a: string[], b: string[]): boolean[] {
  const dp = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const matched = Array<boolean>(a.length).fill(false);
  let i = a.length, j = b.length;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) { matched[i - 1] = true; i--; j--; }
    else if (dp[i - 1][j] >= dp[i][j - 1]) i--;
    else j--;
  }
  return matched;
}

@Injectable()
export class SpeakingService {
  private readonly logger = new Logger(SpeakingService.name);
  constructor(
    private prisma: PrismaService,
    private readonly ai: AiService,
    private readonly usage: UsageService
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

    return { score, words, tip };
  }
}
