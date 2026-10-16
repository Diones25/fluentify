import { Injectable } from '@nestjs/common';
import { Level } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';

const ORDER: Level[] = ['BEGINNER', 'ELEMENTARY', 'INTERMEDIATE', 'UPPER_INTERMEDIATE', 'ADVANCED'];

@Injectable()
export class LevelService {
  constructor(private prisma: PrismaService) { }

  /** Sobe ou desce o nível conforme as últimas tentativas de fala. */
  async recalibrate(userId: string): Promise<{ from: Level; to: Level; avgScore: number } | null> {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) return null;

    // só considera tentativas DEPOIS da última mudança, senão reavalia as mesmas sempre
    const last = await this.prisma.levelHistory.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
    const attempts = await this.prisma.attempt.findMany({
      where: { userId, createdAt: { gt: last?.createdAt ?? new Date(0) } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { score: true },
    });
    if (attempts.length < 10) return null; // poucos dados: não decide

    const avg = Math.round(attempts.reduce((a, b) => a + b.score, 0) / attempts.length);
    const idx = ORDER.indexOf(profile.level);
    let target = idx;
    if (avg >= 90 && idx < ORDER.length - 1) target = idx + 1;
    else if (avg <= 40 && idx > 0) target = idx - 1;
    if (target === idx) return null;

    await this.prisma.$transaction([
      this.prisma.profile.update({ where: { userId }, data: { level: ORDER[target] } }),
      this.prisma.levelHistory.create({ data: { userId, from: profile.level, to: ORDER[target], avgScore: avg } }),
    ]);
    return { from: profile.level, to: ORDER[target], avgScore: avg };
  }
}
