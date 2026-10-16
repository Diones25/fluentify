import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../auth/AuthContext';
import Placement from '../components/Placement';

type Option = { value: string | number; label: string };
type Step = { key: string; question: string; options: Option[] };

const ORDER = ['BEGINNER', 'ELEMENTARY', 'INTERMEDIATE', 'UPPER_INTERMEDIATE', 'ADVANCED'];

const steps: Step[] = [
  {
    key: 'level',
    question: 'Quanto você entende de inglês?',
    options: [
      { value: 'BEGINNER', label: 'Não sei nada de inglês' },
      { value: 'ELEMENTARY', label: 'Conheço algumas palavras comuns' },
      { value: 'INTERMEDIATE', label: 'Consigo ter conversas simples' },
      { value: 'UPPER_INTERMEDIATE', label: 'Consigo falar de assuntos variados' },
      { value: 'ADVANCED', label: 'Consigo falar sobre a maioria dos assuntos em detalhes' },
    ],
  },
  {
    key: 'goal',
    question: 'Qual é o seu objetivo?',
    options: [
      { value: 'TRAVEL', label: 'Viajar' },
      { value: 'WORK', label: 'Trabalho e carreira' },
      { value: 'CONVERSATION', label: 'Conversar com confiança' },
      { value: 'EXAMS', label: 'Provas e certificados' },
    ],
  },
  {
    key: 'minutesPerDay',
    question: 'Quanto tempo você tem por dia?',
    options: [
      { value: 5, label: '5 minutos' },
      { value: 10, label: '10 minutos' },
      { value: 20, label: '20 minutos' },
      { value: 30, label: '30 minutos ou mais' },
    ],
  },
  {
    key: 'daysPerWeek',
    question: 'Quantos dias por semana?',
    options: [
      { value: 2, label: '2 dias' },
      { value: 3, label: '3 dias' },
      { value: 5, label: '5 dias' },
      { value: 7, label: 'Todos os dias' },
    ],
  },
  {
    key: 'audioMode',
    question: 'Como você prefere me ouvir?',
    options: [
      { value: 'ALWAYS', label: 'Pode falar normalmente' },
      { value: 'SPEAKING_ONLY', label: 'Só nos exercícios de fala' },
    ],
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [i, setI] = useState(0); // passo atual
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [selected, setSelected] = useState<string | number | null>(null);
  const [placementDone, setPlacementDone] = useState(false);
  const [testedLevel, setTestedLevel] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isAccountStep = i === steps.length;

  function next() {
    if (selected === null) return;
    setAnswers((a) => ({ ...a, [steps[i].key]: selected }));
    setSelected(null);
    setI(i + 1);
  }

  async function finish(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(name, email, password); // 1) cria conta
      const declared = ORDER.indexOf(String(answers.level));
      const tested = testedLevel ? ORDER.indexOf(testedLevel) : declared;
      const level = ORDER[Math.min(declared, tested)]; // regra: vale o MENOR dos dois
      await api.put('/profile', { ...answers, level }); // 2) salva respostas
      let jobId: string | undefined;
      try {
        jobId = (await api.post<{ jobId: string }>('/plans/generate')).data.jobId;
      } catch {
        /* a Home oferece o botão */
      }
      navigate(jobId ? `/home?job=${jobId}` : '/home');
    } catch {
      setError('Não foi possível criar a conta. Verifique os dados.');
      setLoading(false);
    }
  }

  if (i === 1 && !placementDone) {
    return <Placement onDone={(lvl) => { setTestedLevel(lvl); setPlacementDone(true); }} onSkip={() => setPlacementDone(true)} />;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col p-6">
      {/* barra de progresso */}
      <div className="mb-8 h-1 w-full rounded bg-neutral-800">
        <div className="h-1 rounded bg-emerald-400 transition-all" style={{ width: `${(i / (steps.length + 1)) * 100}%` }} />
      </div>

      {!isAccountStep ? (
        <>
          <h1 className="mb-6 text-2xl font-bold">{steps[i].question}</h1>
          <div className="flex flex-col gap-3">
            {steps[i].options.map((o) => (
              <button
                key={o.value}
                onClick={() => setSelected(o.value)}
                className={`rounded-2xl border p-4 text-left ${selected === o.value ? 'border-emerald-400 bg-emerald-400/10' : 'border-neutral-800 bg-neutral-900'
                  }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <button
            onClick={next}
            disabled={selected === null}
            className="mt-auto rounded-2xl bg-white p-4 font-semibold text-black disabled:opacity-30"
          >
            Continuar
          </button>
        </>
      ) : (
        <form onSubmit={finish} className="flex flex-1 flex-col gap-3">
          <h1 className="mb-3 text-2xl font-bold">Crie sua conta</h1>
          <input className="rounded-xl bg-neutral-900 p-3" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} required />
          <input className="rounded-xl bg-neutral-900 p-3" placeholder="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="rounded-xl bg-neutral-900 p-3" placeholder="Senha (mín. 8 caracteres)" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button disabled={loading} className="mt-auto rounded-2xl bg-white p-4 font-semibold text-black disabled:opacity-50">
            {loading ? 'Criando conta...' : 'Criar conta e gerar meu plano'}
          </button>
        </form>
      )}
    </div>
  );
}
