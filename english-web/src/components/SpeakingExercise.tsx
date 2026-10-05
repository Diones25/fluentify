import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { speak } from '../lib/speech';
import type { EvalResult } from '../lib/types';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

type Props = { lessonId: string; phrase: string; translation: string; tip?: string };

export default function SpeakingExercise({ lessonId, phrase, translation, tip }: Props) {
  const sr = useSpeechRecognition('en-US');

  const evaluate = useMutation({
    mutationFn: async (transcript: string) =>
      (await api.post<EvalResult>('/speaking/evaluate', { lessonId, expected: phrase, transcript })).data,
  });

  // Quando o microfone terminou e temos texto, manda para avaliar.
  useEffect(() => {
    if (sr.transcript && !sr.listening) evaluate.mutate(sr.transcript);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sr.transcript, sr.listening]);

  return (
    <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5 text-center">
      <p className="text-xs tracking-widest text-neutral-500">REPITA DEPOIS DE MIM</p>
      <p className="my-3 text-2xl font-bold">{phrase}</p>
      <p className="text-sm text-neutral-400">{translation}</p>

      <button onClick={() => speak(phrase)} className="mt-3 rounded-full border border-neutral-700 px-4 py-2 text-sm">
        🔊 Ouvir
      </button>

      {!sr.supported ? (
        <p className="mt-4 text-sm text-amber-400">Seu navegador não suporta reconhecimento de voz. Use o Chrome.</p>
      ) : (
        <>
          <div className="mt-6">
            <button
              onClick={sr.toggle}
              className={`h-20 w-20 rounded-full border-2 text-3xl ${sr.listening ? 'animate-pulse border-red-400 bg-red-400/20' : 'border-neutral-500'}`}
            >
              🎤
            </button>
            <p className="mt-2 text-xs text-neutral-500">
              {sr.listening ? 'Ouvindo... toque para parar' : 'Toque para falar'}
            </p>
          </div>
          {sr.error === 'not-allowed' && (
            <p className="mt-2 text-sm text-red-400">Permita o uso do microfone no navegador.</p>
          )}
        </>
      )}

      {evaluate.isPending && <p className="mt-4 text-sm text-neutral-400">Avaliando...</p>}

      {evaluate.data && (
        <div className="mt-4">
          <p className="text-3xl font-bold">{evaluate.data.score}%</p>
          <p className="mt-2 text-lg">
            {evaluate.data.words.map((w, idx) => (
              <span key={idx} className={w.ok ? 'text-emerald-400' : 'text-red-400 underline'}>
                {w.word}{' '}
              </span>
            ))}
          </p>
          {evaluate.data.tip && <p className="mt-3 text-sm text-neutral-300">💡 {evaluate.data.tip}</p>}
        </div>
      )}

      {tip && !evaluate.data && <p className="mt-4 text-xs text-neutral-500">Dica: {tip}</p>}
    </div>
  );
}
