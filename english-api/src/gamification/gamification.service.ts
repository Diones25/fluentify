import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export const XP = { DAY: 50, SPEAKING_GREAT: 10, MISSION: 100 } as const;

export const ACHIEVEMENTS: Record<string, { title: string; desc: string; emoji: string }> = {
  FIRST_DAY: { title: 'Primeiro passo', desc: 'Concluiu seu primeiro dia', emoji: '🌱' },
  DAYS_10: { title: 'Dedicação', desc: 'Concluiu 10 dias de estudo', emoji: '📚' },
  STREAK_7: { title: 'Uma semana', desc: '7 dias seguidos', emoji: '🔥' },
  STREAK_30: { title: 'Imparável', desc: '30 dias seguidos', emoji: '🏆' },
  PERFECT_SPEECH: { title: 'Fala perfeita', desc: 'Tirou 100% em um exercício de fala', emoji: '🎯' },
  MEMORY_25: { title: 'Memória de elefante', desc: '25 cartões dominados', emoji: '🐘' },
  FIRST_MISSION: { title: 'Missão cumprida', desc: 'Completou sua primeira missão', emoji: '🎬' },
};

// Nível do jogador: 100 XP => nível 2, 400 => 3, 900 => 4 ...
export const levelFromXp = (xp: number) => Math.floor(Math.sqrt(xp / 100)) + 1;
export const xpForLevel = (level: number) => (level - 1) ** 2 * 100;

@Injectable()
export class GamificationService {
  constructor(private readonly prisma: PrismaService) { }

  async award(userId: string, amount: number) {
    const u = await this.prisma.user.update({ where: { id: userId }, data: { xp: { increment: amount } }, select: { xp: true } });
    return { xp: u.xp, level: levelFromXp(u.xp) };
  }

  /** Confere as regras e devolve só as conquistas NOVAS. */
  async check(userId: string) {
    const [days, streak, perfect, learned, missions, owned] = await Promise.all([
      this.prisma.planDay.count({ where: { plan: { userId }, completedAt: { not: null } } }),
      this.prisma.streak.findUnique({ where: { userId } }),
      this.prisma.attempt.count({ where: { userId, score: 100 } }),
      this.prisma.reviewCard.count({ where: { userId, reps: { gte: 3 } } }),
      this.prisma.missionRun.count({ where: { userId, completedAt: { not: null } } }), // missões concluídas (item 11)
      this.prisma.userAchievement.findMany({ where: { userId }, select: { code: true } }),
    ]);

    const rules: Record<string, boolean> = {
      FIRST_DAY: days >= 1,
      DAYS_10: days >= 10,
      STREAK_7: (streak?.best ?? 0) >= 7,
      STREAK_30: (streak?.best ?? 0) >= 30,
      PERFECT_SPEECH: perfect >= 1,
      MEMORY_25: learned >= 25,
      FIRST_MISSION: missions >= 1,
    };

    const have = new Set(owned.map((o) => o.code));
    const fresh = Object.keys(rules).filter((code) => rules[code] && !have.has(code));
    if (fresh.length) {
      await this.prisma.userAchievement.createMany({ data: fresh.map((code) => ({ userId, code })), skipDuplicates: true });
    }
    return fresh.map((code) => ({ code, ...ACHIEVEMENTS[code] }));
  }
}
