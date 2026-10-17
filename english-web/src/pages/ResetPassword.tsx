import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { api } from '../lib/api';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError('A senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset', { token, password });
      setDone(true);
    } catch (err) {
      setError(
        isAxiosError(err) && err.response?.status === 401
          ? 'Este link é inválido ou expirou. Solicite um novo.'
          : 'Não foi possível redefinir a senha. Tente novamente.',
      );
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-3 p-6">
        <h1 className="text-2xl font-bold">Link inválido</h1>
        <p className="text-sm text-neutral-400">
          Este endereço não contém um token de recuperação. Peça um novo link para redefinir sua senha.
        </p>
        <Link to="/forgot" className="rounded-xl bg-white p-3 text-center font-semibold text-black">
          Pedir novo link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-3 p-6">
        <h1 className="text-2xl font-bold">Senha redefinida ✅</h1>
        <p className="text-sm text-neutral-300">
          Sua senha foi atualizada e todas as sessões antigas foram encerradas por segurança.
        </p>
        <Link to="/login" className="rounded-xl bg-white p-3 text-center font-semibold text-black">
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-3 p-6">
      <h1 className="mb-1 text-2xl font-bold">Criar nova senha</h1>
      <p className="mb-2 text-sm text-neutral-400">Escolha uma senha com pelo menos 8 caracteres.</p>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <div className="relative">
          <input
            className="w-full rounded-xl bg-neutral-900 p-3 pr-12"
            placeholder="Nova senha"
            type={show ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-semibold text-neutral-400 hover:text-neutral-200"
          >
            {show ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>

        <input
          className="rounded-xl bg-neutral-900 p-3"
          placeholder="Confirme a nova senha"
          type={show ? 'text' : 'password'}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          disabled={loading}
          className="rounded-xl bg-white p-3 font-semibold text-black disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Redefinir senha'}
        </button>
      </form>

      <Link to="/login" className="text-center text-sm text-neutral-400 hover:text-neutral-200">
        Voltar ao login
      </Link>
    </div>
  );
}
