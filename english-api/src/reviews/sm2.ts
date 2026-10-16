export type Quality = 0 | 1 | 2 | 3 | 4 | 5; // 0 = não lembrei nada, 5 = muito fácil
export type CardState = { ease: number; interval: number; reps: number };

export function sm2(card: CardState, quality: Quality): CardState {
  if (quality < 3) {
    // Errou: recomeça. A "facilidade" fica igual.
    return { ease: card.ease, interval: 1, reps: 0 };
  }
  // Ajusta a facilidade (nunca abaixo de 1.3)
  const ease = Math.max(1.3, card.ease + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  const reps = card.reps + 1;
  const interval = reps === 1 ? 1 : reps === 2 ? 6 : Math.round(card.interval * ease);
  return { ease, interval, reps };
}
