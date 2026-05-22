import type { SectorDef, StockRow } from '../types';
import type { RectWithRef, StockRect } from '../layout/squarify';

export type NavigatorHeatmapMode = 'chg' | 'cap';

const PAD = 12;

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

/** Monotone heat from small cap (cool) → large cap (warm); area is already ∝ cap via squarify. */
function heatCapColor(cap: number, minL: number, maxL: number): string {
  const lc = Math.log10(cap + 1);
  const t = maxL > minL ? clamp01((lc - minL) / (maxL - minL)) : 0.5;
  const r = Math.round(28 + t * 210);
  const g = Math.round(72 + t * 140);
  const b = Math.round(108 + t * 40);
  return `rgb(${r},${g},${b})`;
}

/** 한국식 UI: 상승 붉은 계열, 하락 푸른 계열 */
function chgFill(chg: number, halted: boolean): string {
  if (halted) return '#5c6370';
  if (chg > 0.1) {
    const t = clamp01(chg / 6);
    const r = Math.round(216 - t * 35);
    const g = Math.round(90 - t * 35);
    const b = Math.round(82 - t * 25);
    return `rgb(${r},${g},${b})`;
  }
  if (chg < -0.1) {
    const t = clamp01(Math.abs(chg) / 6);
    const r = Math.round(79 + t * 35);
    const g = Math.round(127 + t * 45);
    const b = Math.round(216 - t * 25);
    return `rgb(${r},${g},${b})`;
  }
  return '#8a8f98';
}

export function drawTreemapHeatmap(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  stockRects: StockRect[],
  sectorRects: RectWithRef<string>[],
  secById: Record<string, SectorDef>,
  mode: NavigatorHeatmapMode,
  treeW: number,
  treeH: number,
): void {
  ctx.save();
  ctx.clearRect(0, 0, cw, ch);
  ctx.fillStyle = '#070a10';
  ctx.fillRect(0, 0, cw, ch);

  const innerW = cw - 2 * PAD;
  const innerH = ch - 2 * PAD;

  const px = (vx: number) => PAD + ((vx + treeW / 2) / treeW) * innerW;
  /** layout y increases “north”; canvas y increases down */
  const pyTop = (vyTop: number) => PAD + (treeH / 2 - vyTop) / treeH * innerH;

  for (const sr of sectorRects) {
    const sec = secById[sr.ref];
    const left = px(sr.x);
    const right = px(sr.x + sr.w);
    const top = pyTop(sr.y + sr.h);
    const bottom = pyTop(sr.y);
    const w = Math.max(0, right - left);
    const h = Math.max(0, bottom - top);
    ctx.fillStyle = sec?.color ? `${sec.color}14` : '#ffffff06';
    ctx.fillRect(left, top, w, h);
    ctx.strokeStyle = `${sec?.color ?? '#8899aa'}44`;
    ctx.lineWidth = 1;
    ctx.strokeRect(left + 0.5, top + 0.5, w - 1, h - 1);
  }

  const logCaps = stockRects.map((r) => Math.log10(r.ref.cap + 1));
  const minL = Math.min(...logCaps);
  const maxL = Math.max(...logCaps);

  for (const r of stockRects) {
    const st = r.ref;
    const left = px(r.x);
    const right = px(r.x + r.w);
    const top = pyTop(r.y + r.h);
    const bottom = pyTop(r.y);
    const w = Math.max(1, right - left - 1);
    const h = Math.max(1, bottom - top - 1);

    ctx.fillStyle = mode === 'cap' ? heatCapColor(st.cap, minL, maxL) : chgFill(st.chg ?? 0, !!st.halted);
    ctx.fillRect(left + 1, top + 1, w, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(left + 1, top + 1, w, h);

    if (w > 36 && h > 16) {
      ctx.fillStyle = 'rgba(248,250,252,0.92)';
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.fillText(st.t, left + 5, top + 14);
    }
  }
  ctx.restore();
}

export function pickStockAtCanvas(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  stockRects: StockRect[],
  treeW: number,
  treeH: number,
): StockRow | null {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const cx = (clientX - rect.left) * scaleX;
  const cy = (clientY - rect.top) * scaleY;
  const cw = canvas.width;
  const ch = canvas.height;
  const innerW = cw - 2 * PAD;
  const innerH = ch - 2 * PAD;

  const vx = ((cx - PAD) / innerW) * treeW - treeW / 2;
  const vy = treeH / 2 - ((cy - PAD) / innerH) * treeH;

  for (let i = stockRects.length - 1; i >= 0; i--) {
    const r = stockRects[i];
    if (vx >= r.x && vx <= r.x + r.w && vy >= r.y && vy <= r.y + r.h) return r.ref;
  }
  return null;
}
