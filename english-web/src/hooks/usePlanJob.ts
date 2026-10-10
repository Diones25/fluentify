import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

type JobStatus = {
  state: string;
  result: {
    planId: string
  } | null;
  error: string | null
};

export function usePlanJob(initialJobId?: string | null) {
  const qc = useQueryClient();
  const [jobId, setJobId] = useState<string | null>(initialJobId ?? null);

  const start = useMutation({
    mutationFn: async () => (await api.post<{ jobId: string }>('/plans/generate')).data.jobId,
    onSuccess: setJobId,
  });

  const status = useQuery({
    queryKey: ['plan-job', jobId],
    enabled: !!jobId,
    queryFn: async () => (await api.get<JobStatus>(`/plans/jobs/${jobId}`)).data,
    // para de consultar quando terminar
    refetchInterval: (q) => (['completed', 'failed'].includes(q.state.data?.state ?? '') ? false : 2000),
  });

  const state = status.data?.state;
  useEffect(() => {
    if (state === 'completed') {
      qc.invalidateQueries({ queryKey: ['today'] });
    }
  }, [state, qc]);

  return {
    start: () => start.mutate(),
    generating: start.isPending || (!!jobId && state !== 'failed' && state !== 'completed'),
    failed: state === 'failed' || start.isError,
  };
}
