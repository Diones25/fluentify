import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { AiService } from '../ai/ai.service.js';
import { UsageService } from '../ai/usage.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

const TZ = 'America/Fortaleza'; // fuso do aluno. Melhoria: guardar o fuso no perfil.

const dayKey = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: TZ }); // "2026-10-03"

const IGNORE = new Set(['a', 'an', 'the', 'to', 'of', 'in', 'on', 'is', 'it', 'i']); // palavrinhas que o microfone costuma "comer"

@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly usage: UsageService,
  ) { }

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

  /** Agrega as palavras que o aluno mais errou nos últimos treinos de fala. */
  async weakPoints(userId: string) {
    const attempts = await this.prisma.attempt.findMany({
      where: { userId }, orderBy: { createdAt: 'desc' }, take: 100, select: { feedback: true },
    });
    const counts = new Map<string, number>();
    for (const a of attempts) {
      const words = (a.feedback as { words?: { word: string; ok: boolean }[] } | null)?.words ?? [];
      for (const w of words) {
        if (!w.ok && !IGNORE.has(w.word)) counts.set(w.word, (counts.get(w.word) ?? 0) + 1);
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([word, misses]) => ({ word, misses }));
  }

  /** Gera frases sob medida (modelo rápido) que usam as palavras fracas. */
  async practice(userId: string) {
    await this.usage.assertWithinQuota(userId, 'tip');
    const weak = (await this.weakPoints(userId)).slice(0, 5).map((w) => w.word);
    if (weak.length === 0) return { phrases: [] };

    const Schema = z.object({ phrases: z.array(z.object({ phrase: z.string(), translation: z.string() })).min(1).max(5) });
    return this.ai.json(
      'You are an English teacher. Respond ONLY with JSON.',
      `Create 5 short natural English sentences (max 10 words each), each containing at least one of these words: ${weak.join(', ')}.
Return {"phrases":[{"phrase":"...","translation":"... in Brazilian Portuguese"}]}`,
      Schema,
      { userId, feature: 'tip' },
      { tier: 'fast', maxTokens: 600 },
    );
  }
}
