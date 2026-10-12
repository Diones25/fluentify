import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-6 text-neutral-400">Carregando...</p>; // evita "piscar" a tela de login
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}