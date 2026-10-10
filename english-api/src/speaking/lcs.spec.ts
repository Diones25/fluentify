import { lcsMatches, normalize } from './lcs.js';

describe('lcsMatches', () => {
  it('marca tudo certo quando a frase é igual', () => {
    const exp = normalize('I would like a table');
    expect(lcsMatches(exp, normalize('I would like a table'))).toEqual([true, true, true, true, true]);
  });

  it('marca como errada a palavra que faltou', () => {
    const exp = normalize('I would like a table');
    expect(lcsMatches(exp, normalize('I would like table'))).toEqual([true, true, true, false, true]);
  });

  it('ignora maiúsculas e pontuação', () => {
    expect(normalize("I'd like a table, please!")).toEqual(["i'd", 'like', 'a', 'table', 'please']);
  });
});
