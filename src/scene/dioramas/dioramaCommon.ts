// @ts-nocheck — shared DESIGN diorama helpers (extracted for modular campuses).
import * as THREE from 'three';

export const GROUND_XZ = 1.25;
export const gx = (n: number) => n * GROUND_XZ;

export type MatOpts = {
  roughness?: number;
  metalness?: number;
  transparent?: boolean;
  opacity?: number;
  emissive?: string;
  emissiveIntensity?: number;
  side?: THREE.Side;
};

export function mat(color: string, o: MatOpts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: o.roughness ?? 0.6,
    metalness: o.metalness ?? 0.08,
    transparent: o.transparent ?? false,
    opacity: o.opacity ?? 1,
    emissive: o.emissive ?? '#000000',
    emissiveIntensity: o.emissiveIntensity ?? 0,
    side: o.side ?? THREE.FrontSide,
  });
}

const M_shared = {
  silver: mat('#c8c8cc', { roughness: 0.32, metalness: 0.55 }),
  bark: mat('#7a4b2a', { roughness: 0.85 }),
};

export function box(
  g: THREE.Group,
  name: string,
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
  sz: number,
  material: THREE.Material,
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  g.add(mesh);
  return mesh;
}

export function cyl(
  g: THREE.Group,
  name: string,
  x: number,
  y: number,
  z: number,
  r: number,
  h: number,
  material: THREE.Material,
  radial = 24,
) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, radial), material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  g.add(mesh);
  return mesh;
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function makeLabelPanelTexture(
  num: string,
  korTitle: string,
  korSubtitle: string,
  accentColor = '#ff9900',
) {
  const c = document.createElement('canvas');
  c.width = 768;
  c.height = 280;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#0a0a0a';
  roundRect(ctx, 6, 6, c.width - 12, c.height - 12, 32);
  ctx.fill();
  ctx.strokeStyle = '#3a3a3a';
  ctx.lineWidth = 3;
  roundRect(ctx, 6, 6, c.width - 12, c.height - 12, 32);
  ctx.stroke();
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.arc(90, 85, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 56px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(num, 90, 88);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 50px "Malgun Gothic", Arial';
  ctx.textAlign = 'left';
  ctx.fillText(korTitle, 160, 85);
  if (korSubtitle) {
    ctx.fillStyle = '#c4c4c8';
    ctx.font = '30px "Malgun Gothic", Arial';
    const lines = korSubtitle.split('\n');
    lines.forEach((line, i) => {
      ctx.fillText(line, 50, 175 + i * 40);
    });
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function makeFacadeTextTexture(text: string, bg = '#131921', fg = '#ffffff') {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 192;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = fg;
  ctx.font = 'bold 100px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, c.width / 2, c.height / 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function texturedPlane(
  g: THREE.Group,
  tex: THREE.CanvasTexture,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  rotY = 0,
  emissive = 0.3,
) {
  const m = new THREE.MeshStandardMaterial({
    map: tex,
    side: THREE.DoubleSide,
    roughness: 0.4,
    emissive: '#ffffff',
    emissiveMap: tex,
    emissiveIntensity: emissive,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  mesh.position.set(x, y, z);
  mesh.rotation.y = rotY;
  g.add(mesh);
  return mesh;
}

export function rooftopPanel(
  g: THREE.Group,
  num: string,
  title: string,
  subtitle: string,
  x: number,
  y: number,
  z: number,
  w = 1.0,
  h = 0.36,
  accent = '#ff9900',
) {
  const tex = makeLabelPanelTexture(num, title, subtitle, accent);
  const m = new THREE.MeshStandardMaterial({
    map: tex,
    side: THREE.DoubleSide,
    roughness: 0.4,
    emissive: '#ffffff',
    emissiveMap: tex,
    emissiveIntensity: 0.4,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  mesh.position.set(x, y, z);
  g.add(mesh);
  cyl(g, `panel post ${num}`, x, y - h / 2 - 0.16, z, 0.014, 0.32, M_shared.silver, 8);
  return mesh;
}

export function tree(g: THREE.Group, x: number, z: number, s = 0.5) {
  cyl(g, 'tree trunk', x, (0.23 * s) / 0.5, z, 0.035, (0.38 * s) / 0.5, M_shared.bark, 10);
  const crown = new THREE.Mesh(
    new THREE.SphereGeometry((0.18 * s) / 0.5, 16, 12),
    mat('#2f7d42', { roughness: 0.8 }),
  );
  crown.position.set(x, (0.52 * s) / 0.5, z);
  crown.castShadow = true;
  crown.receiveShadow = true;
  g.add(crown);
}
