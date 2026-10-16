import { nextStreak, visibleStreak } from './streak.js';

const base = { current: 0, best: 0, freezes: 1, lastActiveDay: null as string | null };

describe('nextStreak', () => {
  it('primeira atividade começa em 1', () => {
    expect(nextStreak(base, '2026-10-01').current).toBe(1);
  });
  it('dia seguinte soma 1', () => {
    expect(nextStreak({ ...base, current: 3, best: 3, lastActiveDay: '2026-10-01' }, '2026-10-02').current).toBe(4);
  });
  it('mesmo dia não soma de novo', () => {
    expect(nextStreak({ ...base, current: 3, best: 3, lastActiveDay: '2026-10-01' }, '2026-10-01').current).toBe(3);
  });
  it('falta de 1 dia usa o congelador', () => {
    const r = nextStreak({ ...base, current: 5, best: 5, freezes: 1, lastActiveDay: '2026-10-01' }, '2026-10-03');
    expect(r).toMatchObject({ current: 6, freezes: 0, usedFreeze: true });
  });
  it('falta de 1 dia sem congelador zera', () => {
    expect(nextStreak({ ...base, current: 5, best: 5, freezes: 0, lastActiveDay: '2026-10-01' }, '2026-10-03').current).toBe(1);
  });
  it('faltar 2 dias ou mais zera mesmo com congelador', () => {
    expect(nextStreak({ ...base, current: 9, best: 9, freezes: 2, lastActiveDay: '2026-10-01' }, '2026-10-04').current).toBe(1);
  });
  it('ganha congelador no 7º dia', () => {
    const r = nextStreak({ ...base, current: 6, best: 6, freezes: 0, lastActiveDay: '2026-10-01' }, '2026-10-02');
    expect(r).toMatchObject({ current: 7, freezes: 1, earnedFreeze: true });
  });
});

describe('visibleStreak', () => {
  it('mostra 0 se já quebrou', () => {
    expect(visibleStreak({ ...base, current: 9, freezes: 0, lastActiveDay: '2026-10-01' }, '2026-10-05')).toBe(0);
  });
});
