import { speak } from '../lib/speech';

type Item = { word: string; translation: string; example: string };

export default function VocabCard({ items }: { items: Item[] }) {
  return (
    <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5">
      <p className="mb-3 text-xs tracking-widest text-neutral-500">VOCABULÁRIO</p>
      <ul className="flex flex-col gap-4">
        {items.map((it) => (
          <li key={it.word}>
            <button onClick={() => speak(it.word)} className="text-left">
              <span className="text-lg font-bold">{it.word} 🔊</span>
              <span className="ml-2 text-neutral-400">{it.translation}</span>
            </button>
            <button onClick={() => speak(it.example)} className="block text-left text-sm text-neutral-500">
              “{it.example}”
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
