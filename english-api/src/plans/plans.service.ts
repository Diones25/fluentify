import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { z } from 'zod';
import { AiService } from '../ai/ai.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsageService } from '../ai/usage.service.js';

const WEEKS = 4;

// ---------- Schemas (o formato exato que esperamos da IA) ----------
const LessonSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('SPEAKING'),
    phrase: z.string().min(3),
    translation: z.string(),
    tip: z.string().optional(),
  }),
  z.object({
    type: z.literal('VOCAB'),
    // O prompt pede de 3 a 8 itens. Aceitamos 1+ para nunca perder o plano inteiro
    // por causa de um dia que a IA encurtou.
    items: z.array(z.object({ word: z.string(), translation: z.string(), example: z.string() })).min(1).max(8),
  }),
  z.object({
    type: z.literal('CHAT'),
    scenario: z.string(),
    goal: z.string(),
    starter: z.string(),
  }),
]);

const DaySchema = z.object({
  dayNumber: z.number().int().min(1),
  theme: z.string(),
  lessons: z.array(LessonSchema).min(1),
});

const OutlineSchema = (n: number) => z.object({ themes: z.array(z.string()).length(n) });
const WeekSchema = (n: number) => z.object({ days: z.array(DaySchema).length(n) });

// Quantas atividades cabem no tempo do aluno
function activitiesPerDay(minutes: number) {
  if (minutes <= 5) return 2;
  if (minutes <= 10) return 3;
  if (minutes <= 20) return 5;
  return 7;
}

/**
 * Lista exata de tipos de atividade do dia. Começa pelos 3 tipos base (garantindo
 * pelo menos um SPEAKING) e completa alternando SPEAKING/VOCAB até bater a cota.
 */
function lessonMix(perDay: number) {
  const types = ['SPEAKING', 'VOCAB', 'CHAT'].slice(0, perDay);
  let i = 0;
  while (types.length < perDay) types.push(i++ % 2 === 0 ? 'SPEAKING' : 'VOCAB');
  return types;
}

const SYSTEM = `You are an expert English teacher for Brazilian Portuguese speakers.
Respond ONLY with valid JSON. No markdown, no comments, no extra text.
Translations must be in Brazilian Portuguese. Keep English natural and level-appropriate.`;

@Injectable()
export class PlansService {
  private readonly logger = new Logger(PlansService.name);

  constructor(
    private prisma: PrismaService,
    private readonly ai: AiService,
    private readonly usage: UsageService
  ) {}

  async generate(userId: string) {
    await this.usage.assertWithinQuota(userId, 'plan');
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new BadRequestException('Complete o onboarding primeiro');

    const totalDays = WEEKS * profile.daysPerWeek;
    const perDay = activitiesPerDay(profile.minutesPerDay);

    const ctx = { userId, feature: 'plan' };

    // ETAPA 1: esqueleto (só os temas)
    const outline = await this.ai.json(
      SYSTEM,
      `Student level: ${profile.level}. Goal: ${profile.goal}.
      Create ${totalDays} lesson themes for a ${WEEKS}-week course, in increasing difficulty,
      without repeating themes. Return: {"themes": ["..."]} with exactly ${totalDays} items.`,
      OutlineSchema(totalDays),
      ctx,
      {
        tier: 'fast',
        maxTokens: 1500
      }
    );

    // ETAPA 2: expandir cada semana em paralelo
    const mix = lessonMix(perDay);
    const mixLines = mix.map((t, i) => `  ${i + 1}. ${t}`).join('\n');

    const weekPromises = Array.from({ length: WEEKS }, (_, w) => {
      const days = outline.themes
        .slice(w * profile.daysPerWeek, (w + 1) * profile.daysPerWeek)
        .map((theme, i) => ({ dayNumber: w * profile.daysPerWeek + i + 1, theme }));

      return this.ai.json(
        SYSTEM,
        `Student level: ${profile.level}. Goal: ${profile.goal}. Daily time: ${profile.minutesPerDay} minutes.
        Create the lessons for these days: ${JSON.stringify(days)}.

        For EVERY day, create exactly ${perDay} lessons in this exact order:
        ${mixLines}

        Hard requirements:
        - Every day must have exactly ${perDay} lessons, in the order above.
        - Every VOCAB lesson must have between 3 and 8 items. Never fewer than 3.
        - Reuse the "dayNumber" and "theme" exactly as given, do not invent new ones.

        Formats:
        SPEAKING: {"type":"SPEAKING","phrase":"...","translation":"...","tip":"..."}
        VOCAB: {"type":"VOCAB","items":[{"word":"...","translation":"...","example":"..."},{"word":"...","translation":"...","example":"..."},{"word":"...","translation":"...","example":"..."}]}
        CHAT: {"type":"CHAT","scenario":"...","goal":"...","starter":"..."}

        Return: {"days":[{"dayNumber":1,"theme":"...","lessons":[...]}]}`,
        WeekSchema(days.length),
        ctx, { tier: 'fast', maxTokens: 8000 }
      ).catch((e) => {
        this.logger.error(`Falha ao gerar a semana ${w + 1}`, e as Error);
        throw e;
      });
    });

    const weeks = await Promise.all(weekPromises);
    const allDays = weeks.flatMap((w) => w.days).sort((a, b) => a.dayNumber - b.dayNumber);

    // A IA pode devolver dias fora da ordem/faltando. Sem essa checagem o erro
    // apareceria só lá no banco como conflito de dayNumber duplicado.
    const expected = Array.from({ length: totalDays }, (_, i) => i + 1);
    const received = allDays.map((d) => d.dayNumber);
    if (received.length !== totalDays || received.some((n, i) => n !== expected[i])) {
      throw new InternalServerErrorException('A IA devolveu os dias incompletos. Tente novamente.');
    }

    // Salva tudo numa transação: ou grava o plano inteiro, ou nada.
    return this.prisma.$transaction(async (tx) => {
      await tx.studyPlan.updateMany({ where: { userId, status: 'ACTIVE' }, data: { status: 'ARCHIVED' } });

      return tx.studyPlan.create({
        data: {
          userId,
          weeks: WEEKS,
          days: {
            create: allDays.map((d) => ({
              dayNumber: d.dayNumber,
              theme: d.theme,
              lessons: {
                create: d.lessons.map((l, idx) => {
                  const { type, ...content } = l; // "type" vira coluna, o resto vira JSON
                  return { type, order: idx, content: content as Prisma.InputJsonValue };
                }),
              },
            })),
          },
        },
        include: { days: { orderBy: { dayNumber: 'asc' }, include: { lessons: { orderBy: { order: 'asc' } } } } },
      });
    });
  }

  active(userId: string) {
    return this.prisma.studyPlan.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include: { days: { orderBy: { dayNumber: 'asc' }, select: { id: true, dayNumber: true, theme: true, completedAt: true } } },
    });
  }
}
