import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AiModule } from '../ai/ai.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AiService } from '../ai/ai.service.js';
import { OutlineSchema, SYSTEM, outlinePrompt } from './prompts.js';

const run = process.env.RUN_EVALS ? describe : describe.skip;

run('eval: esqueleto do plano', () => {
  let ai: AiService;
  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AiModule],
    }).compile();
    ai = mod.get(AiService);
  });

  const cases = [
    { level: 'BEGINNER', goal: 'TRAVEL', days: 12 },
    { level: 'ADVANCED', goal: 'WORK', days: 20 },
    { level: 'INTERMEDIATE', goal: 'EXAMS', days: 8 },
  ];

  it.each(cases)('gera JSON válido e sem temas repetidos: %j', async ({ level, goal, days }) => {
    const out = await ai.json(SYSTEM, outlinePrompt(level, goal, days), OutlineSchema(days), { userId: 'eval', feature: 'plan' }, { tier: 'fast', maxTokens: 1500 });
    expect(out.themes).toHaveLength(days);
    expect(new Set(out.themes.map((t) => t.toLowerCase())).size).toBe(days);
  }, 60_000);
});
