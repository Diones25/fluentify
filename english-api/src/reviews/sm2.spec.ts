import { sm2 } from './sm2.js';

describe('sm2', () => {
  const fresh = { ease: 2.5, interval: 0, reps: 0 };

  it('primeiro acerto: revisa em 1 dia', () => {
    expect(sm2(fresh, 5)).toMatchObject({ interval: 1, reps: 1 });
  });
  it('segundo acerto: revisa em 6 dias', () => {
    expect(sm2(sm2(fresh, 4), 4).interval).toBe(6);
  });
  it('erro zera o progresso', () => {
    expect(sm2({ ease: 2.5, interval: 6, reps: 2 }, 1)).toMatchObject({ interval: 1, reps: 0 });
  });
  it('a facilidade nunca fica abaixo de 1.3', () => {
    let c = fresh;
    for (let i = 0; i < 30; i++) c = sm2(c, 3);
    expect(c.ease).toBeGreaterThanOrEqual(1.3);
  });
});
