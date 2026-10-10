import { z } from 'zod';

export const PLAN_PROMPT_VERSION = 1; // aumente a cada mudança de prompt

// ---------- Schemas (o formato exato que esperamos da IA) ----------
export const LessonSchema = z.discriminatedUnion('type', [
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

export const DaySchema = z.object({
  dayNumber: z.number().int().min(1),
  theme: z.string(),
  lessons: z.array(LessonSchema).min(1),
});

export const OutlineSchema = (n: number) => z.object({ themes: z.array(z.string()).length(n) });
export const WeekSchema = (n: number) => z.object({ days: z.array(DaySchema).length(n) });

export const SYSTEM = `You are an expert English teacher for Brazilian Portuguese speakers.
Respond ONLY with valid JSON. No markdown, no comments, no extra text.
Translations must be in Brazilian Portuguese. Keep English natural and level-appropriate.`;

export const outlinePrompt = (level: string, goal: string, totalDays: number) =>
  `Student level: ${level}. Goal: ${goal}.
Create ${totalDays} lesson themes for a 4-week course, in increasing difficulty,
without repeating themes. Return: {"themes": ["..."]} with exactly ${totalDays} items.`;

export const weekPrompt = (o: {
  level: string;
  goal: string;
  minutesPerDay: number;
  days: { dayNumber: number; theme: string }[];
  perDay: number;
  mixLines: string;
}) =>
  `Student level: ${o.level}. Goal: ${o.goal}. Daily time: ${o.minutesPerDay} minutes.
        Create the lessons for these days: ${JSON.stringify(o.days)}.

        For EVERY day, create exactly ${o.perDay} lessons in this exact order:
        ${o.mixLines}

        Hard requirements:
        - Every day must have exactly ${o.perDay} lessons, in the order above.
        - Every VOCAB lesson must have between 3 and 8 items. Never fewer than 3.
        - Reuse the "dayNumber" and "theme" exactly as given, do not invent new ones.

        Formats:
        SPEAKING: {"type":"SPEAKING","phrase":"...","translation":"...","tip":"..."}
        VOCAB: {"type":"VOCAB","items":[{"word":"...","translation":"...","example":"..."},{"word":"...","translation":"...","example":"..."},{"word":"...","translation":"...","example":"..."}]}
        CHAT: {"type":"CHAT","scenario":"...","goal":"...","starter":"..."}

        Return: {"days":[{"dayNumber":1,"theme":"...","lessons":[...]}]}`;
