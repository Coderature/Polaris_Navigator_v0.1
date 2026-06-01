// @ts-nocheck — Coca-Cola (KO) business-model diorama.
import * as THREE from 'three';
import {
  GROUND_XZ,
  gx,
  mat,
  box,
  cyl,
  texturedPlane,
  rooftopPanel,
  tree,
  makeFacadeTextTexture,
} from './dioramaCommon';

interface CocaColaRuntime {
  heroStage: THREE.Mesh;
  heroBottle: THREE.Group;
  conveyorBottles: { mesh: THREE.Group; baseX: number }[];
  truck: { group: THREE.Group; baseX: number };
  vendingGlows: THREE.Mesh[];
}

// ===== Palette (Coca-Cola tone — signature red) =====
const C = {
  cokeRed: '#e61a27',
  cokeRedBright: '#ff3a3a',
  cokeRedDeep: '#a81420',
  cokeDark: '#1a0a0c',
  cokeNavy: '#241012',
  cokeBlack: '#0a0506',
  cola: '#3a1208',
  colaDark: '#1f0a04',
  glass: '#6a3a3a',
  glassWarm: '#ffd0d0',
  glassRed: '#d04040',
  metalDark: '#3a3a40',
  metal: '#7a7a80',
  silver: '#c8c8cc',
  steel: '#b0b4b8',
  road: '#1c1e22',
  base: '#08090d',
  platform: '#15171c',
  white: '#f0f3f3',
  cream: '#f5ede0',
  brownBox: '#a67c52',
  spriteGreen: '#1aa84a',
  fantaOrange: '#ff7a18',
};

const M = {
  cokeRed: mat(C.cokeRed, { roughness: 0.35, emissive: C.cokeRed, emissiveIntensity: 0.4 }),
  cokeRedHot: mat(C.cokeRedBright, { emissive: C.cokeRedBright, emissiveIntensity: 1.4, roughness: 0.25 }),
  cokeRedDeep: mat(C.cokeRedDeep, { roughness: 0.4 }),
  cokeDark: mat(C.cokeDark, { roughness: 0.5 }),
  cokeNavy: mat(C.cokeNavy, { roughness: 0.5, metalness: 0.2 }),
  cokeBlack: mat(C.cokeBlack, { roughness: 0.45 }),
  cola: mat(C.cola, { roughness: 0.25, transparent: true, opacity: 0.92 }),
  metalDark: mat(C.metalDark, { roughness: 0.35, metalness: 0.65 }),
  metal: mat(C.metal, { roughness: 0.35, metalness: 0.55 }),
  silver: mat(C.silver, { roughness: 0.32, metalness: 0.55 }),
  steel: mat(C.steel, { roughness: 0.3, metalness: 0.7 }),
  white: mat(C.white, { roughness: 0.4 }),
  cream: mat(C.cream, { roughness: 0.5 }),
  glass: mat(C.glass, {
    roughness: 0.15,
    metalness: 0.15,
    transparent: true,
    opacity: 0.55,
    emissive: '#4a1010',
    emissiveIntensity: 0.2,
  }),
  glassWarm: mat(C.glassWarm, { emissive: '#ffd0d0', emissiveIntensity: 0.8, roughness: 0.25 }),
  glassRed: mat(C.glassRed, {
    roughness: 0.15,
    transparent: true,
    opacity: 0.6,
    emissive: C.glassRed,
    emissiveIntensity: 0.3,
  }),
  road: mat(C.road, { roughness: 0.85 }),
  base: mat(C.base, { roughness: 0.55 }),
  platform: mat(C.platform, { roughness: 0.65 }),
  brownBox: mat(C.brownBox, { roughness: 0.75 }),
  stageGlow: mat(C.cokeRedBright, { emissive: C.cokeRedBright, emissiveIntensity: 1.6, roughness: 0.3 }),
};

function makeCokeLogoTexture(bg = '#1a0a0c', fg = '#e61a27') {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 384;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = fg;
  ctx.font = 'italic bold 180px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Coca-Cola', c.width / 2, c.height / 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function createBottle(scale = 1, label = true) {
  const grp = new THREE.Group();
  grp.scale.setScalar(scale);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.26, 16), M.cola);
  body.position.y = 0.13;
  grp.add(body);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.06, 0.08, 14), M.cola);
  neck.position.y = 0.3;
  grp.add(neck);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.03, 14), M.cokeRed);
  cap.position.y = 0.35;
  grp.add(cap);
  if (label) {
    const labelBand = new THREE.Mesh(new THREE.CylinderGeometry(0.071, 0.061, 0.1, 16), M.cokeRed);
    labelBand.position.y = 0.13;
    grp.add(labelBand);
  }
  return grp;
}

function createCan(scale = 1) {
  const grp = new THREE.Group();
  grp.scale.setScalar(scale);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.18, 16), M.cokeRed);
  body.position.y = 0.09;
  grp.add(body);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.015, 16), M.silver);
  top.position.y = 0.185;
  grp.add(top);
  return grp;
}

function createHeroStage(g: THREE.Group, cx: number, cy: number, cz: number) {
  const grp = new THREE.Group();
  grp.position.set(cx, cy, cz);
  g.add(grp);
  box(grp, 'stage base', 0, 0.04, 0, 1.3, 0.08, 1.3, M.cokeBlack);
  const stage = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.06, 40), M.cokeNavy);
  stage.position.y = 0.1;
  grp.add(stage);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.03, 10, 48), M.stageGlow);
  ring.name = 'stage ring';
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.13;
  grp.add(ring);
  const heroBottle = createBottle(2.2, true);
  heroBottle.position.set(-0.12, 0.13, 0);
  heroBottle.name = 'hero bottle';
  grp.add(heroBottle);
  const heroCan = createCan(1.8);
  heroCan.position.set(0.28, 0.13, 0);
  grp.add(heroCan);
  const tex = makeFacadeTextTexture('Real Magic', '#0a0506', '#ffffff');
  texturedPlane(grp, tex, 0, 0.12, 0.63, 0.7, 0.08, 0, 0.5);
  return { group: grp, stage: ring, heroBottle };
}

function createBottlingLine(g: THREE.Group, cx: number, cy: number, cz: number) {
  const grp = new THREE.Group();
  grp.position.set(cx, cy, cz);
  g.add(grp);
  [-0.7, -0.3, 0.1].forEach((tx, i) => {
    cyl(grp, `tank ${i}`, tx, 0.32, -0.7, 0.16, 0.5, M.steel, 20);
    cyl(grp, `tank top ${i}`, tx, 0.58, -0.7, 0.16, 0.04, M.metalDark, 20);
  });
  box(grp, 'conveyor', 0, 0.14, 0, 2.0, 0.06, 0.3, M.metalDark);
  box(grp, 'conveyor belt', 0, 0.18, 0, 2.0, 0.01, 0.24, mat('#0a0a0a', { roughness: 0.6 }));
  const stations = ['WASH', 'FILL', 'LABEL', 'PACK'];
  stations.forEach((s, i) => {
    const sx = -0.75 + i * 0.5;
    box(grp, `station ${s}`, sx, 0.42, -0.2, 0.4, 0.5, 0.1, M.cokeDark);
    box(grp, `station sign ${s}`, sx, 0.6, -0.14, 0.36, 0.12, 0.02, M.cokeRed);
    const tex = makeFacadeTextTexture(s, '#e61a27', '#ffffff');
    texturedPlane(grp, tex, sx, 0.6, -0.13, 0.32, 0.08, 0, 0.7);
  });
  const bottles: CocaColaRuntime['conveyorBottles'] = [];
  for (let i = 0; i < 8; i++) {
    const b = createBottle(0.8, true);
    const baseX = -0.9 + i * 0.25;
    b.position.set(baseX, 0.19, 0.0);
    grp.add(b);
    bottles.push({ mesh: b, baseX });
  }
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 2; j++) {
      box(grp, `box ${i}_${j}`, 0.7 + i * 0.18, 0.1 + j * 0.16, 0.6, 0.16, 0.14, 0.16, M.brownBox);
    }
  }
  return { group: grp, bottles };
}

function createCokeHQ(g: THREE.Group, cx: number, cy: number, cz: number) {
  const grp = new THREE.Group();
  grp.position.set(cx, cy, cz);
  g.add(grp);
  const W = 2.0;
  const H = 1.0;
  const D = 1.2;
  box(grp, 'hq body', 0, H / 2, 0, W, H, D, M.cokeDark);
  box(grp, 'hq base', 0, 0.06, 0, W + 0.2, 0.12, D + 0.2, M.platform);
  box(grp, 'hq roof', 0, H + 0.03, 0, W + 0.06, 0.06, D + 0.06, M.cokeNavy);
  box(grp, 'hq sign bg', 0, H + 0.22, 0, 1.6, 0.34, 0.06, M.cokeBlack);
  const logoTex = makeCokeLogoTexture('#1a0a0c', '#ff2a2a');
  texturedPlane(grp, logoTex, 0, H + 0.22, 0.04, 1.5, 0.3, 0, 1.2);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 9; col++) {
      const wx = -W / 2 + 0.18 + col * 0.21;
      const wy = 0.2 + row * 0.2;
      box(
        grp,
        `hq win ${row}_${col}`,
        wx,
        wy,
        D / 2 + 0.006,
        0.17,
        0.15,
        0.008,
        (row * 9 + col) % 4 !== 0 ? M.glassWarm : M.glass,
      );
    }
  }
  return grp;
}

function createVendingRow(g: THREE.Group, cx: number, cy: number, cz: number) {
  const grp = new THREE.Group();
  grp.position.set(cx, cy, cz);
  g.add(grp);
  const glows: THREE.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const vx = -0.6 + i * 0.42;
    box(grp, `vending body ${i}`, vx, 0.28, 0, 0.36, 0.56, 0.22, M.cokeDark);
    const screen = box(grp, `vending screen ${i}`, vx, 0.36, 0.112, 0.28, 0.34, 0.008, M.cokeRedHot);
    glows.push(screen);
    const tex = makeFacadeTextTexture('Coca-Cola', '#e61a27', '#ffffff');
    texturedPlane(grp, tex, vx, 0.5, 0.117, 0.3, 0.08, 0, 0.7);
    box(grp, `vending slot ${i}`, vx, 0.14, 0.112, 0.24, 0.06, 0.008, M.cokeBlack);
  }
  box(grp, 'cooler body', 0.85, 0.3, 0, 0.5, 0.6, 0.28, M.cokeRedDeep);
  box(grp, 'cooler glass', 0.85, 0.34, 0.142, 0.42, 0.48, 0.008, M.glassRed);
  const coolerTex = makeFacadeTextTexture('ICE COLD', '#0a0506', '#ffffff');
  texturedPlane(grp, coolerTex, 0.85, 0.58, 0.143, 0.42, 0.07, 0, 0.6);
  for (let r = 0; r < 3; r++) {
    for (let cc = 0; cc < 4; cc++) {
      box(
        grp,
        `stock ${r}_${cc}`,
        0.7 + cc * 0.1,
        0.18 + r * 0.14,
        0.13,
        0.06,
        0.1,
        0.02,
        mat(cc % 2 === 0 ? C.cokeRed : C.cokeRedDeep, { emissive: C.cokeRed, emissiveIntensity: 0.2 }),
      );
    }
  }
  return { group: grp, glows };
}

function createTruck(g: THREE.Group, x: number, y: number, z: number, rotY = 0, scale = 1) {
  const grp = new THREE.Group();
  grp.position.set(x, y, z);
  grp.rotation.y = rotY;
  grp.scale.setScalar(scale);
  g.add(grp);
  box(grp, 'truck cabin', -0.32, 0.12, 0, 0.2, 0.18, 0.24, M.cokeRed);
  box(grp, 'truck windshield', -0.42, 0.16, 0, 0.04, 0.1, 0.22, M.glassRed);
  box(grp, 'truck container', 0.18, 0.16, 0, 0.6, 0.28, 0.26, M.white);
  const logoTex = makeCokeLogoTexture('#ffffff', '#e61a27');
  texturedPlane(grp, logoTex, 0.18, 0.16, 0.132, 0.55, 0.2, 0, 0.4);
  const logoTexL = makeCokeLogoTexture('#ffffff', '#e61a27');
  texturedPlane(grp, logoTexL, 0.18, 0.16, -0.132, 0.55, 0.2, Math.PI, 0.4);
  [-0.3, 0.05, 0.32].forEach((wx) => {
    [-0.13, 0.13].forEach((wz) => {
      const w = cyl(grp, 'wheel', wx, 0.04, wz, 0.05, 0.03, M.metalDark, 14);
      w.rotation.x = Math.PI / 2;
    });
  });
  return grp;
}

function buildCocaColaDiorama() {
  const g = new THREE.Group();
  box(g, 'plinth', 0, -0.13, 0, gx(7.6), 0.26, gx(6.0), M.base);
  box(g, 'platform', 0, 0.02, 0, gx(7.1), 0.12, gx(5.6), M.platform);
  box(g, 'road front', 0, 0.084, 1.8, gx(6.5), 0.012, gx(0.5), M.road);
  box(g, 'road ring', 0, 0.084, 0.6, gx(5.0), 0.012, gx(0.4), M.road);

  const hero = createHeroStage(g, 0, 0.08, 0.2);
  createCokeHQ(g, 0.6, 0.08, -1.9);
  const bottling = createBottlingLine(g, -2.7, 0.08, -0.6);
  const vending = createVendingRow(g, 2.7, 0.08, 0.4);
  const truck = createTruck(g, -1.5, 0.06, 1.8, 0, 1.0);
  for (let i = 0; i < 4; i++) {
    box(
      g,
      `case ${i}`,
      0.5 + i * 0.3,
      0.14,
      1.8,
      0.26,
      0.2,
      0.26,
      mat(i % 2 === 0 ? C.cokeRed : C.cokeBlack, { roughness: 0.5 }),
    );
  }

  const treeSpots: [number, number][] = [
    [-3.8, 1.8],
    [1.6, 1.4],
    [3.8, 1.8],
    [3.8, -1.4],
    [-1.0, -1.2],
  ];
  treeSpots.forEach(([x, z]) => tree(g, x, z, 0.4));

  rooftopPanel(g, '1', 'Brand', '강력한 브랜드로\n소비자와 연결', 0, 1.5, -1.9, 1.0, 0.36, '#e61a27');
  rooftopPanel(g, '2', 'Bottling', '전 세계 보틀링\n파트너 생산', -2.7, 1.3, -0.6, 1.0, 0.36, '#ff3a3a');
  rooftopPanel(g, '3', 'Distribution', '효율적 물류로\n전 세계 공급', -1.5, 0.7, 1.0, 1.0, 0.36, '#a81420');
  rooftopPanel(g, '4', 'Consumption', '전 세계 소비자에게\n상쾌한 경험', 2.7, 1.2, 0.4, 1.0, 0.36, '#e61a27');

  const heroGlow = new THREE.PointLight('#ff3a3a', 1.4, 4.5);
  heroGlow.position.set(0, 1.0, 0.2);
  g.add(heroGlow);
  const hqGlow = new THREE.PointLight('#ffd0d0', 0.9, 4.0);
  hqGlow.position.set(0.6, 1.2, -1.9);
  g.add(hqGlow);
  const vendGlow = new THREE.PointLight('#ff3a3a', 0.7, 3.0);
  vendGlow.position.set(2.7, 0.8, 0.4);
  g.add(vendGlow);
  const lineGlow = new THREE.PointLight('#ffd0d0', 0.6, 3.5);
  lineGlow.position.set(-2.7, 0.9, -0.6);
  g.add(lineGlow);

  g.userData = {
    heroStage: hero.stage,
    heroBottle: hero.heroBottle,
    conveyorBottles: bottling.bottles,
    truck: { group: truck, baseX: -1.5 },
    vendingGlows: vending.glows,
  };
  return g;
}

export function createCocaCola(): THREE.Group {
  const root = buildCocaColaDiorama();
  const SPEED = 0.4;
  root.userData.tick = (time: number) => {
    const t = time * SPEED;
    const tRaw = time;
    const u = root.userData as CocaColaRuntime;

    if (u.heroStage) {
      u.heroStage.rotation.z = tRaw * 0.5;
      (u.heroStage.material as THREE.MeshStandardMaterial).emissiveIntensity =
        1.2 + 0.5 * Math.sin(tRaw * 2);
    }
    if (u.heroBottle) {
      u.heroBottle.rotation.y = tRaw * 0.3;
    }

    if (u.conveyorBottles) {
      u.conveyorBottles.forEach((b, i) => {
        const pos = (tRaw * 0.15 + i / u.conveyorBottles.length) % 1;
        b.mesh.position.x = -0.95 + pos * 1.9;
      });
    }

    if (u.truck?.group) {
      const pos = (tRaw * 0.1) % 1;
      u.truck.group.position.x = -3.5 + pos * 7.0;
    }

    if (u.vendingGlows) {
      u.vendingGlows.forEach((m, i) => {
        (m.material as THREE.MeshStandardMaterial).emissiveIntensity =
          1.0 + 0.5 * Math.sin(tRaw * 2 + i * 0.7);
      });
    }

    root.rotation.y = Math.sin(t * 0.15) * 0.008;
  };
  return root;
}
