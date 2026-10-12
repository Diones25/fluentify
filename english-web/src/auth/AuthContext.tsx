import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, refreshAccessToken, setAccessToken, type AuthResponse } from '../lib/api';

type User = AuthResponse['user'];
type Ctx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<Ctx>(null!);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Ao abrir o app, tenta restaurar a sessão pelo cookie.
  useEffect(() => {
    refreshAccessToken()
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const accept = (d: AuthResponse) => { setAccessToken(d.accessToken); setUser(d.user); };

  const value: Ctx = {
    user,
    loading,
    login: async (email, password) => accept((await api.post<AuthResponse>('/auth/login', { email, password })).data),
    register: async (name, email, password) => accept((await api.post<AuthResponse>('/auth/register', { name, email, password })).data),
    loginWithGoogle: async (credential) => accept((await api.post<AuthResponse>('/auth/google', { credential })).data),
    logout: async () => { await api.post('/auth/logout'); setAccessToken(null); setUser(null); },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}