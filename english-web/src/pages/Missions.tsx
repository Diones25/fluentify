import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

type M = { id: string; title: string; emoji: string; goals: string[]; locked: boolean; bestScore: number | null };

export default function Missions() {
  const navigate = useNavigate();
  const { data } = useQuery({ queryKey: ['missions'], queryFn: async () => (await api.get<M[]>('/missions')).data });
  const start = useMutation({
    mutationFn: async (id: string) => (await api.post<{ runId: string; starter: string; title: string; goals: string[] }>(`/missions/${id}/start`)).data,
    onSuccess: (d) => navigate(`/missions/run/${d.runId}`, { state: d }),
  });

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold">Missões</h1>
      {data?.map((m) => (
        <button
          key={m.id}
          disabled={m.locked || start.isPending}
          onClick={() => start.mutate(m.id)}
          className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 text-left disabled:opacity-40"
        >
          <p className="text-lg font-bold">{m.emoji} {m.title} {m.locked && '🔒'}</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-neutral-400">{m.goals.map((g) => <li key={g}>{g}</li>)}</ul>
          {m.bestScore !== null && <p className="mt-2 text-xs text-emerald-400">Melhor nota: {m.bestScore}%</p>}
        </button>
      ))}
    </div>
  );
}
