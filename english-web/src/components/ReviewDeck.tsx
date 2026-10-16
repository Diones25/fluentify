import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { speak } from '../lib/speech';

export type Card = { id: string; front: string; back: string };

const GRADES = [
  { label: 'Errei', quality: 1, cls: 'bg-red-500/20 text-red-300' },
  { label: 'Difícil', quality: 3, cls: 'bg-amber-500/20 text-amber-300' },
  { label: 'Bom', quality: 4, cls: 'bg-emerald-500/20 text-emerald-300' },
  { label: 'Fácil', quality: 5, cls: 'bg-sky-500/20 text-sky-300' },
];

export default function ReviewDeck({ cards, onFinished }: { cards: Card[]; onFinished?: () => void }) {
  const [i, setI] = useState(0);
  const [show, setShow] = useState(false);

  const grade = useMutation({
    mutationFn: (v: { id: string; quality: number }) => api.post(`/reviews/${v.id}/grade`, { quality: v.quality }),
    onSuccess: () => { setShow(false); setI((n) => n + 1); },
  });

  useEffect(() => {
    if (i >= cards.length) onFinished?.();
  }, [i, cards.length, onFinished]);

  if (i >= cards.length) { 
    return <p className="py-10 text-center text-xl">Revisão concluída! 🎉</p>;
  }
  
  const card = cards[i];

  return (
    <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 text-center">
      <p className="text-xs text-neutral-500">{i + 1} de {cards.length}</p>
      <p className="my-6 text-3xl font-bold">{card.front}</p>
      <button onClick={() => speak(card.front)} className="rounded-full border border-neutral-700 px-4 py-2 text-sm">🔊 Ouvir</button>

      {!show ? (
        <button onClick={() => setShow(true)} className="mt-6 block w-full rounded-2xl bg-white p-4 font-semibold text-black">
          Mostrar resposta
        </button>
      ) : (
        <>
          <p className="my-6 text-lg text-neutral-300">{card.back}</p>
          <div className="grid grid-cols-4 gap-2">
            {GRADES.map((g) => (
              <button
                key={g.label}
                disabled={grade.isPending}
                onClick={() => grade.mutate({ id: card.id, quality: g.quality })}
                className={`rounded-xl p-3 text-sm font-semibold ${g.cls}`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}