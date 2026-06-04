// @ts-nocheck — Microsoft (MSFT) simplified business-model diorama.
import * as THREE from 'three';

/**
 * Microsoft 디오라마 (simplified · business-model-first).
 * 중앙 HQ + 6개 사업부 위성 + 가치순환 링.
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
  msRed: '#f25022', msGreen: '#7fba00', msBlue: '#00a4ef', msYellow: '#ffb900',
  azure: '#0078d4', copilot: '#22d3ee', xbox: '#107c10', linkedin: '#0a66c2', m365: '#d83b01',
  dark: '#0c1018', panel: '#1c2230', deck: '#11151e', white: '#f5f5f5',
};

function bx(g: THREE.Group, x: number, y: number, z: number, sx: number, sy: number, sz: number, m: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
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
  ctx.fillStyle = 'rgba(10,14,22,0.9)';
  roundRect(ctx, 4, 4, c.width - 8, c.height - 8, 16); ctx.fill();
  ctx.strokeStyle = accent; ctx.lineWidth = 3;
  roundRect(ctx, 4, 4, c.width - 8, c.height - 8, 16); ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = accent; ctx.font = '600 38px sans-serif';
  ctx.fillText(title, c.width / 2, 46);
  ctx.fillStyle = '#c8ccd4'; ctx.font = '400 24px sans-serif';
  ctx.fillText(sub, c.width / 2, 84);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4;
  return t;
}

function makeHqLogo() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = C.dark; ctx.fillRect(0, 0, c.width, c.height);
  const tl = 30, ox = 28, oy = 30;
  const cols = [C.msRed, C.msGreen, C.msBlue, C.msYellow];
  ctx.fillStyle = cols[0]; ctx.fillRect(ox, oy, tl, tl);
  ctx.fillStyle = cols[1]; ctx.fillRect(ox + tl + 6, oy, tl, tl);
  ctx.fillStyle = cols[2]; ctx.fillRect(ox, oy + tl + 6, tl, tl);
  ctx.fillStyle = cols[3]; ctx.fillRect(ox + tl + 6, oy + tl + 6, tl, tl);
  ctx.fillStyle = C.white; ctx.font = '600 60px sans-serif'; ctx.textBaseline = 'middle';
  ctx.fillText('Microsoft', ox + 2 * tl + 22, c.height / 2);
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

type Division = {
  title: string; sub: string; accent: string;
  x: number; z: number; h: number;
};

const DIVISIONS: Division[] = [
  { title: 'Azure', sub: '클라우드 인프라', accent: C.azure, x: -1.7, z: -1.7, h: 0.7 },
  { title: 'Microsoft 365', sub: '생산성·협업', accent: C.m365, x: 0, z: -2.1, h: 0.6 },
  { title: 'Copilot', sub: 'AI 어시스턴트', accent: C.copilot, x: 1.7, z: -1.7, h: 0.6 },
  { title: 'Windows', sub: 'OS·디바이스', accent: C.msBlue, x: -1.9, z: 1.5, h: 0.5 },
  { title: 'Xbox', sub: '게이밍', accent: C.xbox, x: 0, z: 2.1, h: 0.5 },
  { title: 'LinkedIn', sub: '비즈니스 네트워크', accent: C.linkedin, x: 1.9, z: 1.5, h: 0.5 },
];

interface MsftRuntime {
  ring: THREE.Group;
  divisions: { glow: THREE.PointLight; pillar: THREE.Mesh }[];
  hqGlow: THREE.Mesh;
}

function buildMicrosoftDiorama(): THREE.Group {
  const g = new THREE.Group();

  bx(g, 0, -0.05, 0, gx(4.4), 0.1, gx(4.4), mat(C.deck, { rough: 0.9 }));
  bx(g, 0, 0.005, 0, gx(1.7), 0.02, gx(1.7), mat(C.panel, { rough: 0.7 }));

  const hq = new THREE.Group();
  hq.position.set(0, 0.5, 0);
  g.add(hq);
  bx(hq, 0, 0, 0, 1.5, 1.0, 1.3, mat(C.panel, { metal: 0.3 }));
  bx(hq, 0, 0.53, 0, 1.54, 0.06, 1.34, mat(C.deck));
  plane(hq, makeHqLogo(), 0, 0.12, 0.66, 1.3, 0.28, 0.7, 0);
  const tile = 0.18;
  [C.msRed, C.msGreen, C.msBlue, C.msYellow].forEach((col, i) => {
    const tx = (i % 2 === 0 ? -1 : 1) * (tile / 2 + 0.01);
    const tz = (i < 2 ? 1 : -1) * (tile / 2 + 0.01);
    bx(hq, tx, 0.59, tz, tile, 0.04, tile, mat(col, { emissive: col, ei: 0.7 }));
  });
  const hqGlow = bx(hq, 0, -0.35, 0.661, 0.5, 0.28, 0.01, mat('#ffe2b0', { emissive: '#ffe2b0', ei: 0.5 }));

  const divisions: MsftRuntime['divisions'] = [];
  for (const d of DIVISIONS) {
    const node = new THREE.Group();
    node.position.set(d.x, 0, d.z);
    node.rotation.y = Math.atan2(-d.x, -d.z);
    g.add(node);

    bx(node, 0, 0.04, 0, 0.95, 0.08, 0.85, mat(C.deck));
    const pillar = bx(node, 0, 0.08 + d.h / 2, 0, 0.8, d.h, 0.7, mat(C.panel, { emissive: d.accent, ei: 0.12 }));
    bx(node, 0, 0.08 + d.h + 0.03, 0, 0.84, 0.04, 0.74, mat(d.accent, { emissive: d.accent, ei: 0.5 }));
    plane(node, makeLabel(d.title, d.sub, d.accent), 0, 0.08 + d.h + 0.3, 0.36, 0.78, 0.27, 0.7, 0);

    const glow = new THREE.PointLight(d.accent, 0.5, 1.6);
    glow.position.set(0, 0.08 + d.h + 0.1, 0);
    node.add(glow);

    const beam = bx(node, 0, 0.12, 0.55, 0.06, 0.02, 0.5, mat(d.accent, { emissive: d.accent, ei: 0.6, opacity: 0.7 }));
    beam.name = 'value beam';

    divisions.push({ glow, pillar });
  }

  const ring = new THREE.Group();
  ring.position.set(0, 1.35, 0);
  g.add(ring);
  const cyc = [C.azure, C.copilot, C.msGreen];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const node = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 14, 14),
      mat(cyc[i], { emissive: cyc[i], ei: 1.0 }),
    );
    node.position.set(Math.cos(a) * 0.4, 0, Math.sin(a) * 0.4);
    ring.add(node);
  }

  g.userData = { ring, divisions, hqGlow } as MsftRuntime;
  return g;
}

export function createMicrosoft(): THREE.Group {
  const root = buildMicrosoftDiorama();
  const SPEED = 0.4;
  root.userData.tick = (time: number) => {
    const t = time * SPEED;
    const u = root.userData as MsftRuntime;
    u.ring.rotation.y = t * 0.7;
    u.divisions.forEach((d, i) => {
      d.glow.intensity = 0.4 + 0.3 * Math.sin(t * 1.5 + i * 1.0);
      (d.pillar.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.1 + 0.12 * Math.max(0, Math.sin(t * 1.5 + i * 1.0));
    });
    (u.hqGlow.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4 + 0.2 * Math.sin(t * 1.2);
    root.rotation.y = Math.sin(t * 0.2) * 0.008;
  };
  return root;
}

export function createMicrosoftCampus(): THREE.Group {
  return createMicrosoft();
}
