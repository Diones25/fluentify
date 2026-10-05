import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Today } from '../lib/types';
import SpeakingExercise from '../components/SpeakingExercise';
import VocabCard from '../components/VocabCard';

export default function Home() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['today'],
    queryFn: async () => (await api.get<Today>('/lessons/today')).data,
  });

  const generate = useMutation({
    mutationFn: () => api.post('/plans/generate'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['today'] }),
  });

  const complete = useMutation({
    mutationFn: (dayId: string) => api.post(`/lessons/days/${dayId}/complete`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['today'] });
      qc.invalidateQueries({ queryKey: ['progress'] });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  });

  if (isLoading || !data) return <p className="p-4 text-neutral-400">Carregando...</p>;

  // Sem plano (ou a geração falhou no cadastro)
  if (!data.plan) {
    return (
      <div className="flex flex-col items-center gap-4 pt-20 text-center">
        <p>Você ainda não tem um plano de estudos.</p>
        <button
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
          className="rounded-2xl bg-white px-6 py-3 font-semibold text-black disabled:opacity-50"
        >
          {generate.isPending ? 'Gerando (30s)...' : 'Gerar meu plano'}
        </button>
        {generate.isError && <p className="text-sm text-red-400">Falhou. Tente de novo em instantes.</p>}
      </div>
    );
  }

  // Plano concluído
  if (!data.day) {
    return (
      <div className="pt-20 text-center">
        <p className="text-2xl font-bold">🎉 Plano concluído!</p>
        <button onClick={() => generate.mutate()} className="mt-6 rounded-2xl bg-white px-6 py-3 font-semibold text-black">
          Gerar um novo plano
        </button>
      </div>
    );
  }

  const { day } = data;
  const pct = Math.round((data.completedDays / data.totalDays) * 100);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="text-xs text-neutral-500">DIA {day.dayNumber} DE {data.totalDays}</p>
        <h1 className="text-2xl font-bold">{day.theme}</h1>
        <div className="mt-3 h-2 rounded bg-neutral-800">
          <div className="h-2 rounded bg-emerald-400" style={{ width: `${pct}%` }} />
        </div>
      </header>

      {day.lessons.map((l) => {
        if (l.type === 'SPEAKING') return <SpeakingExercise key={l.id} lessonId={l.id} {...l.content} />;
        if (l.type === 'VOCAB') return <VocabCard key={l.id} items={l.content.items} />;
        return (
          <div key={l.id} className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5">
            <p className="text-xs tracking-widest text-neutral-500">CONVERSA</p>
            <p className="my-2 font-semibold">{l.content.scenario}</p>
            <p className="text-sm text-neutral-400">Objetivo: {l.content.goal}</p>
            <Link
              to={`/tutor?topic=${encodeURIComponent(l.content.scenario)}&starter=${encodeURIComponent(l.content.starter)}`}
              className="mt-4 inline-block rounded-full bg-emerald-400 px-5 py-2 font-semibold text-black"
            >
              Começar conversa
            </Link>
          </div>
        );
      })}

      <button
        onClick={() => complete.mutate(day.id)}
        disabled={complete.isPending}
        className="mt-2 rounded-2xl bg-white p-4 font-semibold text-black disabled:opacity-50"
      >
        Concluir o dia ✅
      </button>
    </div>
  );
}
