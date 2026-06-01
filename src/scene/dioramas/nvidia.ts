// @ts-nocheck — DESIGN diorama port; strict typing deferred.
import * as THREE from 'three';

type MatOpts = {
  roughness?: number;
  metalness?: number;
  transparent?: boolean;
  opacity?: number;
  emissive?: string;
  emissiveIntensity?: number;
};

const C = {
  nvGreen: '#76b900',
  nvGreenBright: '#a3e635',
  cyan: '#00d4ff',
  dark: '#0a0a0a',
  darkElev: '#1a1a1a',
  silver: '#c0c5cc',
  warm: '#ffd9a0',
  white: '#f5f5f5',
  tree: '#2d5a2d',
  bark: '#5a4030',
};

const mat = (color: string, o: MatOpts = {}) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: o.roughness ?? 0.6,
    metalness: o.metalness ?? 0.08,
    transparent: o.transparent ?? false,
    opacity: o.opacity ?? 1,
    emissive: o.emissive ?? '#000000',
    emissiveIntensity: o.emissiveIntensity ?? 0,
  });

const M = {
  dark: mat(C.dark, { roughness: 0.9, metalness: 0.05 }),
  darkElev: mat(C.darkElev, { roughness: 0.7, metalness: 0.2 }),
  silver: mat(C.silver, { roughness: 0.32, metalness: 0.9 }),
  nvGreen: mat(C.nvGreen, { emissive: C.nvGreen, emissiveIntensity: 1.2, roughness: 0.25 }),
  nvGreenSoft: mat(C.nvGreen, { emissive: C.nvGreen, emissiveIntensity: 0.4, roughness: 0.3 }),
  cyanLed: mat(C.cyan, { emissive: C.cyan, emissiveIntensity: 1.0, roughness: 0.2 }),
  cyanRim: mat(C.cyan, { emissive: C.cyan, emissiveIntensity: 0.8, roughness: 0.2 }),
  warm: mat(C.warm, { emissive: C.warm, emissiveIntensity: 0.55, roughness: 0.35 }),
  warmFrame: mat('#3a2a18', { roughness: 0.8 }),
  metal: mat('#3a3a3a', { roughness: 0.35, metalness: 0.8 }),
  gpuBody: mat('#1a1a1a', { roughness: 0.35, metalness: 0.7 }),
  fin: mat('#0a0a0a', { roughness: 0.3, metalness: 0.5 }),
  lamp: mat(C.warm, { emissive: C.warm, emissiveIntensity: 0.9, roughness: 0.3 }),
};

function box(
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

function cyl(
  g: THREE.Group,
  name: string,
  x: number,
  y: number,
  z: number,
  r: number,
  h: number,
  material: THREE.Material,
  radial = 16,
) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, radial), material);
  mesh.name = name;
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

function drawNvidiaEye(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number) {
  ctx.strokeStyle = C.nvGreen;
  ctx.lineWidth = 8 * scale;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy + 10 * scale, 22 * scale, Math.PI * 1.12, Math.PI * 1.88);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy - 10 * scale, 22 * scale, Math.PI * 0.12, Math.PI * 0.88);
  ctx.stroke();
  ctx.fillStyle = C.nvGreen;
  ctx.beginPath();
  ctx.arc(cx, cy, 7 * scale, 0, Math.PI * 2);
  ctx.fill();
}

function makeNvidiaLogoTexture(bg = '#0a0a0a') {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, c.width, c.height);
  drawNvidiaEye(ctx, 72, c.height / 2, 1.2);
  ctx.fillStyle = C.white;
  ctx.font = 'bold 52px "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('nvidia', 130, c.height / 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeRTXTexture() {
  const c = document.createElement('canvas');
  c.width = 320;
  c.height = 96;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 64px "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('RTX', 8, c.height / 2 - 4);
  ctx.font = '600 22px Arial';
  ctx.fillStyle = '#aaaaaa';
  ctx.fillText('™', 168, c.height / 2 - 18);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeChipDesignTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 640;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#0a0e08';
  ctx.fillRect(0, 0, c.width, c.height);

  ctx.fillStyle = C.nvGreenBright;
  ctx.font = '800 56px "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CHIP DESIGN', c.width / 2, 48);
  ctx.strokeStyle = C.nvGreen;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(200, 68);
  ctx.lineTo(c.width - 200, 68);
  ctx.stroke();

  ctx.fillStyle = C.nvGreenBright;
  ctx.beginPath();
  ctx.arc(c.width - 120, 42, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'right';
  ctx.fillText('DESIGNING', c.width - 90, 48);

  const chipCx = 250;
  const chipCy = 340;
  const chipS = 130;
  ctx.strokeStyle = C.nvGreen;
  ctx.lineWidth = 4;
  ctx.strokeRect(chipCx - chipS / 2, chipCy - chipS / 2, chipS, chipS);
  drawNvidiaEye(ctx, chipCx - 32, chipCy - 6, 1.0);
  ctx.fillStyle = C.nvGreen;
  ctx.font = 'bold 26px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('nvidia', chipCx + 4, chipCy + 10);

  const pinOffsets = [
    [-1, -1], [1, -1], [-1, 1], [1, 1],
  ];
  pinOffsets.forEach(([px, py]) => {
    const px0 = chipCx + px * (chipS / 2 + 14);
    const py0 = chipCy + py * (chipS / 2 + 14);
    for (let p = 0; p < 3; p++) {
      ctx.fillStyle = '#2a3020';
      ctx.fillRect(px0 + p * 5 - 4, py0 - 2, 3, 4);
    }
  });

  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2;
    const len = 72 + (i % 2) * 16;
    const sx = chipCx + Math.cos(ang) * (chipS / 2 + 6);
    const sy = chipCy + Math.sin(ang) * (chipS / 2 + 6);
    const mid = len * 0.55;
    const mx = chipCx + Math.cos(ang) * mid;
    const my = chipCy + Math.sin(ang) * mid;
    let ex = chipCx + Math.cos(ang) * len;
    let ey = chipCy + Math.sin(ang) * len;
    ctx.strokeStyle = C.nvGreen;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    if (i % 3 === 0) {
      const perp = ang + Math.PI / 2;
      ctx.lineTo(mx, my);
      ex = mx + Math.cos(perp) * 28;
      ey = my + Math.sin(perp) * 28;
      ctx.lineTo(ex, ey);
    } else {
      ctx.lineTo(ex, ey);
    }
    ctx.stroke();
    ctx.fillStyle = C.nvGreenBright;
    ctx.fillRect(ex - 5, ey - 5, 10, 10);
  }

  ctx.fillStyle = C.nvGreenBright;
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('ARCHITECTURE', 720, 200);
  const archLines = ['▸ CUDA CORES', '▸ TENSOR CORES', '▸ RT CORES', '▸ NVLINK'];
  ctx.fillStyle = C.nvGreen;
  ctx.font = '22px Arial';
  archLines.forEach((line, i) => {
    ctx.fillText(line, 720, 250 + i * 42);
  });

  ctx.fillStyle = C.nvGreenBright;
  ctx.font = 'italic 20px Arial';
  ctx.fillText('DESIGNED BY NVIDIA', 80, c.height - 48);

  ctx.strokeStyle = 'rgba(118,185,0,0.25)';
  ctx.lineWidth = 1;
  for (let gx = 780; gx < 980; gx += 18) {
    ctx.beginPath();
    ctx.moveTo(gx, 520);
    ctx.lineTo(gx, c.height - 80);
    ctx.stroke();
  }
  for (let gy = 520; gy < c.height - 80; gy += 18) {
    ctx.beginPath();
    ctx.moveTo(780, gy);
    ctx.lineTo(980, gy);
    ctx.stroke();
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeAIInfraLabelTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 96;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = C.dark;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = C.nvGreenBright;
  ctx.font = 'bold 32px "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('AI INFRASTRUCTURE', c.width / 2, c.height / 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeGPULabelTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = C.dark;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = C.nvGreenBright;
  ctx.font = 'bold 64px "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GPU', c.width / 2, c.height / 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeRnDTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 96;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = C.dark;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = C.nvGreen;
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('R&D', c.width / 2, c.height / 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function texturedPlane(
  g: THREE.Group,
  tex: THREE.CanvasTexture,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  emissive = 0,
  rotY = 0,
) {
  const m = new THREE.MeshStandardMaterial({
    map: tex,
    side: THREE.DoubleSide,
    roughness: 0.4,
    emissive: emissive > 0 ? '#ffffff' : '#000000',
    emissiveMap: emissive > 0 ? tex : undefined,
    emissiveIntensity: emissive,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  mesh.position.set(x, y, z);
  mesh.rotation.y = rotY;
  g.add(mesh);
  return mesh;
}

function addLedRim(
  g: THREE.Group,
  cx: number,
  cy: number,
  cz: number,
  w: number,
  d: number,
  inset: number,
  intensity: number,
  name: string,
  color = C.nvGreen,
) {
  const matLed = mat(color, { emissive: color, emissiveIntensity: intensity, roughness: 0.2 });
  const hw = w / 2 - inset;
  const hd = d / 2 - inset;
  const t = 0.02;
  const h = 0.04;
  box(g, `${name} F`, cx, cy, cz + hd, w - inset * 2, h, t, matLed);
  box(g, `${name} B`, cx, cy, cz - hd, w - inset * 2, h, t, matLed);
  box(g, `${name} L`, cx - hw, cy, cz, t, h, d - inset * 2, matLed);
  box(g, `${name} R`, cx + hw, cy, cz, t, h, d - inset * 2, matLed);
}

function tree(g: THREE.Group, x: number, z: number, s = 0.4) {
  cyl(g, 'tree trunk', x, 0.12 * s, z, 0.03 * s, 0.22 * s, mat(C.bark, { roughness: 0.85 }), 8);
  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(0.1 * s, 12, 10),
    mat(C.tree, { roughness: 0.85 }),
  );
  crown.position.set(x, 0.28 * s, z);
  crown.castShadow = true;
  g.add(crown);
}

function buildBase(g: THREE.Group) {
  box(g, 'slab', 0, 0.03, 0, 4.4, 0.06, 3.2, M.dark);
  addLedRim(g, 0, 0.065, 0, 4.4, 3.2, 0, 1.4, 'rim outer');
  addLedRim(g, 0, 0.065, 0, 4.4, 3.2, 0.18, 1.0, 'rim inner');

  const lampSpots: [number, number][] = [
    [-1.9, 1.35], [1.9, 1.35], [-1.9, -1.35], [1.9, -1.35], [0, 1.45],
  ];
  lampSpots.forEach(([lx, lz], i) => {
    cyl(g, `lamp post ${i}`, lx, 0.11, lz, 0.015, 0.18, mat(C.darkElev), 6);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), M.lamp);
    cap.position.set(lx, 0.21, lz);
    g.add(cap);
    const light = new THREE.PointLight(C.warm, 0.2, 0.8);
    light.position.set(lx, 0.22, lz);
    g.add(light);
  });
}

function buildHQ(g: THREE.Group): THREE.Mesh[] {
  const hx = -1.3;
  const hy = 0.58;
  const hz = -0.3;
  const grp = new THREE.Group();
  grp.position.set(hx, hy, hz);
  g.add(grp);

  box(grp, 'hq body', 0, 0, 0, 1.65, 1.2, 1.3, M.darkElev);
  box(grp, 'hq logo band', 0, 0.46, 0.66, 1.67, 0.28, 0.02, M.dark);
  const logoTex = makeNvidiaLogoTexture();
  texturedPlane(grp, logoTex, 0, 0.46, 0.675, 1.45, 0.22, 0.4);

  const windows: THREE.Mesh[] = [];
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 5; col++) {
      const wx = -0.58 + col * 0.29;
      const wy = -0.02 + row * 0.24;
      box(grp, `win frame ${row}_${col}`, wx, wy, 0.658, 0.16, 0.18, 0.01, M.warmFrame);
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.16), M.warm.clone());
      win.position.set(wx, wy, 0.665);
      grp.add(win);
      windows.push(win);
    }
  }
  for (let col = 0; col < 5; col++) {
    box(grp, `mullion ${col}`, -0.58 + col * 0.29, 0.1, 0.662, 0.02, 0.52, 0.008, M.dark);
  }

  box(grp, 'hq canopy', 0.15, -0.48, 0.66, 0.55, 0.05, 0.32, M.nvGreenSoft);
  box(grp, 'hq door', 0.15, -0.54, 0.658, 0.22, 0.32, 0.01, M.dark);
  const doorGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.18, 0.28),
    mat(C.warm, { emissive: C.warm, emissiveIntensity: 0.35 }),
  );
  doorGlow.position.set(0.15, -0.54, 0.665);
  grp.add(doorGlow);

  box(grp, 'hq roof trim', 0, 0.62, 0, 1.67, 0.04, 1.32, M.dark);
  box(grp, 'vent 0', -0.48, 0.66, 0.22, 0.18, 0.08, 0.18, M.dark);
  box(grp, 'vent 1', 0.48, 0.66, -0.22, 0.18, 0.08, 0.18, M.dark);

  const dishMount = cyl(grp, 'dish mount', -0.52, 0.68, -0.42, 0.008, 0.06, M.darkElev, 6);
  dishMount.position.set(-0.52, 0.71, -0.42);
  const dish = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    M.silver,
  );
  dish.scale.y = 0.5;
  dish.position.set(-0.52, 0.76, -0.42);
  grp.add(dish);
  const dishLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.008, 6, 6),
    mat('#ff4444', { emissive: '#ff4444', emissiveIntensity: 0.4 }),
  );
  dishLed.position.set(-0.52, 0.74, -0.38);
  grp.add(dishLed);

  const rndTex = makeRnDTexture();
  const rndGrp = new THREE.Group();
  rndGrp.position.set(-0.95, -0.35, 0.95);
  grp.add(rndGrp);
  box(rndGrp, 'rnd post', 0, 0.09, 0, 0.04, 0.18, 0.08, M.darkElev);
  texturedPlane(rndGrp, rndTex, 0, 0.2, 0.045, 0.22, 0.1, 0);

  tree(g, hx - 0.55, hz + 0.75, 0.38);
  tree(g, hx - 0.2, hz + 0.95, 0.35);
  tree(g, hx + 0.35, hz + 0.7, 0.36);

  return windows;
}

function buildRTXHero(g: THREE.Group) {
  const grp = new THREE.Group();
  grp.position.set(0, 0.18, 0.4);
  grp.rotation.y = -0.22;
  g.add(grp);

  box(grp, 'rtx body', 0, 0, 0, 1.6, 0.26, 0.55, M.gpuBody);
  box(grp, 'rtx silver top', 0, 0.134, 0, 1.6, 0.008, 0.55, M.silver);

  for (let i = 0; i < 24; i++) {
    const fz = -0.22 + i * 0.018;
    box(grp, `fin ${i}`, -0.35, 0, fz, 0.7, 0.2, 0.008, M.fin);
  }

  const fanGrp = new THREE.Group();
  fanGrp.position.set(0.42, 0, 0);
  grp.add(fanGrp);
  const fanHousing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.6, 32),
    M.gpuBody,
  );
  fanHousing.rotation.x = Math.PI / 2;
  fanGrp.add(fanHousing);
  const fanRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.012, 8, 32),
    M.metal,
  );
  fanRim.rotation.x = Math.PI / 2;
  fanGrp.add(fanRim);
  for (let b = 0; b < 11; b++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.005, 0.04), M.fin);
    blade.rotation.y = (b / 11) * Math.PI * 2;
    blade.rotation.z = 0.12;
    blade.position.set(0.07, 0, 0);
    fanGrp.add(blade);
  }
  cyl(fanGrp, 'fan hub', 0, 0, 0, 0.04, 0.012, mat('#2a2a2a', { metalness: 0.5 }), 16);

  const rtxTex = makeRTXTexture();
  texturedPlane(grp, rtxTex, -0.2, 0.15, 0.28, 0.5, 0.12, 0, 0);

  box(grp, 'rtx front led', 0, -0.128, 0.282, 1.6, 0.004, 0.012,
    mat(C.nvGreen, { emissive: C.nvGreen, emissiveIntensity: 0.6 }));

  const backplate = box(grp, 'backplate', 0, 0, -0.282, 1.6, 0.24, 0.012, M.dark);
  backplate.name = 'backplate';
  for (let i = 0; i < 8; i++) {
    box(grp, `bp vent ${i}`, -0.55 + i * 0.14, 0, -0.276, 0.1, 0.18, 0.006, M.fin);
  }

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.65, 0.58),
    mat('#000000', { transparent: true, opacity: 0.35 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, -0.14, 0);
  grp.add(shadow);
}

function buildChipDisplay(g: THREE.Group): THREE.Mesh {
  const grp = new THREE.Group();
  grp.position.set(0.5, 0.85, -0.55);
  grp.rotation.x = -0.08;
  g.add(grp);

  box(grp, 'display bezel', 0, 0, 0, 2.0, 1.3, 0.06, M.dark);
  box(grp, 'display stand', 0, -0.72, 0.02, 0.7, 0.12, 0.2, M.darkElev);
  const kb = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 0.12), M.darkElev);
  kb.position.set(0.12, -0.68, 0.14);
  grp.add(kb);
  box(grp, 'kb led 0', 0.24, -0.67, 0.2, 0.012, 0.008, 0.008,
    mat(C.nvGreen, { emissive: C.nvGreen, emissiveIntensity: 0.35 }));
  box(grp, 'kb led 1', 0.3, -0.67, 0.2, 0.012, 0.008, 0.008,
    mat(C.nvGreen, { emissive: C.nvGreen, emissiveIntensity: 0.35 }));

  const chipTex = makeChipDesignTexture();
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.92, 1.22),
    new THREE.MeshStandardMaterial({
      map: chipTex,
      emissive: '#ffffff',
      emissiveMap: chipTex,
      emissiveIntensity: 0.95,
      roughness: 0.2,
    }),
  );
  screen.position.set(0, 0, 0.032);
  grp.add(screen);
  return screen;
}

function buildAIInfra(g: THREE.Group): THREE.Mesh[] {
  const bx = 1.55;
  const bz = 0.3;
  const pulseLeds: THREE.Mesh[] = [];

  box(g, 'infra platform', bx, 0.09, bz, 1.4, 0.06, 0.85, M.dark);
  box(g, 'infra cyan rim', bx, 0.122, bz + 0.42, 1.38, 0.008, 0.012, M.cyanRim);
  box(g, 'infra cyan rim b', bx, 0.122, bz - 0.42, 1.38, 0.008, 0.012, M.cyanRim);

  const rackW = 0.28;
  const rackH = 0.78;
  const rackD = 0.55;
  const gap = 0.04;
  const startX = bx - 1.5 * (rackW + gap);
  const ledRows = 7;

  for (let r = 0; r < 4; r++) {
    const rx = startX + r * (rackW + gap);
    const rack = new THREE.Group();
    rack.position.set(rx, 0.12 + rackH / 2, bz);
    g.add(rack);
    box(rack, 'rack body', 0, 0, 0, rackW, rackH, rackD, M.darkElev);
    box(rack, 'rack door', 0, 0, rackD / 2 + 0.004, rackW - 0.02, rackH - 0.04, 0.005, M.dark);

    for (let row = 0; row < ledRows; row++) {
      const ledW = 0.14 + (row % 3) * 0.05;
      const led = box(
        rack,
        `rack led ${r}_${row}`,
        0,
        rackH / 2 - 0.08 - row * 0.085,
        rackD / 2 + 0.008,
        ledW,
        0.012,
        0.005,
        M.cyanLed.clone(),
      );
      if (r === 1 && (row === 2 || row === 4)) pulseLeds.push(led);
      if (r === 3 && row === 3) pulseLeds.push(led);
    }
    box(rack, 'status y', 0.08, rackH / 2 - 0.05, rackD / 2 + 0.01, 0.02, 0.02, 0.005,
      mat('#ffcc00', { emissive: '#ffcc00', emissiveIntensity: 0.5 }));
    box(rack, 'status r', -0.08, rackH / 2 - 0.12, rackD / 2 + 0.01, 0.02, 0.02, 0.005,
      mat('#ff4444', { emissive: '#ff4444', emissiveIntensity: 0.5 }));

    for (let c = 0; c < 2; c++) {
      const cable = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 0.3, 6),
        mat('#050505', { roughness: 0.8 }),
      );
      cable.rotation.x = Math.PI / 2;
      cable.position.set(rx + (c === 0 ? -0.05 : 0.05), 0.2, bz - rackD / 2 - 0.12);
      g.add(cable);
    }
  }

  const labelTex = makeAIInfraLabelTexture();
  texturedPlane(g, labelTex, bx, 0.12 + rackH + 0.08, bz + 0.2, 0.85, 0.13, 0, 0);

  tree(g, bx + 0.85, bz + 0.55, 0.34);

  return pulseLeds;
}

function buildFrontLabels(g: THREE.Group) {
  const gpuTex = makeGPULabelTexture();
  const gpuGrp = new THREE.Group();
  gpuGrp.position.set(-0.1, 0.18, 1.35);
  g.add(gpuGrp);
  box(gpuGrp, 'gpu label body', 0, 0, 0, 0.4, 0.12, 0.1, M.darkElev);
  texturedPlane(gpuGrp, gpuTex, 0, 0, 0.052, 0.38, 0.1, 0, 0);

  const nvTex = makeNvidiaLogoTexture('#0a0a0a');
  const nvGrp = new THREE.Group();
  nvGrp.position.set(1.0, 0.2, 1.35);
  g.add(nvGrp);
  box(nvGrp, 'nv label body', 0, 0, 0, 0.8, 0.16, 0.1, M.darkElev);
  texturedPlane(nvGrp, nvTex, 0, 0, 0.052, 0.76, 0.14, 0.4, 0);
}

function buildNvidiaDiorama() {
  const g = new THREE.Group();
  buildBase(g);
  const hqWindows = buildHQ(g);
  buildRTXHero(g);
  const chipScreen = buildChipDisplay(g);
  const pulseLeds = buildAIInfra(g);
  buildFrontLabels(g);

  g.userData = { hqWindows, chipScreen, pulseLeds };
  return g;
}

interface NvidiaDioramaRuntime {
  hqWindows: THREE.Mesh[];
  chipScreen: THREE.Mesh;
  pulseLeds: THREE.Mesh[];
}

export function createNvidia(): THREE.Group {
  const root = buildNvidiaDiorama();
  root.userData.tick = (time: number) => {
    const u = root.userData as NvidiaDioramaRuntime;
    u.hqWindows.forEach((w) => {
      (w.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.55;
    });
    u.pulseLeds.forEach((led, i) => {
      (led.material as THREE.MeshStandardMaterial).emissiveIntensity =
        1.0 + Math.sin(time * 1.5 + i * 0.7) * 0.15;
    });
    (u.chipScreen.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.95;
  };
  return root;
}

/** Village grid alias (DesignScene NVDA). */
export function createNvidiaFab(): THREE.Group {
  return createNvidia();
}
