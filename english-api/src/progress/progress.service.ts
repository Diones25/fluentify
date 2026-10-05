import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

const TZ = 'America/Fortaleza'; // fuso do aluno. Melhoria: guardar o fuso no perfil.

const dayKey = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: TZ }); // "2026-10-03"

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) { }

  /** Chamado quando o aluno conclui uma lição do dia. */
  async registerActivity(userId: string) {
    const today = dayKey(new Date());
    const yesterday = dayKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
    const s = await this.prisma.streak.findUnique({ where: { userId } });

    if (!s) {
      return this.prisma.streak.create({ data: { userId, current: 1, best: 1, lastActiveDay: today } });
    }
    if (s.lastActiveDay === today) return s; // já contou hoje

    const current = s.lastActiveDay === yesterday ? s.current + 1 : 1;
    return this.prisma.streak.update({
      where: { userId },
      data: { current, best: Math.max(s.best, current), lastActiveDay: today },
    });
  }

  async summary(userId: string) {
    const [streak, completedDays, recent] = await Promise.all([
      this.prisma.streak.findUnique({ where: { userId } }),
      this.prisma.planDay.count({ where: { plan: { userId }, completedAt: { not: null } } }),
      this.prisma.attempt.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 20, select: { score: true, createdAt: true } }),
    ]);
    const avgScore = recent.length ? Math.round(recent.reduce((a, b) => a + b.score, 0) / recent.length) : null;
    return {
      streak: { current: streak?.current ?? 0, best: streak?.best ?? 0 },
      completedDays,
      avgScore,
      recentScores: recent.reverse(),
    };
  }
}
