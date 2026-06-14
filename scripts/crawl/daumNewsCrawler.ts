import type { RawDocument } from '../types.js';

/** REST 키 미발급 — 어댑터 교체용 스텁. */
export async function fetchDaumNews(_query: string, _limit = 6): Promise<RawDocument[]> {
  return [];
}
