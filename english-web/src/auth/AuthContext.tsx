import { createContext, useContext, useState, type ReactNode } from 'react';
import { api } from '../lib/api';

type User = { id: string; email: string; name: string };
type AuthResponse = { accessToken: string; user: User };
type Ctx = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<Ctx>(null!);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });

  const save = (data: AuthResponse) => {
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const login: Ctx['login'] = async (email, password) => {
    save((await api.post<AuthResponse>('/auth/login', { email, password })).data);
  };

  const register: Ctx['register'] = async (name, email, password) => {
    save((await api.post<AuthResponse>('/auth/register', { name, email, password })).data);
  };
  
  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>;
}
