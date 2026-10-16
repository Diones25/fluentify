import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import ReviewDeck, { type Card } from '../components/ReviewDeck';

export default function Review() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['reviews'],
    queryFn: async () => (await api.get<{ cards: Card[]; total: number }>('/reviews/due')).data,
  });

  if (isLoading || !data) return <p className="text-neutral-400">Carregando...</p>;
  if (data.cards.length === 0) return <p className="pt-20 text-center text-neutral-400">Nada para revisar agora. Volte mais tarde 🌱</p>;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Revisão</h1>
      <p className="text-sm text-neutral-500">{data.total} cartões para revisar</p>
      <ReviewDeck cards={data.cards} onFinished={() => qc.invalidateQueries({ queryKey: ['reviews'] })} />
    </div>
  );
}
