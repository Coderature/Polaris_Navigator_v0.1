import * as THREE from 'three';
import { formatWeightPct } from './capWeights';
import type { StockRow } from '../types';

const logoCache = new Map<string, HTMLImageElement | null>();

function fmpSymbol(st: StockRow): string {
  return st.m === 'KR' ? `${st.t}.KS` : st.t;
}

function logoApiUrl(st: StockRow): string {
  return `/api/logo/${encodeURIComponent(fmpSymbol(st))}`;
}

/** US: ticker. KR: company name (no alphabetic ticker). */
export function buildingLabelText(st: StockRow): string {
  if (st.m === 'KR') {
    const name = st.n.trim();
    return name.length > 8 ? `${name.slice(0, 7)}…` : name;
  }
  return st.t;
}

function logoInitials(st: StockRow): string {
  if (st.m === 'KR') {
    const name = st.n.replace(/[^\uAC00-\uD7A3a-zA-Z0-9]/g, '');
    return name.slice(0, 2) || 'KR';
  }
  return st.t.slice(0, 2);
}

async function loadStockLogo(st: StockRow): Promise<HTMLImageElement | null> {
  const key = fmpSymbol(st);
  if (logoCache.has(key)) return logoCache.get(key)!;

  const img = await new Promise<HTMLImageElement | null>((resolve) => {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => resolve(el);
    el.onerror = () => resolve(null);
    el.src = logoApiUrl(st);
  });
  logoCache.set(key, img);
  return img;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Fit image inside box preserving aspect ratio (letterbox on white). */
function drawLogoContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const pad = 6;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;
  const scale = Math.min(innerW / img.width, innerH / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawLabelCanvas(
  canvas: HTMLCanvasElement,
  st: StockRow,
  logoImg: HTMLImageElement | null,
): void {
  const w = 256;
  const h = st.m === 'US' ? 300 : 280;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const boxW = 88;
  const boxH = 88;
  const boxX = cx - boxW / 2;
  const boxY = 28;

  roundRect(ctx, boxX, boxY, boxW, boxH, 14);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = 'rgba(15,23,42,0.12)';
  ctx.lineWidth = 2;
  ctx.stroke();

  if (logoImg && logoImg.width > 0) {
    ctx.save();
    roundRect(ctx, boxX + 1, boxY + 1, boxW - 2, boxH - 2, 13);
    ctx.clip();
    drawLogoContain(ctx, logoImg, boxX, boxY, boxW, boxH);
    ctx.restore();
  } else {
    ctx.fillStyle = '#eef2ff';
    roundRect(ctx, boxX + 1, boxY + 1, boxW - 2, boxH - 2, 13);
    ctx.fill();
    ctx.fillStyle = '#334155';
    ctx.font = st.m === 'KR'
      ? '700 32px "Inter", sans-serif'
      : '700 28px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(logoInitials(st), cx, boxY + boxH / 2 + 1);
  }

  const label = buildingLabelText(st);
  ctx.fillStyle = '#f8fafc';
  ctx.font = st.m === 'KR'
    ? '700 28px "Inter", sans-serif'
    : '800 34px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(label, cx, boxY + boxH + 16);

  if (st.m === 'US' && st.n) {
    ctx.fillStyle = 'rgba(203,213,225,0.9)';
    ctx.font = '500 20px "Inter", sans-serif';
    const shortName = st.n.length > 16 ? `${st.n.slice(0, 15)}…` : st.n;
    ctx.fillText(shortName, cx, boxY + boxH + 54);
  }
}

function makeLabelSprite(canvas: HTMLCanvasElement, footScale: number): THREE.Sprite {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.renderOrder = 20;
  sprite.userData.isBuildingLabel = true;

  const aspect = canvas.width / canvas.height;
  const spriteH = THREE.MathUtils.clamp(footScale * 0.62, 1.0, 2.8);
  sprite.scale.set(spriteH * aspect, spriteH, 1);
  return sprite;
}

function refreshLabelSprite(
  sprite: THREE.Sprite,
  canvas: HTMLCanvasElement,
  st: StockRow,
  logoImg: HTMLImageElement | null,
) {
  drawLabelCanvas(canvas, st, logoImg);
  const mat = sprite.material as THREE.SpriteMaterial;
  mat.map!.needsUpdate = true;
}

/**
 * Building roof label: logo + US ticker / KR company name (no ticker).
 * Attach to height pivot at local Y = roofY.
 */
export function attachBuildingTopLabel(
  pivot: THREE.Group,
  st: StockRow,
  roofY: number,
  footW: number,
  footD: number,
): void {
  const footScale = Math.min(footW, footD);
  const canvas = document.createElement('canvas');
  drawLabelCanvas(canvas, st, null);

  const sprite = makeLabelSprite(canvas, footScale);
  sprite.position.set(0, roofY + footScale * 0.14, 0);
  sprite.name = 'buildingTopLabel';
  pivot.add(sprite);

  loadStockLogo(st).then((img) => {
    if (!sprite.parent) return;
    refreshLabelSprite(sprite, canvas, st, img);
  });
}

function makeWeightSprite(canvas: HTMLCanvasElement, footScale: number): THREE.Sprite {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.renderOrder = 18;
  sprite.userData.isBuildingWeightLabel = true;

  const aspect = canvas.width / canvas.height;
  const spriteH = THREE.MathUtils.clamp(footScale * 0.26, 0.32, 1.05);
  sprite.scale.set(spriteH * aspect, spriteH, 1);
  return sprite;
}

/**
 * 타일 안쪽(바닥 근처) 시총 비중 — 전체·섹터 %.
 */
export function attachBuildingWeightLabel(
  pivot: THREE.Group,
  totalPct: number,
  sectorPct: number,
  footW: number,
  footD: number,
): void {
  const footScale = Math.min(footW, footD);
  const canvas = document.createElement('canvas');
  canvas.width = 176;
  canvas.height = 80;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  roundRect(ctx, 6, 6, canvas.width - 12, canvas.height - 12, 12);
  ctx.fillStyle = 'rgba(6,10,18,0.78)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(148,163,184,0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f1f5f9';
  ctx.font = '700 24px "JetBrains Mono", monospace';
  ctx.fillText(formatWeightPct(totalPct), canvas.width / 2, 30);
  ctx.fillStyle = 'rgba(148,163,184,0.92)';
  ctx.font = '500 16px "Inter", sans-serif';
  ctx.fillText(`섹터 ${formatWeightPct(sectorPct)}`, canvas.width / 2, 54);

  const sprite = makeWeightSprite(canvas, footScale);
  sprite.position.set(0, footScale * 0.05, 0);
  sprite.name = 'buildingWeightLabel';
  pivot.add(sprite);
}
