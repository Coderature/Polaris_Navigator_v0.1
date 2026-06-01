import type { StockRow } from '../types';

export interface CapWeightPct {
  /** 전체 유니버스 대비 시가총액 비중 (%) */
  totalPct: number;
  /** 동일 GICS 섹터 내 비중 (%) */
  sectorPct: number;
}

export function computeCapWeightMap(stocks: StockRow[]): Map<string, CapWeightPct> {
  const totalCap = stocks.reduce((a, s) => a + Math.max(s.cap || 0, 0), 0);
  const sectorCap = new Map<string, number>();
  for (const s of stocks) {
    const sec = s.s;
    sectorCap.set(sec, (sectorCap.get(sec) ?? 0) + Math.max(s.cap || 0, 0));
  }

  const out = new Map<string, CapWeightPct>();
  for (const s of stocks) {
    const cap = Math.max(s.cap || 0, 0);
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
