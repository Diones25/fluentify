export type Lesson =
  | { id: string; type: 'SPEAKING'; order: number; content: { phrase: string; translation: string; tip?: string } }
  | { id: string; type: 'VOCAB'; order: number; content: { items: { word: string; translation: string; example: string }[] } }
  | { id: string; type: 'CHAT'; order: number; content: { scenario: string; goal: string; starter: string } };

export type Today = {
  plan: { id: string } | null;
  day: { id: string; dayNumber: number; theme: string; lessons: Lesson[] } | null;
  totalDays: number;
  completedDays: number;
};

export type EvalResult = {
  score: number;
  words: { word: string; ok: boolean }[];
  tip: string | null;
  xpGained: number;
  newAchievements: { code: string; title: string; emoji: string }[];
};

export type ProgressSummary = {
  streak: { current: number; best: number; freezes: number };
  completedDays: number;
  avgScore: number | null;
  recentScores: { score: number; createdAt: string }[];
  xp: number;
  level: number;
  levelProgress: number;
  weekDone: number;
  weekGoal: number;
  achievements: { code: string; title: string; desc: string; emoji: string; unlockedAt: string | null }[];
};
