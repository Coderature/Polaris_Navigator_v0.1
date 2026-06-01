// @ts-nocheck — DESIGN diorama port; strict typing deferred.
import * as THREE from 'three';

/** XZ footprint multiplier (matches village ground scale). */
const GROUND_XZ = 1.25;
const gx = (n: number) => n * GROUND_XZ;

const HQ_X = -1.35;
const HQ_Z = -0.85;

const FAB_X = [0.55, 1.62, 2.69] as const;
const FAB_Z = -0.85;
const FAB_BODY_H = 1.05;
const SLAB_TOP = 0.08;
const FAB_Y = SLAB_TOP + FAB_BODY_H / 2;
const ROOF_TOP_Y = FAB_Y + FAB_BODY_H / 2 + 0.06;

const CONVEYOR_Z = 1.05;
const CONVEYOR_Y = 0.18;
const CONVEYOR_LEN = 3.6;
const CONVEYOR_START = -CONVEYOR_LEN / 2 + 0.15;
const CONVEYOR_END = CONVEYOR_LEN / 2 - 0.15;
type FabType = 'DRAM' | 'NAND' | 'FOUNDRY';

type MatOpts = {
  roughness?: number;
  metalness?: number;
  transparent?: boolean;
  opacity?: number;
  emissive?: string;
  emissiveIntensity?: number;
};

const C = {
  samsungBlue: '#1e3a8a',
  fabBlue: '#1a4fcf',
  fabBlueEm: '#0a2a8c',
  cyan: '#00e5d0',
  white: '#e8eef5',
  warm: '#ffe0a0',
  road: '#2a3445',
  base: '#1a2230',
  platform: '#2a3445',
  green: '#2f7d42',
  pcbGreen: '#15803d',
  gold: '#d4a017',
  ssdBlack: '#0a0a0a',
  wafer: '#c4b5fd',
  metalDark: '#202632',
  metalMid: '#2a3142',
  screenCyan: '#7dd3fc',
  ledGreen: '#34c759',
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
  samsungBlue: mat(C.samsungBlue, { roughness: 0.4, metalness: 0.1 }),
  fabBlue: mat(C.fabBlue, { emissive: C.fabBlueEm, emissiveIntensity: 0.35 }),
  cyanLED: mat(C.cyan, { emissive: C.cyan, emissiveIntensity: 1.4, roughness: 0.2 }),
  cyanLEDInner: mat(C.cyan, { emissive: C.cyan, emissiveIntensity: 0.9, roughness: 0.2 }),
  white: mat(C.white, { roughness: 0.75 }),
  dashWhite: mat('#f4f4f4', { roughness: 0.5 }),
  warmWindow: mat(C.warm, { emissive: '#ffe0a0', emissiveIntensity: 0.55, roughness: 0.35 }),
  road: mat(C.road, { roughness: 0.82 }),
  base: mat(C.base, { roughness: 0.85 }),
  platform: mat(C.platform, { roughness: 0.78 }),
  green: mat(C.green, { roughness: 0.85 }),
  dramPCB: mat(C.pcbGreen, { roughness: 0.6 }),
  dramChip: mat('#0a0a0a', { roughness: 0.4, metalness: 0.5 }),
  dramGold: mat(C.gold, { roughness: 0.25, metalness: 0.85 }),
  ssdBody: mat(C.ssdBlack, { roughness: 0.35, metalness: 0.6 }),
  wafer: mat(C.wafer, { roughness: 0.25, metalness: 0.85 }),
  metalDark: mat(C.metalDark, { roughness: 0.6, metalness: 0.4 }),
  metalMid: mat(C.metalMid, { roughness: 0.5, metalness: 0.5 }),
  silver: mat('#cfd4dc', { roughness: 0.35, metalness: 0.55 }),
  screen: mat(C.screenCyan, { emissive: C.screenCyan, emissiveIntensity: 0.6, roughness: 0.15 }),
  ledGreen: mat(C.ledGreen, { emissive: C.ledGreen, emissiveIntensity: 1.0, roughness: 0.2 }),
  conveyor: mat('#1f2733', { roughness: 0.7, metalness: 0.35 }),
  conveyorBelt: mat('#252830', { roughness: 0.85 }),
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

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function makeSamsungLogoTexture(fg = '#ffffff', bg = '#1e3a8a') {
  const c = document.createElement('canvas');
  c.width = 768;
  c.height = 192;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.ellipse(c.width / 2, c.height / 2, c.width / 2 - 10, c.height / 2 - 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.font = 'bold 76px "Arial Black", Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SAMSUNG', c.width / 2, c.height / 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeSamsungElectronicsTexture() {
  const c = document.createElement('canvas');
  c.width = 1536;
  c.height = 220;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 88px "Helvetica Neue", Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SAMSUNG ELECTRONICS', c.width / 2, c.height / 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeFabNameTexture(name: string) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#1a4fcf';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 40px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, c.width / 2, c.height / 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeFabPlaqueTexture(title: string, subtitle: string) {
  const c = document.createElement('canvas');
  c.width = 384;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, 4, 4, c.width - 8, c.height - 8, 12);
  ctx.fill();
  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(title, c.width / 2, 70);
  ctx.fillStyle = '#555';
  ctx.font = '22px Arial';
  ctx.fillText(subtitle, c.width / 2, 120);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeVNANDLabelTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#0a0a0a';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SAMSUNG', c.width / 2, 22);
  ctx.fillText('V-NAND SSD', c.width / 2, 44);
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
  rotY = 0,
  emissive = 0.35,
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

function addCyanLedRim(g: THREE.Group, cx: number, cy: number, cz: number, w: number, d: number, inset: number) {
  const hw = w / 2;
  const hd = d / 2;
  const t = 0.02;
  const h = 0.04;
  const mat = inset === 0 ? M.cyanLED : M.cyanLEDInner;
  box(g, `led rim F ${inset}`, cx, cy + h / 2, cz + hd + t / 2, w, h, t, mat);
  box(g, `led rim B ${inset}`, cx, cy + h / 2, cz - hd - t / 2, w, h, t, mat);
  box(g, `led rim L ${inset}`, cx - hw - t / 2, cy + h / 2, cz, t, h, d, mat);
  box(g, `led rim R ${inset}`, cx + hw + t / 2, cy + h / 2, cz, t, h, d, mat);
}

function createFabRoof(w: number, d: number) {
  const grp = new THREE.Group();
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(w, 0.04, d),
    M.white,
  );
  slab.position.y = 0.02;
  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.02, 0.02, d + 0.02),
    M.fabBlue,
  );
  trim.position.y = 0.05;
  grp.add(slab, trim);
  return grp;
}

function createPedestal() {
  const grp = new THREE.Group();
  box(grp, 'ped base', 0, 0.03, 0, 0.5, 0.06, 0.5, M.metalDark);
  box(grp, 'ped top', 0, 0.09, 0, 0.38, 0.05, 0.38, M.metalMid);
  return grp;
}

function createDRAMStatue() {
  const grp = new THREE.Group();
  const pcb = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.04), M.dramPCB);
  pcb.castShadow = true;
  grp.add(pcb);
  for (let i = 0; i < 4; i++) {
    const chip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.012), M.dramChip);
    chip.position.set(-0.24 + i * 0.16, 0.02, 0.022);
    grp.add(chip);
    const chipB = chip.clone();
    chipB.position.z = -0.022;
    grp.add(chipB);
  }
  const pins = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.02, 0.04), M.dramGold);
  pins.position.set(0, -0.1, 0);
  grp.add(pins);
  const sticker = new THREE.Mesh(
    new THREE.PlaneGeometry(0.2, 0.06),
    mat('#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.3 }),
  );
  sticker.position.set(0, 0.06, 0.025);
  grp.add(sticker);
  grp.rotation.y = -0.15;
  return grp;
}

function createNANDStatue() {
  const grp = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.28, 0.08), M.ssdBody);
  body.castShadow = true;
  grp.add(body);
  const labelTex = makeVNANDLabelTexture();
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(0.42, 0.12),
    new THREE.MeshStandardMaterial({
      map: labelTex,
      emissive: '#ffffff',
      emissiveMap: labelTex,
      emissiveIntensity: 0.4,
    }),
  );
  label.position.set(0, 0.02, 0.041);
  grp.add(label);
  box(grp, 'sata', 0.28, 0, 0, 0.04, 0.02, 0.08, M.dramGold);
  return grp;
}

function createWaferStatue() {
  const grp = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.025, 64), M.wafer);
  disc.rotation.x = Math.PI / 2;
  disc.castShadow = true;
  grp.add(disc);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const die = new THREE.Mesh(
        new THREE.PlaneGeometry(0.14, 0.14),
        mat(i % 2 === j % 2 ? '#7c3aed' : '#06b6d4', {
          emissive: i % 2 === j % 2 ? '#7c3aed' : '#06b6d4',
          emissiveIntensity: 0.35,
        }),
      );
      die.position.set(-0.21 + i * 0.14, 0.014, -0.21 + j * 0.14);
      die.rotation.x = -Math.PI / 2;
      grp.add(die);
    }
  }
  box(grp, 'wafer notch', 0.32, 0.01, 0, 0.06, 0.03, 0.04, M.metalDark);
  grp.rotation.x = Math.PI / 2 * 0.92;
  grp.rotation.z = 0.08;
  return grp;
}

function createMiniDRAM(scale = 1) {
  const g = createDRAMStatue();
  g.scale.setScalar(scale * 0.4);
  return g;
}

function createSemiPackage() {
  const grp = new THREE.Group();
  box(grp, 'pkg', 0, 0.02, 0, 0.12, 0.04, 0.12, mat('#1f2733'));
  box(grp, 'pad', 0, 0.045, 0, 0.08, 0.005, 0.08, M.silver);
  return grp;
}

function createMiniSSD() {
  const grp = new THREE.Group();
  box(grp, 'ssd', 0, 0.015, 0, 0.14, 0.03, 0.1, M.ssdBody);
  const t = makeVNANDLabelTexture();
  const lbl = new THREE.Mesh(
    new THREE.PlaneGeometry(0.1, 0.03),
    new THREE.MeshStandardMaterial({ map: t, emissive: '#fff', emissiveMap: t, emissiveIntensity: 0.3 }),
  );
  lbl.position.set(0, 0.032, 0.051);
  grp.add(lbl);
  return grp;
}

function createMiniWafer() {
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.015, 24),
    M.wafer,
  );
  disc.rotation.x = Math.PI / 2;
  return disc;
}

function createProcessingStation(g: THREE.Group, x: number, y: number, z: number, idx: number) {
  const grp = new THREE.Group();
  grp.position.set(x, y, z);
  g.add(grp);
  box(grp, `station body ${idx}`, 0, 0.14, 0, 0.25, 0.28, 0.4, M.white);
  box(grp, `station band ${idx}`, 0, 0.27, 0, 0.25, 0.05, 0.4, M.fabBlue);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.12), M.screen.clone());
  screen.position.set(0, 0.14, 0.205);
  grp.add(screen);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), M.ledGreen);
  led.position.set(0.14, 0.2, 0.1);
  grp.add(led);
  return { group: grp, screen };
}

function createSamsungTruck(g: THREE.Group, x: number, y: number, z: number) {
  const grp = new THREE.Group();
  grp.position.set(x, y, z);
  g.add(grp);
  box(grp, 'truck cabin', -0.12, 0.06, 0, 0.14, 0.12, 0.14, M.samsungBlue);
  box(grp, 'truck cargo', 0.1, 0.08, 0, 0.28, 0.16, 0.16, M.white);
  const logoTex = makeSamsungLogoTexture('#1428a0', '#ffffff');
  const side = new THREE.Mesh(
    new THREE.PlaneGeometry(0.24, 0.08),
    new THREE.MeshStandardMaterial({
      map: logoTex,
      emissive: '#ffffff',
      emissiveMap: logoTex,
      emissiveIntensity: 0.35,
    }),
  );
  side.position.set(0.1, 0.1, 0.081);
  side.rotation.y = 0;
  grp.add(side);
  [[-0.18, -0.07], [-0.18, 0.07], [0.22, -0.07], [0.22, 0.07]].forEach(([bx, bz], i) => {
    const w = cyl(grp, `wheel ${i}`, bx, 0.025, bz, 0.025, 0.03, M.metalDark, 12);
    w.rotation.x = Math.PI / 2;
  });
  return grp;
}

function createSamsungHQ(g: THREE.Group) {
  const grp = new THREE.Group();
  grp.position.set(HQ_X, SLAB_TOP, HQ_Z);
  g.add(grp);

  const W = 1.9;
  const H = 2.05;
  const D = 1.6;
  const colStep = (W - 0.24) / 7;
  const rowStep = (H - 0.5) / 5;

  box(grp, 'hq body', 0, H / 2, 0, W, H, D, M.samsungBlue);

  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 8; col++) {
      const wx = -W / 2 + 0.12 + col * colStep;
      const wy = 0.28 + row * rowStep;
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.17), M.warmWindow.clone());
      win.position.set(wx, wy, D / 2 + 0.006);
      grp.add(win);
    }
  }
  for (let col = 0; col < 7; col++) {
    const mx = -W / 2 + 0.2 + col * colStep;
    box(grp, `mullion ${col}`, mx, H / 2, D / 2 + 0.008, 0.014, H * 0.78, 0.012, M.silver);
  }

  box(grp, 'electronics band', 0, H * 0.5, D / 2 + 0.008, W + 0.08, 0.38, 0.014, M.white);
  texturedPlane(grp, makeSamsungElectronicsTexture(), 0, H * 0.5, D / 2 + 0.016, W * 1.02, 0.34, 0, 0.6);

  box(grp, 'lobby canopy', 0, 0.22, D / 2 + 0.22, 1.0, 0.07, 0.52, M.samsungBlue);
  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(0.48, 0.34),
    mat('#0a1020', { emissive: '#00e5d0', emissiveIntensity: 0.25 }),
  );
  door.position.set(0, 0.24, D / 2 + 0.28);
  grp.add(door);

  const canopy = box(grp, 'roof canopy', 0, H + 0.12, 0, W + 0.42, 0.1, D + 0.36, M.white);
  canopy.rotation.x = -0.08;

  const logoDisc = cyl(grp, 'logo disc', 0, H + 0.28, D / 2 + 0.1, 0.78, 0.05, M.samsungBlue, 32);
  logoDisc.scale.z = 0.45;
  logoDisc.rotation.x = -0.12;
  const logoTex = makeSamsungLogoTexture('#ffffff', '#1e3a8a');
  const logoPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.45, 0.38),
    new THREE.MeshStandardMaterial({
      map: logoTex,
      emissive: '#ffffff',
      emissiveMap: logoTex,
      emissiveIntensity: 0.65,
    }),
  );
  logoPlane.position.set(0, H + 0.3, D / 2 + 0.15);
  logoPlane.rotation.x = -0.12;
  grp.add(logoPlane);

  return grp;
}

function createFab(
  g: THREE.Group,
  x: number,
  z: number,
  fabType: FabType,
  statue: THREE.Object3D,
  plaque: { title: string; sub: string },
) {
  const grp = new THREE.Group();
  grp.position.set(x, SLAB_TOP, z);
  g.add(grp);

  const W = 0.95;
  const H = FAB_BODY_H;

  box(grp, `${fabType} body`, 0, FAB_Y, 0, W, H, 1.05, M.white);
  box(grp, `${fabType} band`, 0, FAB_Y + H / 2 - 0.09, 1.05 / 2 + 0.006, W, 0.18, 0.012, M.fabBlue);
  texturedPlane(grp, makeFabNameTexture(fabType), 0, FAB_Y + H / 2 - 0.09, 1.05 / 2 + 0.012, W * 0.85, 0.12, 0, 0.5);

  const plaqueTex = makeFabPlaqueTexture(plaque.title, plaque.sub);
  texturedPlane(
    grp,
    plaqueTex,
    W / 2 - 0.22,
    FAB_Y - 0.05,
    1.05 / 2 + 0.008,
    0.35,
    0.45,
    0,
    0.3,
  );

  box(grp, `${fabType} dock`, -W / 2 + 0.28, 0.22, 1.05 / 2 + 0.008, 0.38, 0.32, 0.02, mat('#1c2030'));
  const statusLed = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), M.ledGreen);
  statusLed.position.set(-W / 2 + 0.12, 0.38, 1.05 / 2 + 0.02);
  grp.add(statusLed);

  const roof = createFabRoof(W + 0.05, 1.1);
  roof.position.y = ROOF_TOP_Y;
  grp.add(roof);

  const pedestal = createPedestal();
  pedestal.position.set(0, ROOF_TOP_Y + 0.12, 0);
  grp.add(pedestal);

  const statueMount = statue.clone();
  statueMount.scale.setScalar(2.4);
  statueMount.position.set(0, ROOF_TOP_Y + 0.28, 0);
  grp.add(statueMount);

  const spot = new THREE.SpotLight('#fff4d6', 1.6, 2.4, Math.PI / 6, 0.4, 1.2);
  spot.position.set(0, ROOF_TOP_Y + 1.2, 0.2);
  spot.target.position.set(0, ROOF_TOP_Y + 0.2, 0);
  grp.add(spot);
  grp.add(spot.target);

  return { group: grp, statue: statueMount };
}

function tree(g: THREE.Group, x: number, z: number, s = 0.45) {
  cyl(g, 'trunk', x, 0.23 * s, z, 0.035, 0.38 * s, mat('#7a4b2a', { roughness: 0.85 }), 10);
  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.18 * s, 14, 10), M.green);
  crown.position.set(x, 0.52 * s, z);
  crown.castShadow = true;
  g.add(crown);
}

function buildSamsungDiorama() {
  const g = new THREE.Group();

  box(g, 'plinth', 0, -0.13, 0, gx(4.2), 0.26, gx(3.4), M.base);
  const slabY = 0.05;
  box(g, 'slab', 0, slabY, 0, gx(4.2), 0.06, gx(3.4), M.base);
  addCyanLedRim(g, 0, slabY + 0.04, 0, gx(4.2), gx(3.4), 0);
  addCyanLedRim(g, 0, slabY + 0.04, 0, gx(4.2) - 0.36, gx(3.4) - 0.36, 0.18);

  box(g, 'road patch', HQ_X - 0.2, 0.088, HQ_Z + 0.55, 1.2, 0.012, 0.5, M.road);
  for (let i = 0; i < 3; i++) {
    box(g, `dash ${i}`, HQ_X - 0.5 + i * 0.22, 0.092, HQ_Z + 0.35, 0.14, 0.005, 0.02, M.dashWhite);
  }
  for (let i = 0; i < 4; i++) {
    box(g, `cross ${i}`, HQ_X + 0.15 + (i % 2) * 0.08, 0.092, HQ_Z + 0.72 + Math.floor(i / 2) * 0.1, 0.04, 0.005, 0.04, M.dashWhite);
  }

  createSamsungHQ(g);

  const grassPatch = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.55), M.green);
  grassPatch.rotation.x = -Math.PI / 2;
  grassPatch.position.set(HQ_X - 0.25, 0.087, HQ_Z - 0.15);
  g.add(grassPatch);

  box(g, 'pylon', HQ_X - 0.88, 0.28, HQ_Z + 0.72, 0.07, 0.48, 0.06, M.samsungBlue);
  const sideSignTex = makeSamsungLogoTexture('#ffffff', '#1e3a8a');
  texturedPlane(g, sideSignTex, HQ_X - 0.88, 0.48, HQ_Z + 0.76, 0.26, 0.16, 0, 0.5);
  texturedPlane(g, sideSignTex, HQ_X - 1.05, 0.72, HQ_Z + 0.35, 0.28, 0.62, Math.PI / 2, 0.45);
  createSamsungTruck(g, HQ_X + 0.55, 0.06, HQ_Z + 0.45);

  g.add(new THREE.AmbientLight('#dceaff', 0.55));
  const key = new THREE.DirectionalLight('#ffffff', 0.9);
  key.position.set(3, 6, 4);
  g.add(key);

  const fabPlaques: { title: string; sub: string }[] = [
    { title: 'DRAM', sub: 'Memory Solutions' },
    { title: 'NAND', sub: 'Flash Storage Solutions' },
    { title: 'FOUNDRY', sub: 'Advanced Process Solutions' },
  ];
  const statues = [createDRAMStatue(), createNANDStatue(), createWaferStatue()];
  (['DRAM', 'NAND', 'FOUNDRY'] as FabType[]).forEach((type, i) => {
    createFab(g, FAB_X[i], FAB_Z, type, statues[i], fabPlaques[i]);
  });

  const conveyorCx = (FAB_X[0] + FAB_X[2]) / 2;
  box(g, 'conveyor base', conveyorCx, CONVEYOR_Y, CONVEYOR_Z, CONVEYOR_LEN, 0.04, 0.32, M.conveyor);
  box(g, 'conveyor belt', conveyorCx, CONVEYOR_Y + 0.035, CONVEYOR_Z, CONVEYOR_LEN, 0.02, 0.28, M.conveyorBelt);
  const rollerL = cyl(g, 'roller L', conveyorCx - CONVEYOR_LEN / 2 + 0.05, CONVEYOR_Y + 0.02, CONVEYOR_Z, 0.05, 0.34, M.silver, 12);
  rollerL.rotation.x = Math.PI / 2;
  const rollerR = cyl(g, 'roller R', conveyorCx + CONVEYOR_LEN / 2 - 0.05, CONVEYOR_Y + 0.02, CONVEYOR_Z, 0.05, 0.34, M.silver, 12);
  rollerR.rotation.x = Math.PI / 2;
  for (let i = 0; i < 8; i++) {
    const lx = conveyorCx - CONVEYOR_LEN / 2 + 0.2 + (i % 4) * (CONVEYOR_LEN / 4);
    box(g, `leg f ${i}`, lx, CONVEYOR_Y - 0.04, CONVEYOR_Z + 0.12, 0.05, 0.1, 0.05, M.dashWhite);
    box(g, `leg b ${i}`, lx, CONVEYOR_Y - 0.04, CONVEYOR_Z - 0.12, 0.05, 0.1, 0.05, M.dashWhite);
  }

  for (let i = 1; i <= 4; i++) {
    const sx = conveyorCx - CONVEYOR_LEN / 2 + (CONVEYOR_LEN / 5) * i;
    createProcessingStation(g, sx, CONVEYOR_Y + 0.02, CONVEYOR_Z, i);
  }

  const pkgTypes = ['dram', 'semi', 'ssd', 'wafer', 'dram', 'semi', 'ssd', 'semi', 'wafer', 'dram'] as const;
  const pkgMinX = conveyorCx + CONVEYOR_START;
  const pkgMaxX = conveyorCx + CONVEYOR_END;
  pkgTypes.forEach((type, i) => {
    let pkg: THREE.Object3D;
    if (type === 'dram') pkg = createMiniDRAM(1);
    else if (type === 'ssd') pkg = createMiniSSD();
    else if (type === 'wafer') pkg = createMiniWafer();
    else pkg = createSemiPackage();
    const wrap = new THREE.Group();
    wrap.add(pkg);
    wrap.position.set(
      pkgMinX + (i / pkgTypes.length) * (pkgMaxX - pkgMinX),
      CONVEYOR_Y + 0.1,
      CONVEYOR_Z,
    );
    g.add(wrap);
  });

  const treeSpots: [number, number][] = [
    [HQ_X - 0.7, HQ_Z - 0.35],
    [HQ_X - 0.5, HQ_Z + 0.65],
    [HQ_X + 0.35, HQ_Z + 0.75],
    [FAB_X[0] - 0.35, FAB_Z - 0.45],
    [FAB_X[2] + 0.35, FAB_Z - 0.45],
    [conveyorCx, CONVEYOR_Z + 0.55],
  ];
  treeSpots.forEach(([x, z]) => tree(g, x, z, 0.42));

  const hqLobby = new THREE.PointLight('#ffd9a0', 0.6, 2.5, 1.5);
  hqLobby.position.set(HQ_X, 0.5, HQ_Z + 0.5);
  g.add(hqLobby);

  return g;
}

export function createSamsungFab(): THREE.Group {
  return buildSamsungDiorama();
}
