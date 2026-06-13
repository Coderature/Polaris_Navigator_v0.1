const BANNED_PATTERNS: RegExp[] = [
  /(매수|매도|비중\s*(확대|축소))\s*(추천|권장|의견|하세요|해야)/,
  /목표\s*주가/,
  /(상승|하락|오를|내릴|반등)\s*(할\s*것|것으로\s*(예상|전망|기대))/,
  /(지금|당장)\s*(사|매수|팔|매도)/,
  /(사|파)세요/,
];

const HANJA = /[㐀-䶿一-鿿]/;

export function findViolations(text: string): string[] {
  const hits = BANNED_PATTERNS
    .filter((p) => p.test(text))
    .map((p) => `금지어: ${p.source}`);
  if (HANJA.test(text)) hits.push('한자 혼용');
  return hits;
}
