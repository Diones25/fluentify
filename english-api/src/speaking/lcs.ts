export const normalize = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9'\s]/g, '').split(/\s+/).filter(Boolean);

/** Marca quais palavras de "a" aparecem em "b" respeitando a ordem. */
export function lcsMatches(a: string[], b: string[]): boolean[] {
  const dp = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);

  const matched = Array<boolean>(a.length).fill(false);
  let i = a.length, j = b.length;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) { matched[i - 1] = true; i--; j--; }
    else if (dp[i - 1][j] >= dp[i][j - 1]) i--;
    else j--;
  }
  return matched;
}
