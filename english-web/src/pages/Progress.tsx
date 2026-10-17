import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../auth/AuthContext';
import SpeakingExercise from '../components/SpeakingExercise';
import type { ProgressSummary } from '../lib/types';

export default function Progress() {
  const { logout } = useAuth();
  const { data } = useQuery({
    queryKey: ['progress'],
    queryFn: async () => (await api.get<ProgressSummary>('/progress')).data,
  });

  const weak = useQuery({
    queryKey: ['weak'],
    queryFn: async () => (await api.get<{ word: string; misses: number }[]>('/progress/weak-points')).data,
  });
  const practice = useMutation({
    mutationFn: async () => (await api.post<{ phrases: { phrase: string; translation: string }[] }>('/progress/practice')).data,
  });

  if (!data) return <p className="text-neutral-400">Carregando...</p>;

  const stat = (label: string, value: string | number) => (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 text-center">
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Seu progresso</h1>
      <div className="grid grid-cols-2 gap-3">
        {stat('🔥 Sequência atual', `${data.streak.current} dias`)}
        {stat('🏆 Melhor sequência', `${data.streak.best} dias`)}
        {stat('❄️ Congeladores', data.streak.freezes)}
        {stat('Dias concluídos', data.completedDays)}
        {stat('Nota média na fala', data.avgScore !== null ? `${data.avgScore}%` : '-')}
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
        <p className="mb-3 text-sm text-neutral-400">Últimas tentativas de fala</p>
        <div className="flex h-24 items-end gap-1">
          {data.recentScores.map((s, i) => (
            <div key={i} className="flex-1 rounded-t bg-emerald-400" style={{ height: `${Math.max(s.score, 4)}%` }} title={`${s.score}%`} />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
        <div className="flex items-center justify-between text-sm">
          <p className="text-neutral-400">Nível {data.level}</p>
          <p className="text-neutral-500">{data.xp} XP</p>
        </div>
        <div className="mt-2 h-2 rounded bg-neutral-800">
          <div className="h-2 rounded bg-amber-400" style={{ width: `${data.levelProgress}%` }} />
        </div>
        <p className="mt-3 text-sm text-neutral-400">Meta da semana: {data.weekDone}/{data.weekGoal} dias</p>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
        <p className="mb-3 text-sm text-neutral-400">Conquistas</p>
        <div className="grid grid-cols-3 gap-2">
          {data.achievements.map((a) => (
            <div key={a.code} className={`rounded-2xl p-3 text-center text-xs ${a.unlockedAt ? 'bg-amber-400/10' : 'bg-neutral-900 opacity-40'}`}>
              <p className="text-2xl">{a.emoji}</p>
              <p>{a.title}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
        <p className="mb-3 text-sm text-neutral-400">Palavras que você mais erra</p>
        <div className="flex flex-wrap gap-2">
          {weak.data?.map((w) => (
            <span key={w.word} className="rounded-full bg-red-500/15 px-3 py-1 text-sm text-red-300">{w.word} · {w.misses}x</span>
          ))}
          {weak.data?.length === 0 && <p className="text-sm text-neutral-500">Fale mais algumas frases para ver seus pontos fracos.</p>}
        </div>
        {!!weak.data?.length && (
          <button onClick={() => practice.mutate()} disabled={practice.isPending} className="mt-4 rounded-xl bg-white px-4 py-2 font-semibold text-black">
            {practice.isPending ? 'Preparando...' : 'Treinar agora'}
          </button>
        )}
      </div>

      {practice.data?.phrases.map((p) => (
        <SpeakingExercise key={p.phrase} phrase={p.phrase} translation={p.translation} />
      ))}

      <button onClick={logout} className="mt-4 text-sm text-neutral-500">Sair</button>
    </div>
  );
}
