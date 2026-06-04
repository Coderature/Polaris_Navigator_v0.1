import type { StockRow } from '../types';

export interface CapWeightPct {
  /** 전체 유니버스 대비 시가총액 비중 (%) */
  totalPct: number;
  /** 동일 GICS 섹터 내 비중 (%) */
  sectorPct: number;
}

const holdW = (s: StockRow) => s.weight ?? Math.max(s.cap || 0, 0);

export function computeCapWeightMap(stocks: StockRow[]): Map<string, CapWeightPct> {
  const totalCap = stocks.reduce((a, s) => a + holdW(s), 0);
  const sectorCap = new Map<string, number>();
  for (const s of stocks) {
    const sec = s.s;
    sectorCap.set(sec, (sectorCap.get(sec) ?? 0) + holdW(s));
  }

  const out = new Map<string, CapWeightPct>();
  for (const s of stocks) {
    const cap = holdW(s);
    const secTotal = sectorCap.get(s.s) ?? 0;
    out.set(s.t, {
      totalPct: totalCap > 0 ? (cap / totalCap) * 100 : 0,
      sectorPct: secTotal > 0 ? (cap / secTotal) * 100 : 0,
    });
  }
  return out;
}

export function formatWeightPct(p: number): string {
  if (!Number.isFinite(p) || p <= 0) return '—';
  if (p >= 10) return `${p.toFixed(1)}%`;
  if (p >= 1) return `${p.toFixed(1)}%`;
  return `${p.toFixed(2)}%`;
}

/** Overview 디오라마: 시총이 작을수록 타일 대비 채움 비율을 낮춤 (0.52~0.9) */
export function stockVisualFootprintPad(cap: number, sectorMaxCap: number, basePad = 0.9): number {
  const max = Math.max(sectorMaxCap, 1e-9);
  const minPad = 0.52;
  const t = Math.sqrt(Math.max(cap, 0) / max);
  return minPad + (basePad - minPad) * Math.min(1, t);
}
