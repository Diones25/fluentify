import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // O backend sempre responde { ok: true } para não revelar se o e-mail existe.
      await api.post('/auth/forgot', { email });
      setSent(true);
    } catch {
      setError('Não foi possível enviar o e-mail. Tente novamente em instantes.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-3 p-6">
      <h1 className="mb-1 text-2xl font-bold">Recuperar senha</h1>

      {sent ? (
        <>
          <p className="text-sm text-neutral-300">
            Se existir uma conta com <b className="break-all">{email}</b>, enviamos um link para você criar uma nova
            senha. O link vale por <b>30 minutos</b>.
          </p>
          <p className="text-xs text-neutral-500">Não recebeu? Verifique a caixa de spam ou tente novamente.</p>
          <Link to="/login" className="mt-2 rounded-xl bg-white p-3 text-center font-semibold text-black">
            Voltar ao login
          </Link>
          <button
            type="button"
            onClick={() => { setSent(false); setError(''); }}
            className="text-center text-sm text-neutral-400 hover:text-neutral-200"
          >
            Tentar outro e-mail
          </button>
        </>
      ) : (
        <>
          <p className="mb-2 text-sm text-neutral-400">
            Informe o e-mail da sua conta e enviaremos um link para redefinir a senha.
          </p>

          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <input
              className="rounded-xl bg-neutral-900 p-3"
              placeholder="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              disabled={loading}
              className="rounded-xl bg-white p-3 font-semibold text-black disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar link'}
            </button>
          </form>

          <Link to="/login" className="text-center text-sm text-neutral-400 hover:text-neutral-200">
            Voltar ao login
          </Link>
        </>
      )}
    </div>
  );
}
