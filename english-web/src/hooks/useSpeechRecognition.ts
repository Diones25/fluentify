import { useCallback, useEffect, useRef, useState } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any */
export function useSpeechRecognition(lang = 'en-US') {
  const recRef = useRef<any>(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const supported = Boolean(SR);

  useEffect(() => {
    if (!SR) return;
    const rec = new SR();
    rec.lang = lang;
    rec.interimResults = false; // só o resultado final
    rec.continuous = false; // para sozinho quando a pessoa faz silêncio
    rec.maxAlternatives = 1;

    rec.onresult = (e: any) => setTranscript(e.results[0][0].transcript);
    rec.onerror = (e: any) => { setError(e.error); setListening(false); };
    rec.onend = () => setListening(false);

    recRef.current = rec;
    return () => rec.abort();
  }, [lang, SR]);

  const start = useCallback(() => {
    setTranscript('');
    setError(null);
    try { recRef.current?.start(); setListening(true); } catch { /* já estava ouvindo */ }
  }, []);

  const stop = useCallback(() => recRef.current?.stop(), []);
  const toggle = useCallback(() => (listening ? stop() : start()), [listening, start, stop]);

  return { supported, listening, transcript, error, start, stop, toggle };
}
