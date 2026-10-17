export type CompleteResult = {
  xpGained: number;
  level: number;
  streak: { current: number; usedFreeze: boolean; earnedFreeze: boolean };
  newAchievements: { code: string; title: string; emoji: string }[];
  levelChange: { from: string; to: string } | null;
};

export default function CelebrationModal({ r, onClose }: { r: CompleteResult; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
      <div className="w-full max-w-sm rounded-3xl bg-neutral-900 p-6 text-center">
        <p className="text-4xl">🎉</p>
        <h2 className="mt-2 text-2xl font-bold">Dia concluído!</h2>
        <p className="mt-2 text-emerald-400">+{r.xpGained} XP · Nível {r.level}</p>
        <p className="mt-1">🔥 {r.streak.current} dias seguidos</p>
        {r.streak.usedFreeze && <p className="mt-1 text-sky-300">❄️ Seu congelador salvou a sequência!</p>}
        {r.streak.earnedFreeze && <p className="mt-1 text-sky-300">❄️ Você ganhou um congelador!</p>}
        {r.newAchievements.map((a) => (
          <p key={a.code} className="mt-2 rounded-xl bg-amber-400/10 p-2 text-amber-300">{a.emoji} {a.title}</p>
        ))}
        {r.levelChange && <p className="mt-3 text-sm">Seu nível mudou para <b>{r.levelChange.to}</b>. Que tal gerar um plano novo?</p>}
        <button onClick={onClose} className="mt-5 w-full rounded-2xl bg-white p-3 font-semibold text-black">Continuar</button>
      </div>
    </div>
  );
}
