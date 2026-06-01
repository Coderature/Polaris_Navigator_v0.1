import type { StockRow } from '../types';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RectWithRef<T> extends Rect {
  ref: T;
}

/** Simplified squarify (row-based), matching prototype behavior */
export function squarify<T>(items: { value: number; ref: T }[], x: number, y: number, w: number, h: number): RectWithRef<T>[] {
  const total = items.reduce((a, b) => a + b.value, 0);
  const out: RectWithRef<T>[] = [];
  const cur: Rect = { x, y, w, h };
  let row: { value: number; ref: T }[] = [];
  let rowVal = 0;

  function worst(rowIn: typeof row, length: number, sumV: number, totalIn: number, area: number) {
    const scale = area / totalIn;
    const rs = sumV * scale;
    const w2 = rs / length;
    let maxAR = 0;
    for (const it of rowIn) {
      const a = it.value * scale;
      const h2 = a / w2;
      maxAR = Math.max(maxAR, Math.max(w2 / h2, h2 / w2));
    }
    return maxAR;
  }

  function layoutRow(rowIn: typeof row, curIn: Rect, sumV: number, remainingTotal: number) {
    const horizontal = curIn.w >= curIn.h;
    const area = curIn.w * curIn.h;
    const scale = area / remainingTotal;
    const rs = sumV * scale;
    if (horizontal) {
      const rh = rs / curIn.w;
      let cx = curIn.x;
      for (const it of rowIn) {
        const a = it.value * scale;
        const rw = a / rh;
        out.push({ ref: it.ref, x: cx, y: curIn.y, w: rw, h: rh });
        cx += rw;
      }
      curIn.y += rh;
      curIn.h -= rh;
    } else {
      const rw = rs / curIn.h;
      let cy = curIn.y;
      for (const it of rowIn) {
        const a = it.value * scale;
        const rh = a / rw;
        out.push({ ref: it.ref, x: curIn.x, y: cy, w: rw, h: rh });
        cy += rh;
      }
      curIn.x += rw;
      curIn.w -= rw;
    }
  }

  const sorted = [...items].sort((a, b) => b.value - a.value);
  let remainingTotal = total;
  for (let i = 0; i < sorted.length; i++) {
    const it = sorted[i];
    const horizontal = cur.w >= cur.h;
    const side = horizontal ? cur.w : cur.h;
    const newRow = [...row, it];
    const newSum = rowVal + it.value;
    const area = cur.w * cur.h;
    const wPrev = row.length ? worst(row, side, rowVal, remainingTotal, area) : Infinity;
    const wNew = worst(newRow, side, newSum, remainingTotal, area);
    if (row.length === 0 || wNew <= wPrev) {
      row = newRow;
      rowVal = newSum;
    } else {
      layoutRow(row, cur, rowVal, remainingTotal);
      remainingTotal -= rowVal;
      row = [it];
      rowVal = it.value;
    }
  }
  if (row.length) layoutRow(row, cur, rowVal, remainingTotal);
  return out;
}

export interface StockRect extends RectWithRef<StockRow> {
  sectorRect: RectWithRef<string>;
}

export type LayoutWeightMode = 'linear' | 'log';
export type LayoutBalanceMode = 'balanced' | 'cap';

/** Overview: 섹터·종목 내 최대/최소 면적 비율 상한 (4× ≈ 300% 차이까지 허용) */
const MAX_LAYOUT_WEIGHT_RATIO = 4;

/** 1종목만 있는 GICS 섹터는 단독 타일이 과대해지지 않도록 면적을 줄임 */
const SINGLETON_SECTOR_WEIGHT_FACTOR = 0.68;

function compressCapWeights(caps: number[], maxRatio = MAX_LAYOUT_WEIGHT_RATIO): number[] {
  if (caps.length === 0) return [];
  const vals = caps.map((c) => Math.max(c || 0, 1e-9));
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  if (maxV / minV <= maxRatio) return vals;
  const alpha = Math.log(maxRatio) / Math.log(maxV / minV);
  return vals.map((c) => Math.pow(c, alpha));
}

function buildBalancedWeightMap(stocks: StockRow[], layoutSectorByTicker: Map<string, string>): Map<string, number> {
  const bySec: Record<string, StockRow[]> = {};
  for (const st of stocks) {
    const secId = layoutSectorByTicker.get(st.t) ?? st.s;
    (bySec[secId] ??= []).push(st);
  }
  const map = new Map<string, number>();
  for (const list of Object.values(bySec)) {
    const compressed = compressCapWeights(list.map((s) => s.cap || 0));
    list.forEach((st, i) => map.set(st.t, compressed[i]));
  }
  return map;
}

function layoutWeight(cap: number, mode: LayoutWeightMode): number {
  return mode === 'log' ? Math.log10(cap + 1) : cap;
}

function stockLayoutWeight(
  st: StockRow,
  balancedWeights: Map<string, number>,
  weightMode: LayoutWeightMode,
  balanceMode: LayoutBalanceMode,
): number {
  const raw =
    balanceMode === 'cap'
      ? Math.max(st.cap || 0, 1e-9)
      : (balancedWeights.get(st.t) ?? Math.max(st.cap || 0, 1e-9));
  return layoutWeight(raw, weightMode);
}

export function computeLayout(
  stocks: StockRow[],
  W: number,
  H: number,
  options?: {
    weightMode?: LayoutWeightMode;
    balanceMode?: LayoutBalanceMode;
    consolidateSingletons?: boolean;
  },
): { sectorRects: RectWithRef<string>[]; stockRects: StockRect[] } {
  const weightMode = options?.weightMode ?? 'linear';
  const balanceMode = options?.balanceMode ?? 'balanced';
  const shouldConsolidate = options?.consolidateSingletons !== false;
  const normalized = shouldConsolidate ? consolidateSingletons(stocks) : stocks;
  const layoutSectorByTicker = new Map(normalized.map((s) => [s.t, s.s]));
  const balancedWeights =
    balanceMode === 'balanced' ? buildBalancedWeightMap(stocks, layoutSectorByTicker) : new Map<string, number>();

  const bySec: Record<string, StockRow[]> = {};
  for (const st of stocks) {
    const secId = layoutSectorByTicker.get(st.t) ?? st.s;
    (bySec[secId] ??= []).push(st);
  }
  const sectorItems = Object.keys(bySec)
    .map((id) => {
      const members = bySec[id];
      let value = members.reduce(
        (a, b) => a + stockLayoutWeight(b, balancedWeights, weightMode, balanceMode),
        0,
      );
      if (members.length === 1) value *= SINGLETON_SECTOR_WEIGHT_FACTOR;
      return { id, value };
    })
    .sort((a, b) => b.value - a.value);
  const sectorValues =
    balanceMode === 'cap'
      ? sectorItems.map((s) => s.value)
      : compressCapWeights(sectorItems.map((s) => s.value));
  const sectorRects = squarifyBestOf(
    sectorItems.map((s, i) => ({
      value: layoutWeight(sectorValues[i], weightMode),
      ref: s.id,
    })),
    -W / 2,
    -H / 2,
    W,
    H,
    8,
  );

  const stockRects: StockRect[] = [];
  for (const r of sectorRects) {
    const pad = 4.0;
    const innerX = r.x + pad;
    const innerY = r.y + pad;
    const innerW = Math.max(0.1, r.w - pad * 2);
    const innerH = Math.max(0.1, r.h - pad * 2);
    const sectStocks = [...bySec[r.ref]].sort(
      (a, b) =>
        stockLayoutWeight(b, balancedWeights, weightMode, balanceMode) -
        stockLayoutWeight(a, balancedWeights, weightMode, balanceMode),
    );
    const items = sectStocks.map((s) => ({
      value: stockLayoutWeight(s, balancedWeights, weightMode, balanceMode),
      ref: s,
    }));
    const inside = squarifyBestOf(items, innerX, innerY, innerW, innerH, 8);
    for (const ins of inside) {
      stockRects.push({ ...ins, sectorRect: r });
    }
  }
  return { sectorRects, stockRects };
}

// ────────────────────────────────────────────────
// Multi-ordering squarify (면적 보존 길쭉함 완화)
// 여러 정렬 순서로 squarify를 돌려보고 worst aspect ratio가
// 최소인 결과를 채택. squarify 본체가 면적 비율을 보존하므로
// 결과 면적은 항상 정확함.
// ────────────────────────────────────────────────
export function squarifyBestOf<T>(
  items: Array<{ value: number; ref: T }>,
  x: number,
  y: number,
  w: number,
  h: number,
  attempts: number = 8,
): RectWithRef<T>[] {
  if (items.length === 0) return [];
  if (items.length === 1) return squarify(items, x, y, w, h);

  const orderings: Array<Array<{ value: number; ref: T }>> = [
    [...items].sort((a, b) => b.value - a.value),
    [...items].sort((a, b) => a.value - b.value),
    [...items],
  ];

  let seed = 42;
  const rng = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  while (orderings.length < attempts) {
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    orderings.push(shuffled);
  }

  let bestRects: RectWithRef<T>[] | null = null;
  let bestScore = Infinity;

  for (const order of orderings) {
    const rects = squarify(order, x, y, w, h);
    let worstAR = 0;
    for (const r of rects) {
      if (r.w <= 0 || r.h <= 0) continue;
      const ar = Math.max(r.w / r.h, r.h / r.w);
      if (ar > worstAR) worstAR = ar;
    }
    if (worstAR < bestScore) {
      bestScore = worstAR;
      bestRects = rects;
    }
  }

  return bestRects ?? squarify(items, x, y, w, h);
}

// ────────────────────────────────────────────────
// Singleton sector consolidation (그룹핑 재정의)
// 1종목 섹터를 가상 섹터 'OTHERS'로 합침.
// 각 종목의 cap은 변경 없음 → 면적 보존.
// ────────────────────────────────────────────────
export function consolidateSingletons(stocks: StockRow[]): StockRow[] {
  const sectorCount = new Map<string, number>();
  for (const s of stocks) {
    sectorCount.set(s.s, (sectorCount.get(s.s) ?? 0) + 1);
  }

  const singletonSectorCount = [...sectorCount.values()].filter((n) => n === 1).length;
  if (singletonSectorCount <= 1) return stocks;

  return stocks.map((s) => (sectorCount.get(s.s) === 1 ? { ...s, s: 'OTHERS' } : s));
}
