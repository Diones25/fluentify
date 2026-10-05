import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_URL } from '../lib/api';
import { speak } from '../lib/speech';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

type Msg = { role: 'user' | 'assistant'; content: string };

export default function Tutor() {
  const [params] = useSearchParams();
  const topic = params.get('topic') ?? undefined;
  const starter = params.get('starter');

  const [messages, setMessages] = useState<Msg[]>(starter ? [{ role: 'assistant', content: starter }] : []);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [conversationId, setConversationId] = useState<string>();
  const bottomRef = useRef<HTMLDivElement>(null);
  const sr = useSpeechRecognition('en-US');

  // Rola para o fim a cada nova mensagem
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Se falou no microfone, envia automaticamente
  useEffect(() => {
    if (sr.transcript && !sr.listening) send(sr.transcript);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sr.transcript, sr.listening]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    setBusy(true);
    setInput('');
    // adiciona a msg do aluno e um balão vazio do professor (que será preenchido)
    setMessages((m) => [...m, { role: 'user', content: text }, { role: 'assistant', content: '' }]);

    let full = '';
    try {
      const res = await fetch(`${API_URL}/tutor/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ message: text, conversationId, topic }),
      });
      if (!res.ok || !res.body) throw new Error('Falha na requisição');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Eventos SSE terminam com uma linha em branco
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? ''; // o último pedaço pode estar incompleto

        for (const part of parts) {
          if (!part.startsWith('data: ')) continue;
          const ev = JSON.parse(part.slice(6));
          if (ev.type === 'meta') setConversationId(ev.conversationId);
          if (ev.type === 'delta') {
            full += ev.text;
            setMessages((m) => {
              const copy = [...m];
              copy[copy.length - 1] = { role: 'assistant', content: full };
              return copy;
            });
          }
          if (ev.type === 'error') throw new Error('Erro do servidor');
        }
      }
      // Fala só a parte em inglês (antes da dica em português)
      speak(full.split('Tip:')[0]);
    } catch {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: 'assistant', content: 'Ops, algo deu errado. Tente de novo.' };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      {topic && <p className="mb-2 text-xs text-neutral-500">Tema: {topic}</p>}

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {messages.length === 0 && <p className="mt-10 text-center text-neutral-500">Diga “Hello!” para começar 👋</p>}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] whitespace-pre-wrap rounded-2xl p-3 ${m.role === 'user' ? 'self-end bg-emerald-500 text-black' : 'self-start bg-neutral-900'
              }`}
          >
            {m.content || '...'}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="mt-2 flex items-center gap-2"
      >
        <input
          className="flex-1 rounded-full bg-neutral-900 px-4 py-3"
          placeholder="Escreva em inglês..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        {sr.supported && (
          <button type="button" onClick={sr.toggle} className={`h-12 w-12 rounded-full border ${sr.listening ? 'animate-pulse border-red-400' : 'border-neutral-600'}`}>
            🎤
          </button>
        )}
        <button disabled={busy} className="h-12 rounded-full bg-white px-5 font-semibold text-black disabled:opacity-40">
          Enviar
        </button>
      </form>
    </div>
  );
}
