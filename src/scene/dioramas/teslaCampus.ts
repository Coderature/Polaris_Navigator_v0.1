// @ts-nocheck — DESIGN diorama port; strict typing deferred.
import * as THREE from 'three';

const GROUND_XZ = 1.25;
const gx = (n: number) => n * GROUND_XZ;

type MatOpts = {
  roughness?: number;
  metalness?: number;
  transparent?: boolean;
  opacity?: number;
  emissive?: string;
  emissiveIntensity?: number;
  side?: THREE.Side;
};

// ===== Palette (Tesla tone: black, red, silver, glass) =====
const C = {
  teslaRed: '#e82127', teslaRedDark: '#a8001a', teslaRedBright: '#ff3a4a',
  ledRed: '#ff1a2e',
  black: '#0a0a0a', darkGrey: '#1a1a1d',
  metalDark: '#3a3a40', metal: '#7a7a80', silver: '#c8c8cc',
  glass: '#4a8eda', glassLight: '#aedffa', glassDeep: '#2563a8',
  road: '#262830', base: '#08090d', platform: '#1a1d23',
  grass: '#2d8c4a', grassLight: '#3fa85e',
  warm: '#fff2c8', amber: '#ffaf3a',
  solar: '#1a3052', solarHot: '#0a3a8a',
  screenBlue: '#3a78ff', screenCyan: '#4ab8e8', screenAI: '#5a4ac9',
  hotData: '#ff7a92', goldGlow: '#ffd970'
};

const mat = (color: string, o: MatOpts = {}) => new THREE.MeshStandardMaterial({
  color,
  roughness: o.roughness ?? 0.6,
  metalness: o.metalness ?? 0.08,
  transparent: o.transparent ?? false,
  opacity: o.opacity ?? 1,
  emissive: o.emissive ?? '#000000',
  emissiveIntensity: o.emissiveIntensity ?? 0,
  side: o.side ?? THREE.FrontSide
});

const M = {
  teslaRed: mat(C.teslaRed, { roughness: .35, metalness: .35, emissive: '#5a0d10', emissiveIntensity: .2 }),
  teslaRedHot: mat(C.teslaRed, { emissive: C.teslaRedBright, emissiveIntensity: 0.5, roughness: .35 }),
  teslaRedLED: mat(C.ledRed, { emissive: C.ledRed, emissiveIntensity: 0.5, roughness: .3 }),
  black: mat(C.black, { roughness: .55, metalness: .15 }),
  darkGrey: mat(C.darkGrey, { roughness: .5, metalness: .2 }),
  metalDark: mat(C.metalDark, { roughness: .35, metalness: .65 }),
  metal: mat(C.metal, { roughness: .35, metalness: .55 }),
  silver: mat(C.silver, { roughness: .32, metalness: .55 }),
  white: mat('#f4f4f4', { roughness: .4, metalness: .1 }),
  whiteHot: mat('#ffffff', { emissive: '#ffffff', emissiveIntensity: 1.4, roughness: .25 }),
  glass: mat(C.glass, { roughness: .1, metalness: .15, transparent: true, opacity: .5, emissive: '#1e4fa3', emissiveIntensity: .12 }),
  glassDeep: mat(C.glassDeep, { roughness: .12, metalness: .15, transparent: true, opacity: .65 }),
  glassLight: mat(C.glassLight, { roughness: .08, metalness: .1, transparent: true, opacity: .35 }),
  road: mat(C.road, { roughness: .82 }),
  base: mat(C.base, { roughness: .55 }),
  platform: mat(C.platform, { roughness: .78 }),
  grass: mat(C.grass, { roughness: .85 }),
  grassLight: mat(C.grassLight, { roughness: .8 }),
  warmWindow: mat(C.warm, { roughness: .35, emissive: '#ffb93d', emissiveIntensity: .65 }),
  amberLight: mat(C.amber, { emissive: C.amber, emissiveIntensity: 1.0, roughness: .3 }),
  green: mat('#2f7d42', { roughness: .8 }),
  bark: mat('#7a4b2a', { roughness: .85 }),
  solar: mat(C.solar, { roughness: .25, metalness: .6, emissive: C.solarHot, emissiveIntensity: .2 }),
  solarGrid: mat('#2a4880', { roughness: .3, metalness: .5 }),
  screen: mat(C.screenBlue, { emissive: C.screenBlue, emissiveIntensity: 1.2, roughness: .15 }),
  screenAI: mat(C.screenAI, { emissive: C.screenAI, emissiveIntensity: 1.0, roughness: .15 }),
  dataBead: new THREE.MeshStandardMaterial({
    color: C.hotData, emissive: C.hotData, emissiveIntensity: 2.0, roughness: .25
  }),
  goldCoin: new THREE.MeshStandardMaterial({
    color: '#ffd700', emissive: '#ffaa00', emissiveIntensity: 1.6,
    roughness: .25, metalness: .85
  })
};

function box(g, name, x, y, z, sx, sy, sz, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.castShadow = true; mesh.receiveShadow = true;
  g.add(mesh);
  return mesh;
}
function cyl(g, name, x, y, z, r, h, material, radial = 24) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, radial), material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.castShadow = true; mesh.receiveShadow = true;
  g.add(mesh);
  return mesh;
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawTeslaT(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  const s = size;
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.42, cy - s * 0.5);
  ctx.lineTo(cx + s * 0.42, cy - s * 0.5);
  ctx.lineTo(cx + s * 0.32, cy - s * 0.36);
  ctx.lineTo(cx - s * 0.32, cy - s * 0.36);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(cx - s * 0.28, cy - s * 0.32, s * 0.56, s * 0.06);
  ctx.fillRect(cx - s * 0.08, cy - s * 0.22, s * 0.16, s * 0.72);
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.18, cy - s * 0.22);
  ctx.lineTo(cx - s * 0.08, cy - s * 0.22);
  ctx.lineTo(cx - s * 0.08, cy - s * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.18, cy - s * 0.22);
  ctx.lineTo(cx + s * 0.08, cy - s * 0.22);
  ctx.lineTo(cx + s * 0.08, cy - s * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function makeTeslaLogoTexture(bg = '#0a0a0a', fg = '#e82127', withText = true) {
  const c = document.createElement('canvas');
  c.width = withText ? 1024 : 512;
  c.height = 512;
  const ctx = c.getContext('2d')!
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, c.width, c.height);
  if (withText) {
    drawTeslaT(ctx, 200, c.height/2, 280, fg);
    ctx.fillStyle = fg;
    ctx.font = 'bold 180px "Helvetica Neue", Arial';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('T E S L A', 380, c.height/2);
  } else {
    drawTeslaT(ctx, c.width/2, c.height/2, 360, fg);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeLabelPanelTexture(num, korTitle, korSubtitle, accentColor = '#e82127') {
  const c = document.createElement('canvas');
  c.width = 768; c.height = 280;
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#0a0a0a';
  roundRect(ctx, 6, 6, c.width-12, c.height-12, 32);
  ctx.fill();
  ctx.strokeStyle = '#3a3a3a';
  ctx.lineWidth = 3;
  roundRect(ctx, 6, 6, c.width-12, c.height-12, 32);
  ctx.stroke();
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.arc(90, 85, 42, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 56px "Helvetica Neue", Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(num, 90, 88);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 56px "Malgun Gothic", Arial';
  ctx.textAlign = 'left';
  ctx.fillText(korTitle, 160, 85);
  if (korSubtitle) {
    ctx.fillStyle = '#c4c4c8';
    ctx.font = '34px "Malgun Gothic", Arial';
    korSubtitle.split('\n').forEach((line, i) => {
      ctx.fillText(line, 50, 175 + i * 44);
    });
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeFacadeTextTexture(text, bg = '#0a0a0a', fg = '#ffffff') {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 128;
  const ctx = c.getContext('2d')!
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = fg;
  ctx.font = 'bold 72px "Helvetica Neue", Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, c.width/2, c.height/2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeFSDDisplayTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const ctx = c.getContext('2d')!
  const grad = ctx.createLinearGradient(0, 0, 0, c.height);
  grad.addColorStop(0, '#0a1828');
  grad.addColorStop(1, '#1a3052');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#4a8eda';
  ctx.beginPath();
  ctx.arc(180, 220, 75, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px "Helvetica Neue", Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('AI', 180, 230);
  ctx.fillStyle = 'rgba(232, 33, 39, 0.85)';
  roundRect(ctx, 320, 170, 220, 110, 16);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 60px "Helvetica Neue", Arial';
  ctx.fillText('FSD', 430, 230);
  ctx.fillStyle = 'rgba(74, 142, 218, 0.85)';
  roundRect(ctx, 600, 170, 240, 110, 16);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px "Helvetica Neue", Arial';
  ctx.fillText('Dojo', 720, 230);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeTeslaAppTexture() {
  const c = document.createElement('canvas');
  c.width = 384; c.height = 768;
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#0a0a0a';
  roundRect(ctx, 0, 0, c.width, c.height, 30);
  ctx.fill();
  drawTeslaT(ctx, 80, 95, 50, '#e82127');
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px "Helvetica Neue", Arial';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('TESLA APP', 120, 95);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeBigTeslaLogoTexture() {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 384;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 260px "Helvetica Neue", Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 30;
  ctx.fillText('T E S L A', c.width / 2, c.height / 2);
  ctx.shadowBlur = 0;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeGigafactoryBannerTexture() {
  const c = document.createElement('canvas');
  c.width = 1536;
  c.height = 200;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, c.width, c.height);
  drawTeslaT(ctx, 90, c.height / 2, 56, '#e82127');
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px "Helvetica Neue", Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 10;
  ctx.fillText('TESLA  GIGAFACTORY', 170, c.height / 2 - 24);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#888';
  ctx.font = 'bold 30px "Helvetica Neue", Arial';
  ctx.fillText('BUILDING A SUSTAINABLE FUTURE', 170, c.height / 2 + 38);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeAIDrivenTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = '#e82127';
  ctx.lineWidth = 4;
  roundRect(ctx, 10, 10, c.width - 20, c.height - 20, 16);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px "Helvetica Neue", Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('AI DRIVEN', c.width / 2, 110);
  ctx.fillText('PRODUCTION', c.width / 2, 170);
  ctx.strokeStyle = '#e82127';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, 220);
  ctx.lineTo(c.width - 100, 220);
  ctx.stroke();
  ctx.fillStyle = '#cccccc';
  ctx.beginPath();
  ctx.ellipse(c.width / 2, 380, 140, 28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#888';
  ctx.beginPath();
  ctx.ellipse(c.width / 2, 355, 85, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a1d';
  ctx.beginPath();
  ctx.arc(c.width / 2 - 80, 400, 16, 0, Math.PI * 2);
  ctx.arc(c.width / 2 + 80, 400, 16, 0, Math.PI * 2);
  ctx.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function rooftopPanel(g, num, title, subtitle, x, y, z, w = 0.95, h = 0.35, accent = '#e82127') {
  const tex = makeLabelPanelTexture(num, title, subtitle, accent);
  const m = new THREE.MeshStandardMaterial({
    map: tex, side: THREE.DoubleSide, roughness: .4,
    emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: .35
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  mesh.position.set(x, y, z);
  g.add(mesh);
  cyl(g, `panel post ${num}`, x, y - h/2 - 0.16, z, 0.014, 0.32, M.silver, 8);
  return mesh;
}

function texturedPlane(g, tex, x, y, z, w, h, rotY = 0, emissive = 0.3) {
  const m = new THREE.MeshStandardMaterial({
    map: tex, side: THREE.DoubleSide, roughness: .4,
    emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: emissive
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  mesh.position.set(x, y, z);
  mesh.rotation.y = rotY;
  g.add(mesh);
  return mesh;
}

function tree(g, x, z, s = .5) {
  cyl(g, 'tree trunk', x, .23 * s / .5, z, .035, .38 * s / .5, M.bark, 10);
  const crown = new THREE.Mesh(new THREE.SphereGeometry(.18 * s / .5, 16, 12), M.green);
  crown.position.set(x, .52 * s / .5, z);
  crown.castShadow = true; crown.receiveShadow = true;
  g.add(crown);
}

function createTeslaCar(g, x, y, z, color = '#e8e8e8', rotY = 0, scale = 1) {
  const grp = new THREE.Group();
  grp.position.set(x, y, z);
  grp.rotation.y = rotY;
  grp.scale.setScalar(scale);
  g.add(grp);
  const carMat = mat(color, { metalness: .55, roughness: .25 });
  box(grp, 'car lower', 0, 0.035, 0, 0.28, 0.05, 0.13, carMat);
  box(grp, 'car cabin', 0, 0.085, 0, 0.22, 0.05, 0.12, carMat);
  box(grp, 'car glass', 0, 0.085, 0, 0.21, 0.045, 0.122, M.glassDeep);
  [[-0.1, 0.062], [0.1, 0.062], [-0.1, -0.062], [0.1, -0.062]].forEach(([bx, bz]) => {
    const w = cyl(grp, 'wheel', bx, 0.022, bz, 0.022, 0.025, M.metalDark, 14);
    w.rotation.x = Math.PI / 2;
  });
  return grp;
}

function createRobotArm(g, x, y, z, baseRot = 0, scale = 1) {
  const grp = new THREE.Group();
  grp.position.set(x, y, z);
  grp.rotation.y = baseRot;
  grp.scale.setScalar(scale);
  g.add(grp);
  cyl(grp, 'arm base', 0, 0.04, 0, 0.06, 0.08, M.darkGrey, 16);
  const shoulder = new THREE.Group();
  shoulder.position.set(0, 0.1, 0);
  grp.add(shoulder);
  const seg1 = new THREE.Group();
  seg1.rotation.z = -Math.PI / 4;
  shoulder.add(seg1);
  box(seg1, 'arm seg1', 0, 0.13, 0, 0.05, 0.28, 0.05, M.teslaRed);
  const seg2 = new THREE.Group();
  seg2.position.set(0, 0.27, 0);
  seg2.rotation.z = -Math.PI / 5;
  seg1.add(seg2);
  box(seg2, 'arm seg2', 0, 0.09, 0, 0.04, 0.2, 0.04, mat('#cc0a26', { metalness: .35 }));
  const led = new THREE.Mesh(
    new THREE.SphereGeometry(0.008, 8, 8),
    new THREE.MeshBasicMaterial({ color: '#ffcf3a' })
  );
  led.position.set(0, 0.265, 0);
  seg2.add(led);
  return { group: grp, shoulder, seg1, seg2, led };
}
function createMegapack(g, x, y, z, scale = 1) {
  const grp = new THREE.Group();
  grp.position.set(x, y, z); grp.scale.setScalar(scale);
  g.add(grp);
  box(grp, 'mp body', 0, 0.14, 0, 0.22, 0.28, 0.42, M.silver);
  for (let i = 0; i < 3; i++) {
    box(grp, `mp stripe ${i}`, 0, 0.07 + i*0.08, 0, 0.222, 0.005, 0.42, M.metalDark);
  }
  return grp;
}

function createSupercharger(g, x, y, z, rotY = 0, scale = 1) {
  const grp = new THREE.Group();
  grp.position.set(x, y, z); grp.rotation.y = rotY; grp.scale.setScalar(scale);
  g.add(grp);
  box(grp, 'sc body', 0, 0.18, 0, 0.09, 0.36, 0.05, M.white);
  box(grp, 'sc red top', 0, 0.34, 0.026, 0.09, 0.04, 0.005, M.teslaRedHot);
  box(grp, 'sc base', 0, 0.02, 0, 0.11, 0.04, 0.08, M.platform);
  return grp;
}

function createSuperchargerSign(g, x, y, z, rotY = 0, scale = 1) {
  const grp = new THREE.Group();
  grp.position.set(x, y, z); grp.rotation.y = rotY; grp.scale.setScalar(scale);
  g.add(grp);
  cyl(grp, 'sign post', 0, 0.18, 0, 0.025, 0.36, M.metalDark, 12);
  box(grp, 'sign box', 0, 0.42, 0, 0.34, 0.42, 0.05, M.teslaRed);
  const signTex = (() => {
    const c = document.createElement('canvas');
    c.width = 384; c.height = 480;
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#e31937';
    ctx.fillRect(0, 0, c.width, c.height);
    drawTeslaT(ctx, c.width/2, 130, 180, '#ffffff');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px "Helvetica Neue", Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('T E S L A', c.width/2, 260);
    ctx.font = 'bold 28px "Helvetica Neue", Arial';
    ctx.fillText('SUPERCHARGER', c.width/2, 330);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const front = new THREE.Mesh(
    new THREE.PlaneGeometry(0.32, 0.4),
    new THREE.MeshStandardMaterial({
      map: signTex, side: THREE.DoubleSide,
      emissive: '#ffffff', emissiveMap: signTex, emissiveIntensity: 0.45, roughness: .4
    })
  );
  front.position.set(0, 0.42, 0.026);
  grp.add(front);
  return grp;
}

function createSatelliteDish(g, x, y, z, scale = 1) {
  const grp = new THREE.Group();
  grp.position.set(x, y, z); grp.scale.setScalar(scale);
  g.add(grp);
  cyl(grp, 'dish post', 0, 0.15, 0, 0.025, 0.3, M.metalDark, 12);
  const dish = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 12, 0, Math.PI*2, 0, Math.PI / 2.2),
    M.silver
  );
  dish.rotation.x = Math.PI;
  dish.position.set(0, 0.36, 0);
  grp.add(dish);
  return grp;
}

function createStarlinkSatellite(g, x, y, z, scale = 1) {
  const grp = new THREE.Group();
  grp.position.set(x, y, z); grp.scale.setScalar(scale);
  g.add(grp);
  box(grp, 'sl body', 0, 0, 0, 0.06, 0.04, 0.12, M.silver);
  box(grp, 'sl panel L', -0.14, 0, 0, 0.18, 0.005, 0.1, M.solar);
  box(grp, 'sl panel R', 0.14, 0, 0, 0.18, 0.005, 0.1, M.solar);
  return grp;
}

function createTeslaAppDisplay(g, x, y, z, scale = 1) {
  const grp = new THREE.Group();
  grp.position.set(x, y, z); grp.scale.setScalar(scale);
  g.add(grp);
  box(grp, 'app body', 0, 0.32, 0, 0.32, 0.62, 0.025, mat('#1a1a1d', { metalness: .6, roughness: .25 }));
  const appTex = makeTeslaAppTexture();
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.3, 0.6),
    new THREE.MeshStandardMaterial({
      map: appTex, emissive: '#ffffff', emissiveMap: appTex, emissiveIntensity: 0.55, roughness: 0.15
    })
  );
  screen.position.set(0, 0.32, 0.013);
  grp.add(screen);
  box(grp, 'app stand base', 0, 0.025, 0, 0.18, 0.05, 0.12, M.platform);
  return { group: grp, screen };
}

type RobotArmRuntime = ReturnType<typeof createRobotArm>;

function createTeslaFactory(g: THREE.Group, cx: number, cy: number, cz: number) {
  const grp = new THREE.Group();
  grp.position.set(cx, cy, cz);
  g.add(grp);

  const W = 3.5, H = 0.85, D = 1.6;

  box(grp, 'fac body', 0, H / 2, 0, W, H, D, M.darkGrey);
  box(grp, 'fac roof', 0, H + 0.025, 0, W + 0.05, 0.05, D + 0.05, M.metalDark);
  for (let i = 0; i < 6; i++) {
    const sx = -1.55 + (i % 6) * 0.55;
    box(grp, `fac roof solar ${i}`, sx, H + 0.06, -0.45, 0.45, 0.008, 0.25, M.solar);
  }
  box(grp, 'fac base', 0, 0.04, 0, W + 0.1, 0.06, D + 0.1, M.platform);

  const ledH = 0.025;
  box(grp, 'led roof F', 0, H + 0.085, D / 2 + 0.01, W + 0.04, ledH, 0.018, M.teslaRedLED);

  const bigTeslaTex = makeBigTeslaLogoTexture();
  const bigTeslaMat = new THREE.MeshStandardMaterial({
    map: bigTeslaTex,
    side: THREE.DoubleSide,
    roughness: 0.35,
    emissive: '#ffffff',
    emissiveMap: bigTeslaTex,
    emissiveIntensity: 0.5,
  });
  const bigTesla = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.42), bigTeslaMat);
  bigTesla.position.set(0, H * 0.78, D / 2 + 0.015);
  grp.add(bigTesla);
  box(grp, 'big tesla bg', 0, H * 0.78, D / 2 + 0.008, 2.3, 0.5, 0.012, M.black);

  const redPatchSize = 0.55;
  const redPatchX = -W / 2 + redPatchSize / 2 + 0.1;
  const redPatchY = H * 0.42;
  box(grp, 'red T patch', redPatchX, redPatchY, D / 2 + 0.013, redPatchSize, redPatchSize, 0.012, M.teslaRedHot);
  const tOnlyTex = makeTeslaLogoTexture('#e82127', '#ffffff', false);
  const tOnlyMat = new THREE.MeshStandardMaterial({
    map: tOnlyTex,
    transparent: true,
    emissive: '#ffffff',
    emissiveMap: tOnlyTex,
    emissiveIntensity: 0.6,
    roughness: 0.3,
  });
  const tOnly = new THREE.Mesh(
    new THREE.PlaneGeometry(redPatchSize * 0.85, redPatchSize * 0.85),
    tOnlyMat,
  );
  tOnly.position.set(redPatchX, redPatchY, D / 2 + 0.021);
  grp.add(tOnly);
  const tBelowTex = makeFacadeTextTexture('TESLA', '#e82127', '#ffffff');
  texturedPlane(
    grp,
    tBelowTex,
    redPatchX,
    redPatchY - redPatchSize * 0.38,
    D / 2 + 0.022,
    redPatchSize * 0.75,
    0.06,
    0,
    0.7,
  );

  box(grp, 'banner bg', 0.3, 0.13, D / 2 + 0.13, 2.2, 0.22, 0.04, M.black);
  const bannerTex = makeGigafactoryBannerTexture();
  texturedPlane(grp, bannerTex, 0.3, 0.13, D / 2 + 0.151, 2.15, 0.2, 0, 0.55);
  box(grp, 'banner led top', 0.3, 0.245, D / 2 + 0.152, 2.18, 0.006, 0.005, M.teslaRedLED);
  for (let i = 0; i < 5; i++) {
    cyl(grp, `banner post ${i}`, -0.8 + i * 0.55, 0.06, D / 2 + 0.14, 0.018, 0.12, M.metal, 8);
  }

  const showW = 0.85;
  const showCx = redPatchX + redPatchSize / 2 + 0.15 + showW / 2;
  box(grp, 'show glass', showCx, 0.42, D / 2 + 0.005, showW, 0.65, 0.02, M.glass);
  box(grp, 'show frame top', showCx, 0.78, D / 2 + 0.012, showW, 0.04, 0.025, M.metalDark);
  box(grp, 'show frame bot', showCx, 0.06, D / 2 + 0.012, showW, 0.04, 0.025, M.metalDark);
  for (let i = 0; i < 4; i++) {
    box(
      grp,
      `show mullion ${i}`,
      showCx - showW / 2 + 0.06 + i * (showW / 4),
      0.42,
      D / 2 + 0.012,
      0.02,
      0.65,
      0.018,
      M.metalDark,
    );
  }
  const showLblTex = makeFacadeTextTexture('SHOWROOM', '#0a0a0a', '#ffffff');
  texturedPlane(grp, showLblTex, showCx, 0.81, D / 2 + 0.017, showW - 0.15, 0.04, 0, 0.4);
  createTeslaCar(grp, showCx - 0.2, 0.06, 0.5, '#e82127', Math.PI / 5, 0.85);
  createTeslaCar(grp, showCx + 0.15, 0.06, 0.45, '#f4f4f4', -Math.PI / 7, 0.85);
  box(grp, 'show ceiling light', showCx, H - 0.05, 0.5, showW * 0.8, 0.04, 0.5, M.warmWindow.clone());

  const showcaseCx = 1.05;
  const showcaseCz = D / 2 + 0.1;
  box(grp, 'showcase floor', showcaseCx, 0.07, showcaseCz, 1.4, 0.04, 0.85, M.platform);
  box(
    grp,
    'conveyor belt',
    showcaseCx - 0.3,
    0.095,
    showcaseCz + 0.1,
    0.6,
    0.018,
    0.32,
    mat('#1a1a1d', { roughness: 0.5, metalness: 0.35 }),
  );
  for (let i = 0; i < 6; i++) {
    box(
      grp,
      `conv roller ${i}`,
      showcaseCx - 0.55 + i * 0.1,
      0.105,
      showcaseCz + 0.1,
      0.008,
      0.005,
      0.3,
      mat('#3a3a40'),
    );
  }
  box(
    grp,
    'conv guide L',
    showcaseCx - 0.3,
    0.108,
    showcaseCz + 0.265,
    0.6,
    0.005,
    0.005,
    mat('#ffcf3a', { emissive: '#ffcf3a', emissiveIntensity: 0.3 }),
  );
  box(
    grp,
    'conv guide R',
    showcaseCx - 0.3,
    0.108,
    showcaseCz - 0.065,
    0.6,
    0.005,
    0.005,
    mat('#ffcf3a', { emissive: '#ffcf3a', emissiveIntensity: 0.3 }),
  );
  box(grp, 'showcase led F', showcaseCx, 0.085, showcaseCz + 0.425, 1.4, 0.012, 0.005, M.teslaRedLED);
  box(grp, 'showcase led R', showcaseCx + 0.7, 0.085, showcaseCz, 0.005, 0.012, 0.85, M.teslaRedLED);
  const showcaseCar = createTeslaCar(grp, showcaseCx - 0.3, 0.118, showcaseCz + 0.1, '#ededf2', Math.PI / 5, 1.9);
  const heroArm = createRobotArm(grp, showcaseCx + 0.35, 0.105, showcaseCz - 0.15, -Math.PI / 4, 3.0);
  const showcaseLight = new THREE.PointLight('#fff2c8', 1.5, 2.8);
  showcaseLight.position.set(showcaseCx, 0.9, showcaseCz);
  grp.add(showcaseLight);

  const robotArms: RobotArmRuntime[] = [heroArm];
  const innerLineX = -0.4;
  const innerLineZ = -0.4;
  for (let i = 0; i < 2; i++) {
    robotArms.push(
      createRobotArm(grp, innerLineX - 0.4 + i * 0.6, 0.1, innerLineZ + 0.2, 0, 0.85),
    );
    robotArms.push(
      createRobotArm(grp, innerLineX - 0.4 + i * 0.6, 0.1, innerLineZ - 0.2, Math.PI, 0.85),
    );
  }
  createTeslaCar(grp, innerLineX, 0.105, innerLineZ + 0.0, '#1c1c1e', Math.PI / 2, 0.85);
  createTeslaCar(grp, innerLineX + 0.4, 0.105, innerLineZ + 0.0, '#aeb4bd', Math.PI / 2, 0.85);

  const aiPanelCx = W / 2 - 0.3;
  const aiPanelCz = D / 2 + 0.3;
  const aiPanelCy = 0.42;
  box(grp, 'ai panel bg', aiPanelCx, aiPanelCy, aiPanelCz, 0.42, 0.42, 0.018, M.black);
  const aiDrivenTex = makeAIDrivenTexture();
  texturedPlane(grp, aiDrivenTex, aiPanelCx, aiPanelCy, aiPanelCz + 0.012, 0.4, 0.4, 0, 0.55);
  cyl(grp, 'ai panel post', aiPanelCx, 0.18, aiPanelCz, 0.014, 0.32, M.metal, 8);
  box(grp, 'ai panel led', aiPanelCx, 0.21, aiPanelCz + 0.012, 0.4, 0.006, 0.005, M.teslaRedLED);

  rooftopPanel(grp, '2', '차량 설계·생산', '전기차 설계·제조·생산', 0, H + 0.55, -0.2, 1.0, 0.36);

  return { group: grp, robotArms, heroArm, showcaseCar };
}
function createAISoftware(g, cx, cy, cz) {
  const grp = new THREE.Group();
  grp.position.set(cx, cy, cz);
  g.add(grp);
  const W = 1.1, H = 0.55, D = 0.75;
  box(grp, 'ai body', 0, H/2, 0, W, H, D, M.darkGrey);
  box(grp, 'ai roof', 0, H + 0.02, 0, W + 0.04, 0.04, D + 0.04, M.metalDark);
  box(grp, 'ai base', 0, 0.04, 0, W + 0.08, 0.06, D + 0.08, M.platform);
  const fsdTex = makeFSDDisplayTexture();
  texturedPlane(grp, fsdTex, 0, H/2 + 0.05, D/2 + 0.005, W - 0.15, H - 0.15, 0, 0.55);
  box(grp, 'ai frame', 0, H/2 + 0.05, D/2 + 0.002, W - 0.12, H - 0.12, 0.012, M.metalDark);
  const facadeTex = makeFacadeTextTexture('AI & SOFTWARE', '#0a0a0a', '#4a8eda');
  texturedPlane(grp, facadeTex, 0, 0.07, D/2 + 0.008, W - 0.2, 0.06, 0, 0.5);
  rooftopPanel(grp, '3', '소프트웨어 · AI', 'AI · FSD · 자율주행\nDojo 슈퍼컴퓨팅', 0, H + 0.5, 0, 0.95, 0.34, '#4a8eda');
  return grp;
}

function createSolarStorage(g, cx, cy, cz) {
  const grp = new THREE.Group();
  grp.position.set(cx, cy, cz);
  g.add(grp);
  const W = 1.2, H = 0.45, D = 0.9;
  box(grp, 'ss body', 0, H/2, 0, W, H, D, M.darkGrey);
  box(grp, 'ss roof', 0, H + 0.018, 0, W + 0.04, 0.035, D + 0.04, M.metalDark);
  box(grp, 'ss base', 0, 0.04, 0, W + 0.08, 0.06, D + 0.08, M.platform);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 3; j++) {
      const sx = -W/2 + 0.18 + i * 0.27;
      const sz = -D/2 + 0.2 + j * 0.27;
      const panel = box(grp, `ss solar ${i}_${j}`, sx, H + 0.045, sz, 0.24, 0.012, 0.24, M.solar);
      panel.rotation.x = -Math.PI / 28;
      box(grp, `ss solar grid ${i}_${j}`, sx, H + 0.05, sz, 0.24, 0.001, 0.005, M.solarGrid);
    }
  }
  box(grp, 'ss front glass', 0, 0.2, D/2 + 0.005, W - 0.2, 0.32, 0.018, M.glass);
  box(grp, 'ss front frame', 0, 0.2, D/2 + 0.008, W - 0.18, 0.34, 0.018, M.metalDark);
  const facadeTex = makeFacadeTextTexture('SOLAR & STORAGE', '#0a0a0a', '#ffcf3a');
  texturedPlane(grp, facadeTex, 0, 0.07, D/2 + 0.011, W - 0.25, 0.06, 0, 0.5);
  for (let i = 0; i < 3; i++) {
    createMegapack(grp, W/2 + 0.18, 0, -D/2 + 0.25 + i * 0.45, 1.0);
  }
  box(grp, 'mp base', W/2 + 0.18, 0.025, 0, 0.34, 0.03, 1.2, M.platform);
  rooftopPanel(grp, '4', '태양광·저장 에너지', '태양광 발전 · 에너지 저장 · 메가팩', 0, H + 0.6, 0, 1.05, 0.34, '#ffcf3a');
  return grp;
}

function createSuperchargerArea(g, cx, cy, cz) {
  const grp = new THREE.Group();
  grp.position.set(cx, cy, cz);
  g.add(grp);
  box(grp, 'sca base', 0, 0.04, 0, 1.8, 0.06, 0.95, M.platform);
  box(grp, 'sca lane', 0, 0.072, 0, 1.7, 0.005, 0.85, M.road);
  for (let i = 0; i < 6; i++) {
    createSupercharger(grp, -0.65 + i * 0.26, 0, -0.32, 0, 0.85);
  }
  box(grp, 'sca canopy', 0, 0.55, -0.15, 1.7, 0.04, 0.45, M.darkGrey);
  for (let i = 0; i < 6; i++) {
    const sx = -0.7 + i * 0.28;
    box(grp, `sca canopy solar ${i}`, sx, 0.575, -0.15, 0.25, 0.005, 0.4, M.solar);
  }
  for (let i = 0; i < 4; i++) {
    const sx = -0.78 + i * 0.52;
    cyl(grp, `sca pillar ${i}`, sx, 0.28, -0.05, 0.022, 0.5, M.metalDark, 12);
  }
  const sccColors = ['#1c1c1e', '#f4f4f4', '#e82127', '#aeb4bd'];
  for (let i = 0; i < 4; i++) {
    createTeslaCar(grp, -0.55 + i * 0.36, 0.07, 0.15, sccColors[i], 0, 0.95);
  }
  createSuperchargerSign(grp, -1.0, 0.04, 0.0, Math.PI / 6, 0.85);
  rooftopPanel(grp, '5', '충전 인프라', '슈퍼차저 네트워크 · 가정용 충전', 0, 0.95, 0, 1.0, 0.34, '#c8c8cc');
  return grp;
}

function createServiceCenter(g, cx, cy, cz) {
  const grp = new THREE.Group();
  grp.position.set(cx, cy, cz);
  g.add(grp);
  const W = 1.4, H = 0.5, D = 0.85;
  box(grp, 'svc body', -0.3, H/2, 0, W * 0.6, H, D, M.darkGrey);
  box(grp, 'svc roof', -0.3, H + 0.02, 0, W * 0.6 + 0.04, 0.035, D + 0.04, M.metalDark);
  box(grp, 'svc base', 0, 0.04, 0, W + 0.08, 0.06, D + 0.08, M.platform);
  box(grp, 'svc front glass', -0.3, H/2 + 0.02, D/2 + 0.005, W * 0.55, H - 0.1, 0.018, M.glass);
  box(grp, 'svc interior light', -0.3, H/2 + 0.05, 0.1, W * 0.5, 0.15, 0.4, M.warmWindow.clone());
  for (let i = 0; i < 4; i++) {
    box(grp, `svc person ${i}`, -0.5 + i * 0.13, 0.12, 0.15, 0.04, 0.1, 0.04, M.white);
  }
  const appDisplay = createTeslaAppDisplay(grp, W/2 - 0.15, 0.04, 0.0, 0.95);
  const facadeTex = makeFacadeTextTexture('SERVICE', '#0a0a0a', '#ffffff');
  texturedPlane(grp, facadeTex, -0.3, 0.085, D/2 + 0.008, W * 0.5, 0.05, 0, 0.4);
  rooftopPanel(grp, '6', '서비스 · 생태계', '테슬라 앱 · 서비스 · 보험 · 업그레이드', 0, 0.95, 0, 1.05, 0.34, '#a259ff');
  return { group: grp, appDisplay };
}
function buildTeslaCampusDiorama() {
  const g = new THREE.Group();
  box(g, 'plinth', 0, -0.13, 0, gx(6.4), .26, gx(5.6), M.base);
  box(g, 'platform', 0, .02, 0, gx(5.9), .12, gx(5.1), M.platform);
  box(g, 'main road x', 0, 0.084, 0.5, gx(5.6), 0.012, gx(0.5), M.road);
  box(g, 'main road z', 0, 0.084, 0, gx(0.5), 0.012, gx(4.8), M.road);
  for (let i = -3; i <= 3; i++) {
    box(g, `lane mark x ${i}`, i * 0.5, 0.087, 0.5, 0.18, 0.005, 0.02, M.white);
  }
  for (let i = -2; i <= 2; i++) {
    if (i === 0) continue;
    box(g, `lane mark z ${i}`, 0, 0.087, i * 0.7, 0.02, 0.005, 0.18, M.white);
  }

  const factory = createTeslaFactory(g, 0, 0.08, -1.6);

  createAISoftware(g, -2.7, 0.08, -0.4);
  createSolarStorage(g, 2.85, 0.08, -0.8);
  createSuperchargerArea(g, -1.5, 0.08, 1.75);
  const service = createServiceCenter(g, 1.6, 0.08, 1.75);

  createSatelliteDish(g, 3.3, 0.08, -2.0, 1.0);
  const starlink = createStarlinkSatellite(g, 3.5, 1.5, -1.4, 1.2);
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const sat = new THREE.Mesh(
      new THREE.SphereGeometry(0.015, 8, 6),
      new THREE.MeshBasicMaterial({ color: '#4ab8e8', transparent: true, opacity: 0.7 }),
    );
    sat.position.set(3.3 + t * 0.2, 0.5 + t * 1.0, -2.0 + t * 0.6);
    g.add(sat);
  }
  const starlinkTex = makeFacadeTextTexture('STARLINK', '#0a0a0a', '#4ab8e8');
  texturedPlane(g, starlinkTex, 3.3, 0.7, -1.85, 0.45, 0.07, -Math.PI / 6, 0.45);

  const parkColors = ['#1c1c1e', '#aeb4bd', '#e82127', '#f4f4f4', '#1c1c1e'];
  parkColors.forEach((color, i) => {
    createTeslaCar(g, -0.7 + i * 0.35, 0.105, -0.55, color, 0, 0.95);
  });
  for (let i = 0; i < 6; i++) {
    const lx = -0.87 + i * 0.35;
    box(
      g,
      `parking line ${i}`,
      lx,
      0.092,
      -0.55,
      0.006,
      0.005,
      0.18,
      mat('#ffcf3a', { emissive: '#ffcf3a', emissiveIntensity: 0.35 }),
    );
  }
  box(g, 'parking pad', 0.05, 0.088, -0.55, 1.85, 0.012, 0.22, mat('#252830', { roughness: 0.8 }));

  const treeSpots = [
    [-3.4, -2.6], [3.6, -2.6], [-3.6, 2.6], [3.6, 2.6],
    [-3.5, 0.5], [3.5, 0.5], [-3.4, -1.4], [3.4, -1.4],
    [-2.0, 2.6], [0, 2.7], [2.0, 2.7], [0, -2.85],
  ];
  treeSpots.forEach(([x, z]) => tree(g, x, z, 0.4));
  tree(g, -2.0, 0.5, 0.32);
  tree(g, 2.1, 0.5, 0.32);
  tree(g, -0.7, 1.6, 0.3);
  tree(g, 0.7, 1.6, 0.3);

  // === Tesla v4 campus lights (standalone v2 parity; village scene adds hemi/key) ===
  const factoryGlow = new THREE.PointLight('#fff2c8', 0.7, 4);
  factoryGlow.position.set(0, 0.7, -0.8);
  g.add(factoryGlow);

  const interiorWarm = new THREE.PointLight('#ffaf3a', 0.5, 2.5);
  interiorWarm.position.set(-0.5, 0.6, -1.4);
  g.add(interiorWarm);

  const heroAccent = new THREE.PointLight('#e82127', 0.4, 1.5);
  heroAccent.position.set(1.0, 0.5, -1.4);
  g.add(heroAccent);

  g.userData = {
    factoryArms: factory.robotArms,
    heroArm: factory.heroArm,
    showcaseCar: factory.showcaseCar,
    appScreen: service.appDisplay.screen,
    starlink,
  };
  return g;
}
export function createTesla(): THREE.Group {
  const root = buildTeslaCampusDiorama();
  const SPEED = 0.4;
  root.userData.tick = (time: number) => {
    const t = time * SPEED;
    const tRaw = time;
    const u = root.userData as TeslaCampusRuntime;

    if (u.heroArm) {
      u.heroArm.shoulder.rotation.y = Math.sin(tRaw * 0.5) * 0.6;
      u.heroArm.seg1.rotation.z = -Math.PI / 4 + Math.sin(tRaw * 0.8) * 0.4;
      u.heroArm.seg2.rotation.z = -Math.PI / 5 + Math.cos(tRaw * 0.7) * 0.45;
      (u.heroArm.led.material as THREE.MeshBasicMaterial).color.setHSL(
        0.13, 1, 0.5 + 0.3 * Math.sin(tRaw * 3),
      );
    }
    u.factoryArms.slice(1).forEach((arm, i) => {
      arm.shoulder.rotation.y = Math.sin(tRaw * 0.8 + i) * 0.3;
      arm.seg1.rotation.z = -Math.PI / 4 + Math.sin(tRaw * 1.2 + i * 0.5) * 0.2;
      arm.seg2.rotation.z = -Math.PI / 5 + Math.cos(tRaw * 1.0 + i * 0.7) * 0.25;
      (arm.led.material as THREE.MeshBasicMaterial).color.setHSL(
        0.13, 1, 0.5 + 0.3 * Math.sin(tRaw * 5 + i),
      );
    });

    if (u.showcaseCar) {
      const cycleSpeed = 0.08;
      const progress = (tRaw * cycleSpeed) % 1;
      u.showcaseCar.position.x = 0.45 + progress * 0.6;
      u.showcaseCar.position.y = 0.118 + Math.sin(tRaw * 4) * 0.002;
    }

    u.starlink.rotation.y = tRaw * 0.3;

    (u.appScreen.material as THREE.MeshStandardMaterial).emissiveIntensity =
      0.5 + 0.2 * Math.sin(t * 1.6);

    root.rotation.y = Math.sin(t * 0.2) * 0.008;
  };
  return root;
}

type TeslaRobotArm = {
  group: THREE.Group;
  shoulder: THREE.Group;
  seg1: THREE.Group;
  seg2: THREE.Group;
  led: THREE.Mesh;
};

interface TeslaCampusRuntime {
  factoryArms: TeslaRobotArm[];
  heroArm: TeslaRobotArm;
  showcaseCar: THREE.Group;
  appScreen: THREE.Mesh;
  starlink: THREE.Group;
}
