import { Injectable, NotFoundException } from '@nestjs/common';
import { GamificationService, XP } from '../gamification/gamification.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProgressService } from '../progress/progress.service.js';
import { ReviewsService } from '../reviews/reviews.service.js';
import { LevelService } from '../profile/level.service.js';

@Injectable()
export class LessonsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly progressService: ProgressService,
    private readonly reviewService: ReviewsService,
    private readonly levelService: LevelService,
    private readonly gameService: GamificationService
  ) { }

  async today(userId: string) {
    const plan = await this.prismaService.studyPlan.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    if (!plan) return {
      plan: null,
      day: null,
      totalDays: 0,
      completedDays: 0
    };

    const [day, totalDays, completedDays] = await Promise.all([
      this.prismaService.planDay.findFirst({
        where: { planId: plan.id, completedAt: null },
        orderBy: { dayNumber: 'asc' },
        include: { lessons: { orderBy: { order: 'asc' } } },
      }),
      this.prismaService.planDay.count({ where: { planId: plan.id } }),
      this.prismaService.planDay.count({ where: { planId: plan.id, completedAt: { not: null } } }),
    ]);

    return {
      plan: {
        id: plan.id
      },
      day,
      totalDays,
      completedDays
    }; // day = null => plano concluído
  }

  async complete(userId: string, dayId: string) {
    // Segurança: só conclui se o dia pertence a um plano DESTE usuário.
    const day = await this.prismaService.planDay.findFirst({ where: { id: dayId, plan: { userId } } });
    if (!day) throw new NotFoundException('Dia não encontrado');
    if (day.completedAt) return { alreadyDone: true as const };

    const updated = await this.prismaService.planDay.update({ where: { id: dayId }, data: { completedAt: new Date() } });

    // (5) vocabulário vira cartões de revisão
    const vocab = await this.prismaService.lesson.findMany({ where: { planDayId: dayId, type: 'VOCAB' } });
    const cards = vocab.flatMap((l) =>
      ((l.content as { items: { word: string; translation: string; example: string }[] }).items).map((i) => ({
        front: i.word,
        back: `${i.translation}: "${i.example}"`,
      })),
    );
    await this.reviewService.addMany(userId, cards);

    // (9) streak com congelador e fuso
    const streak = await this.progressService.registerActivity(userId);

    // (10) XP e conquistas
    const xp = await this.gameService.award(userId, XP.DAY);
    const newAchievements = await this.gameService.check(userId);

    // (8) a cada semana de estudo concluída, recalibra o nível
    const profile = await this.prismaService.profile.findUnique({ where: { userId } });
    const done = await this.prismaService.planDay.count({ where: { planId: day.planId, completedAt: { not: null } } });
    const levelChange = profile && done % profile.daysPerWeek === 0 ? await this.levelService.recalibrate(userId) : null;

    return {
      day: updated,
      xpGained: XP.DAY,
      ...xp,
      streak: { current: streak.current, usedFreeze: streak.usedFreeze, earnedFreeze: streak.earnedFreeze },
      newAchievements,
      levelChange,
    };
  }
}
