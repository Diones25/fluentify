import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
export type AuthResponse = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string
  }
};

// O token vive só na memória da aba. Recarregou a página? Pedimos um novo via cookie.
let accessToken: string | null = null;
export const setAccessToken = (t: string | null) => { accessToken = t; };
export const getAccessToken = () => accessToken;

export const api = axios.create({ baseURL: API_URL, withCredentials: true });

// Antes de cada requisição, anexa o token (se existir).
api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// "Single flight": se 5 requisições falharem juntas, só 1 refresh acontece.
let refreshing: Promise<AuthResponse> | null = null;
export function refreshAccessToken(): Promise<AuthResponse> {
  refreshing ??= axios
    .post<AuthResponse>(`${API_URL}/auth/refresh`, null, { withCredentials: true })
    .then((response) => {
      setAccessToken(response.data.accessToken);
      return response.data;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}


// Se o token expirou (401), desloga e manda para o login.
api.interceptors.response.use(
  (response) => response,
  async(err) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const original = err.config as any;
    if (err.response?.status === 401 && !original._retry && !original.url?.includes('/auth/')) {
      original._retry = true;
      try {
        await refreshAccessToken();
        return api(original); // repete a requisição original
      } catch {
        setAccessToken(null);
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);

/** fetch com o mesmo comportamento (para o streaming do professor). */
export async function authFetch(input: string, init: RequestInit = {}) {
  const run = () =>
    fetch(input, { ...init, credentials: 'include', headers: { ...init.headers, Authorization: `Bearer ${accessToken}` } });
  let res = await run();
  if (res.status === 401) {
    await refreshAccessToken();
    res = await run();
  }
  return res;
}