import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../auth/AuthContext';
import type { ProgressSummary } from '../lib/types';

export default function Progress() {
  const { logout } = useAuth();
  const { data } = useQuery({
    queryKey: ['progress'],
    queryFn: async () => (await api.get<ProgressSummary>('/progress')).data,
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

      <button onClick={logout} className="mt-4 text-sm text-neutral-500">Sair</button>
    </div>
  );
}
