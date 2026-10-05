import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/home');
    } catch {
      setError('E-mail ou senha inválidos');
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-3 p-6">
      <h1 className="mb-4 text-2xl font-bold">Entrar</h1>
      <input className="rounded-xl bg-neutral-900 p-3" placeholder="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="rounded-xl bg-neutral-900 p-3" placeholder="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button className="rounded-xl bg-white p-3 font-semibold text-black">Entrar</button>
      <Link to="/onboarding" className="text-center text-sm text-neutral-400">Criar conta</Link>
    </form>
  );
}
