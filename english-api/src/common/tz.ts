import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

export const DEFAULT_TZ = 'America/Sao_Paulo';

/** Garante um fuso válido (nunca confie no que veio do usuário). */
export function safeTz(tz?: string | null): string {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz || DEFAULT_TZ });
    return tz || DEFAULT_TZ;
  } catch {
    return DEFAULT_TZ;
  }
}

/** "2026-10-03" no fuso informado. */
export const dayKey = (d: Date, tz: string) => formatInTimeZone(d, tz, 'yyyy-MM-dd');
export const hhmm = (d: Date, tz: string) => formatInTimeZone(d, tz, 'HH:mm');

export const diffDays = (a: string, b: string) =>
  Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

/** Instante (UTC) em que a semana atual começou (segunda 00:00 no fuso do aluno). */
export function weekStart(tz: string, now = new Date()): Date {
  const today = dayKey(now, tz);
  const dow = new Date(`${today}T00:00:00Z`).getUTCDay(); // 0 = domingo
  const sinceMonday = (dow + 6) % 7;
  const mondayKey = new Date(Date.parse(`${today}T00:00:00Z`) - sinceMonday * 86_400_000).toISOString().slice(0, 10);
  return fromZonedTime(`${mondayKey}T00:00:00`, tz);
}
