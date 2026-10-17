import { useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import ChatView from '../components/ChatView';

type Result = { goals: { goal: string; achieved: boolean }[]; score: number; feedback: string; xpGained: number };

export default function MissionRun() {
  const { runId } = useParams();
  const { state } = useLocation() as { state?: { starter: string; title: string; goals: string[] } };
  const [result, setResult] = useState<Result | null>(null);

  const finish = useMutation({
    mutationFn: async () => (await api.post<Result>(`/missions/runs/${runId}/finish`)).data,
    onSuccess: setResult,
  });

  if (result) {
    return (
      <div className="flex flex-col gap-3 pt-6">
        <p className="text-center text-5xl font-bold">{result.score}%</p>
        {result.goals.map((g) => <p key={g.goal}>{g.achieved ? '✅' : '❌'} {g.goal}</p>)}
        <p className="text-neutral-300">{result.feedback}</p>
        {result.xpGained > 0 && <p className="text-emerald-400">+{result.xpGained} XP</p>}
        <Link to="/missions" className="mt-4 rounded-2xl bg-white p-3 text-center font-semibold text-black">Voltar às missões</Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-2 text-xs text-neutral-500">
        <p className="font-semibold text-neutral-300">{state?.title}</p>
        {state?.goals.map((g) => <p key={g}>• {g}</p>)}
      </div>
      <ChatView
        endpoint={`/missions/runs/${runId}/message`}
        starter={state?.starter}
        footer={
          <button onClick={() => finish.mutate()} disabled={finish.isPending} className="mb-2 w-full rounded-xl border border-emerald-400 p-2 text-sm text-emerald-300">
            {finish.isPending ? 'Avaliando...' : 'Finalizar missão'}
          </button>
        }
      />
      {finish.isError && <p className="text-sm text-red-400">Converse um pouco mais antes de finalizar.</p>}
    </>
  );
}
