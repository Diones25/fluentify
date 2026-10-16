import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProgressService } from '../progress/progress.service.js';
import { ReviewsService } from '../reviews/reviews.service.js';

@Injectable()
export class LessonsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly progressService: ProgressService,
    private readonly reviewService: ReviewsService
  ) {}
  
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
    if (day.completedAt) return day;

    const updated = await this.prismaService.planDay.update({ where: { id: dayId }, data: { completedAt: new Date() } });
    await this.progressService.registerActivity(userId);

    const vocab = await this.prismaService.lesson.findMany({ where: { planDayId: dayId, type: 'VOCAB' } });
    const cards = vocab.flatMap((l) =>
      ((l.content as { items: { word: string; translation: string; example: string }[] }).items).map((i) => ({
        front: i.word,
        back: `${i.translation}: "${i.example}"`,
      })),
    );
    await this.reviewService.addMany(userId, cards);

    return updated;
  }
}
