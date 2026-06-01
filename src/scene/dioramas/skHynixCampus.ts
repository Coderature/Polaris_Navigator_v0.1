// @ts-nocheck — SK hynix (000660) simplified business-model diorama.
import * as THREE from 'three';

/**
 * SK hynix 디오라마 (simplified · business-model-first).
 * 읽히는 구조 = 반도체 가치사슬:
 *   중앙 FAB(웨이퍼 생산) → Packaging(HBM 적층) → 메모리 제품(DRAM/NAND/HBM3E) → Data Center·AI 수요.
 *   R&D / 소재·장비 / 품질 / 공급망 / ESG 위성이 본체를 둘러쌈.
 */

const GROUND_XZ = 1.25;
const gx = (n: number) => n * GROUND_XZ;

type MatOpts = { rough?: number; metal?: number; emissive?: string; ei?: number; opacity?: number };
const mat = (color: string, o: MatOpts = {}) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: o.rough ?? 0.55,
    metalness: o.metal ?? 0.1,
    emissive: o.emissive ?? '#000000',
    emissiveIntensity: o.ei ?? 0,
    transparent: o.opacity !== undefined,
    opacity: o.opacity ?? 1,
  });

const C = {
  skOrange: '#ff7a00', skRed: '#e60012',
  cleanCyan: '#5fd0ff', wafer: '#2a6fb0',
  hbmGold: '#d4a017', dataBlue: '#1e90ff', esgGreen: '#34c759', steel: '#8a929c',
  dark: '#06080c', panel: '#191d26', deck: '#0e1016', white: '#f5f5f5',
};

function bx(g: THREE.Group, x: number, y: number, z: number, sx: number, sy: number, sz: number, m: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  g.add(mesh);
  return mesh;
}

function cyl(g: THREE.Group, x: number, y: number, z: number, r: number, h: number, m: THREE.Material, rad = 12) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, rad), m);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  g.add(mesh);
  return mesh;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function makeLabel(title: string, sub: string, accent: string) {
  const c = document.createElement('canvas');
  c.width = 320; c.height = 110;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = 'rgba(6,8,12,0.9)';
  roundRect(ctx, 4, 4, c.width - 8, c.height - 8, 16); ctx.fill();
  ctx.strokeStyle = accent; ctx.lineWidth = 3;
  roundRect(ctx, 4, 4, c.width - 8, c.height - 8, 16); ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = accent; ctx.font = '600 36px sans-serif';
  ctx.fillText(title, c.width / 2, 46);
  ctx.fillStyle = '#c8ccd4'; ctx.font = '400 24px sans-serif';
  ctx.fillText(sub, c.width / 2, 84);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4;
  return t;
}

function makeFabLogo() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = C.dark; ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = C.skOrange;
  ctx.beginPath(); ctx.moveTo(36, 38); ctx.lineTo(88, 64); ctx.lineTo(36, 90); ctx.closePath(); ctx.fill();
  ctx.fillStyle = C.skRed;
  ctx.beginPath(); ctx.moveTo(96, 38); ctx.lineTo(44, 64); ctx.lineTo(96, 90); ctx.closePath(); ctx.fill();
  ctx.fillStyle = C.white; ctx.font = '600 54px sans-serif'; ctx.textBaseline = 'middle';
  ctx.fillText('SK hynix', 118, c.height / 2);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4;
  return t;
}

function plane(g: THREE.Group, tex: THREE.CanvasTexture, x: number, y: number, z: number, w: number, h: number, ei = 0.6, rotY = 0) {
  const m = new THREE.MeshStandardMaterial({
    map: tex, side: THREE.DoubleSide, transparent: true, roughness: 0.4,
    emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: ei,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  mesh.position.set(x, y, z);
  mesh.rotation.y = rotY;
  g.add(mesh);
  return mesh;
}

type Satellite = { title: string; sub: string; accent: string; x: number; z: number; h: number };
const SATELLITES: Satellite[] = [
  { title: 'R&D', sub: '차세대 메모리 설계', accent: C.cleanCyan, x: -1.5, z: -1.9, h: 0.55 },
  { title: 'Packaging', sub: 'HBM 첨단 패키징', accent: C.hbmGold, x: 0.7, z: -2.0, h: 0.55 },
  { title: '소재·장비', sub: '핵심 내재화', accent: C.steel, x: -2.1, z: 0.2, h: 0.45 },
  { title: '품질·분석', sub: '신뢰성 확보', accent: C.cleanCyan, x: -1.5, z: 1.9, h: 0.45 },
  { title: '글로벌 공급망', sub: '세계 연결', accent: C.skOrange, x: 0.6, z: 2.0, h: 0.45 },
];

interface SKRuntime {
  fabWindows: THREE.Mesh[];
  cleanBand: THREE.Mesh;
  hbm: THREE.Mesh[];
  dcLeds: THREE.Mesh[];
  turbine: THREE.Group;
  sats: THREE.PointLight[];
}

function buildSKHynixDiorama(): THREE.Group {
  const g = new THREE.Group();

  bx(g, 0, -0.05, 0, gx(4.5), 0.1, gx(4.5), mat(C.deck, { rough: 0.9 }));
  bx(g, 0, 0.005, 0, gx(1.8), 0.02, gx(1.6), mat(C.panel, { rough: 0.7 }));
  bx(g, 0, 0.013, 0.4, gx(3.6), 0.004, 0.025, mat(C.skOrange, { emissive: C.skOrange, ei: 0.4, opacity: 0.8 }));

  const fab = new THREE.Group();
  fab.position.set(0, 0.48, 0);
  g.add(fab);
  bx(fab, 0, 0, 0, 1.8, 0.96, 1.5, mat(C.panel, { metal: 0.3 }));
  bx(fab, 0, 0.51, 0, 1.84, 0.06, 1.54, mat(C.deck));
  plane(fab, makeFabLogo(), 0, 0.1, 0.76, 1.5, 0.26, 0.7, 0);
  const cleanBand = bx(fab, 0, 0.32, 0.762, 1.5, 0.07, 0.01, mat(C.cleanCyan, { emissive: C.cleanCyan, ei: 0.9 }));
  const fabWindows: THREE.Mesh[] = [];
  for (let i = 0; i < 7; i++) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.12), mat(C.cleanCyan, { emissive: C.cleanCyan, ei: 0.3 }));
    w.position.set(-0.66 + i * 0.22, -0.14, 0.762);
    fab.add(w);
    fabWindows.push(w);
  }

  const sats: THREE.PointLight[] = [];
  for (const s of SATELLITES) {
    const node = new THREE.Group();
    node.position.set(s.x, 0, s.z);
    node.rotation.y = Math.atan2(-s.x, -s.z);
    g.add(node);
    bx(node, 0, 0.04, 0, 0.9, 0.08, 0.8, mat(C.deck));
    bx(node, 0, 0.08 + s.h / 2, 0, 0.78, s.h, 0.68, mat(C.panel, { emissive: s.accent, ei: 0.1 }));
    bx(node, 0, 0.08 + s.h + 0.03, 0, 0.82, 0.04, 0.72, mat(s.accent, { emissive: s.accent, ei: 0.5 }));
    plane(node, makeLabel(s.title, s.sub, s.accent), 0, 0.08 + s.h + 0.3, 0.35, 0.76, 0.26, 0.7, 0);
    const glow = new THREE.PointLight(s.accent, 0.45, 1.5);
    glow.position.set(0, 0.08 + s.h + 0.1, 0);
    node.add(glow);
    sats.push(glow);
  }

  const prod = new THREE.Group();
  prod.position.set(2.1, 0.16, -1.5);
  g.add(prod);
  bx(prod, 0, 0, 0, 1.0, 0.04, 0.46, mat(C.deck));
  bx(prod, -0.32, 0.06, 0, 0.2, 0.05, 0.28, mat(C.steel));
  bx(prod, -0.32, 0.1, 0, 0.14, 0.02, 0.2, mat(C.cleanCyan, { emissive: C.cleanCyan, ei: 0.35 }));
  bx(prod, 0, 0.06, 0, 0.2, 0.05, 0.28, mat(C.steel));
  bx(prod, 0, 0.1, 0, 0.14, 0.02, 0.2, mat(C.skOrange, { emissive: C.skOrange, ei: 0.35 }));
  const hbm: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    hbm.push(bx(prod, 0.32, 0.05 + i * 0.035, 0, 0.18, 0.03, 0.24, mat(C.hbmGold, { emissive: C.hbmGold, ei: 0.5, metal: 0.5 })));
  }
  plane(prod, makeLabel('Memory', 'DRAM·NAND·HBM3E', C.hbmGold), 0, 0.5, 0, 0.7, 0.24, 0.6, 0);

  const dc = new THREE.Group();
  dc.position.set(2.0, 0, 1.4);
  dc.rotation.y = -Math.PI / 5;
  g.add(dc);
  bx(dc, 0, 0.04, 0, 0.9, 0.08, 0.6, mat(C.deck));
  const dcLeds: THREE.Mesh[] = [];
  for (let r = 0; r < 3; r++) {
    bx(dc, -0.28 + r * 0.28, 0.3, 0, 0.18, 0.5, 0.45, mat(C.panel));
    for (let l = 0; l < 4; l++) {
      dcLeds.push(bx(dc, -0.28 + r * 0.28, 0.14 + l * 0.1, 0.24, 0.12, 0.025, 0.01, mat(C.dataBlue, { emissive: C.dataBlue, ei: 0.6 })));
    }
  }
  plane(dc, makeLabel('Data Center', 'AI 메모리 수요', C.dataBlue), 0.3, 0.62, 0, 0.66, 0.23, 0.6, 0);

  const turbine = new THREE.Group();
  turbine.position.set(-2.2, 0, 2.0);
  g.add(turbine);
  bx(g, -2.2, 0.012, 2.0, 0.5, 0.01, 0.5, mat(C.esgGreen, { emissive: C.esgGreen, ei: 0.25, opacity: 0.85 }));
  cyl(turbine, 0, 0.45, 0, 0.022, 0.9, mat('#e8eef2', { rough: 0.4 }), 8);
  const blades = new THREE.Group();
  blades.position.set(0, 0.9, 0.05);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.32, 0.03), mat('#ffffff'));
    blade.position.set(Math.cos(a) * 0.16, Math.sin(a) * 0.16, 0);
    blade.rotation.z = a - Math.PI / 2;
    blades.add(blade);
  }
  turbine.add(blades);
  turbine.userData.blades = blades;

  g.userData = { fabWindows, cleanBand, hbm, dcLeds, turbine, sats } as SKRuntime;
  return g;
}

export function createSKHynix(): THREE.Group {
  const root = buildSKHynixDiorama();
  const SPEED = 0.4;
  root.userData.tick = (time: number) => {
    const t = time * SPEED;
    const tRaw = time;
    const u = root.userData as SKRuntime;
    u.fabWindows.forEach((w, i) => {
      (w.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3 + 0.5 * Math.max(0, Math.sin(t * 1.6 - i * 0.4));
    });
    (u.cleanBand.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.7 + 0.3 * Math.sin(t * 1.0);
    u.hbm.forEach((layer, i) => {
      (layer.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4 + 0.5 * Math.abs(Math.sin(t * 2 + i * 0.5));
    });
    u.dcLeds.forEach((led, i) => {
      (led.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5 + 0.5 * Math.abs(Math.sin(tRaw * 3 + i * 0.3));
    });
    const blades = u.turbine.userData.blades as THREE.Group | undefined;
    if (blades) blades.rotation.z = tRaw * 1.3;
    u.sats.forEach((s, i) => { s.intensity = 0.35 + 0.2 * Math.sin(t * 1.5 + i * 0.7); });
    root.rotation.y = Math.sin(t * 0.2) * 0.008;
  };
  return root;
}

export function createSKHynixFab(): THREE.Group {
  return createSKHynix();
}
