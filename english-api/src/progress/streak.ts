import { diffDays } from '../common/tz.js';

export type StreakState = { current: number; best: number; freezes: number; lastActiveDay: string | null };
export const MAX_FREEZES = 2;

export function nextStreak(s: StreakState, today: string) {
  if (s.lastActiveDay === today) return { ...s, usedFreeze: false, earnedFreeze: false }; // já contou hoje

  let { current, freezes } = s;
  let usedFreeze = false;
  let earnedFreeze = false;
  const gap = s.lastActiveDay ? diffDays(s.lastActiveDay, today) : null;

  if (gap === null) current = 1; // primeira atividade da vida
  else if (gap === 1) current += 1; // ontem estudou: continua
  else if (gap === 2 && freezes > 0) { // faltou UM dia e tem congelador
    freezes -= 1;
    current += 1;
    usedFreeze = true;
  } else current = 1; // quebrou

  // a cada 7 dias seguidos ganha um congelador (máx. 2)
  if (current % 7 === 0 && freezes < MAX_FREEZES) { freezes += 1; earnedFreeze = true; }

  return { current, best: Math.max(s.best, current), freezes, lastActiveDay: today, usedFreeze, earnedFreeze };
}

/** Quanto mostrar na tela: se já quebrou e ainda não voltou a estudar, mostra 0. */
export function visibleStreak(s: StreakState | null, today: string): number {
  if (!s?.lastActiveDay) return 0;
  const gap = diffDays(s.lastActiveDay, today);
  if (gap <= 1) return s.current;
  if (gap === 2 && s.freezes > 0) return s.current;
  return 0;
}
