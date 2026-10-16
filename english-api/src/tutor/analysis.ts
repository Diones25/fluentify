import { z } from 'zod';

export const AnalysisSchema = z.object({
  corrections: z.array(z.object({ original: z.string(), corrected: z.string(), explanation: z.string() })).max(3),
  newWords: z.array(z.object({ word: z.string(), translation: z.string() })).max(3),
});
export type Analysis = z.infer<typeof AnalysisSchema>;

export const ANALYSIS_SYSTEM = `You analyze ONLY the English message written by a Brazilian student.
Respond ONLY with JSON: {"corrections":[{"original":"...","corrected":"...","explanation":"..."}],"newWords":[{"word":"...","translation":"..."}]}
Rules:
- explanation: Brazilian Portuguese, max 15 words.
- Ignore trivial errors (capitalization, final punctuation).
- If there are no real mistakes, return "corrections": [].
- newWords: up to 3 useful words related to the topic that the student could learn (translation in Portuguese).`;
