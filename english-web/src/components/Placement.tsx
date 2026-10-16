import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

type Q = { id: number; q: string; options: string[] };

export default function Placement({ onDone, onSkip }: { onDone: (level: string) => void; onSkip: () => void }) {
  const { data: questions } = useQuery({
    queryKey: ['placement'],
    queryFn: async () => (await api.get<Q[]>('/placement/questions')).data,
  });
  
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<{ id: number; choice: number }[]>([]);

  const submit = useMutation({
    mutationFn: async (a: { id: number; choice: number }[]) =>
      (await api.post<{ level: string }>('/placement/submit', { answers: a })).data,
    onSuccess: (d) => onDone(d.level),
  });

  if (!questions) return <p className="p-6 text-neutral-400">Carregando teste...</p>;

  function choose(choice: number) {
    const next = [...answers, { id: questions![i].id, choice }];
    setAnswers(next);
    if (i + 1 < questions!.length) setI(i + 1);
    else submit.mutate(next);
  }

  const q = questions[i];
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col p-6">
      <p className="text-xs text-neutral-500">PERGUNTA {i + 1} DE {questions.length}</p>
      <h1 className="my-6 text-xl font-bold">{q.q}</h1>
      <div className="flex flex-col gap-3">
        {q.options.map((o, idx) => (
          <button key={idx} disabled={submit.isPending} onClick={() => choose(idx)} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 text-left">
            {o}
          </button>
        ))}
      </div>
      <button onClick={onSkip} className="mt-auto pt-6 text-sm text-neutral-500">Pular teste</button>
    </div>
  );
}
