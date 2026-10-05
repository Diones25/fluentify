import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProgressService } from '../progress/progress.service.js';

@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService, private progress: ProgressService) { }
  
  async today(userId: string) {
    const plan = await this.prisma.studyPlan.findFirst({
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
      this.prisma.planDay.findFirst({
        where: { planId: plan.id, completedAt: null },
        orderBy: { dayNumber: 'asc' },
        include: { lessons: { orderBy: { order: 'asc' } } },
      }),
      this.prisma.planDay.count({ where: { planId: plan.id } }),
      this.prisma.planDay.count({ where: { planId: plan.id, completedAt: { not: null } } }),
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
    const day = await this.prisma.planDay.findFirst({ where: { id: dayId, plan: { userId } } });
    if (!day) throw new NotFoundException('Dia não encontrado');
    if (day.completedAt) return day;

    const updated = await this.prisma.planDay.update({ where: { id: dayId }, data: { completedAt: new Date() } });
    await this.progress.registerActivity(userId);
    return updated;
  }
}
