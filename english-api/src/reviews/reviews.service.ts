import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Quality, sm2 } from './sm2.js';

const DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class ReviewsService {
  constructor(private readonly prismaService: PrismaService) { }

  /** Cria cartões novos, ignorando os que o aluno já tem. */
  async addMany(userId: string, cards: { front: string; back: string }[]) {
    const data = cards
      .filter((c) => c.front?.trim() && c.back?.trim())
      .map((c) => ({ userId, front: c.front.trim().slice(0, 200), back: c.back.trim().slice(0, 300) }));
    if (!data.length) return;
    await this.prismaService.reviewCard.createMany({ data, skipDuplicates: true });
  }

  async due(userId: string, limit = 20) {
    const where = { userId, dueAt: { lte: new Date() } };
    const [cards, total] = await Promise.all([
      this.prismaService.reviewCard.findMany({ where, orderBy: { dueAt: 'asc' }, take: limit, select: { id: true, front: true, back: true } }),
      this.prismaService.reviewCard.count({ where }),
    ]);
    return { cards, total };
  }

  async grade(userId: string, id: string, quality: Quality) {
    const card = await this.prismaService.reviewCard.findFirst({ where: { id, userId } }); // sempre filtra por userId!
    if (!card) throw new NotFoundException();
    const next = sm2(card, quality);
    return this.prismaService.reviewCard.update({
      where: { id },
      data: { ...next, dueAt: new Date(Date.now() + next.interval * DAY) },
      select: { id: true, dueAt: true },
    });
  }
}
