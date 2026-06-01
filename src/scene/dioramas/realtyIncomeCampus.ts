// @ts-nocheck — Realty Income (O) NNN retail REIT diorama.
import * as THREE from 'three';
import {
  gx,
  mat,
  box,
  cyl,
  texturedPlane,
  rooftopPanel,
  tree,
  makeFacadeTextTexture,
} from './dioramaCommon';

interface RealtyRuntime {
  logoCube: THREE.Mesh;
  movingCars: { group: THREE.Group; baseX: number; speed: number }[];
  tenantGlows: THREE.Mesh[];
}

const C = {
  oBlue: '#1a3a6a',
  oBlueBright: '#2a5a9a',
  oNavy: '#15233a',
  oGold: '#d4a020',
  oGoldBright: '#ffcf3a',
  red: '#c0392b',
  redBright: '#e74c3c',
  glass: '#4a8eda',
  glassWarm: '#ffd98a',
  glassBlue: '#3a78c8',
  metalDark: '#3a3a40',
  metal: '#7a7a80',
  silver: '#c8c8cc',
  road: '#1c1e22',
  base: '#08090d',
  platform: '#15171c',
  walmartBlue: '#0071ce',
  cvsRed: '#cc0000',
  walgreensRed: '#e31837',
  dollarYellow: '#f5c518',
  fedexPurple: '#4d148c',
  sevenGreen: '#008000',
  white: '#f3f3f3',
};

const M = {
  oBlue: mat(C.oBlue, { roughness: 0.4, metalness: 0.2 }),
  oBlueBright: mat(C.oBlueBright, { roughness: 0.35, emissive: C.oBlue, emissiveIntensity: 0.15 }),
  oNavy: mat(C.oNavy, { roughness: 0.5 }),
  oGold: mat(C.oGold, { roughness: 0.3, metalness: 0.6, emissive: C.oGold, emissiveIntensity: 0.3 }),
  oGoldHot: mat(C.oGoldBright, { emissive: C.oGoldBright, emissiveIntensity: 1.2, roughness: 0.25, metalness: 0.5 }),
  red: mat(C.red, { roughness: 0.4 }),
  redHot: mat(C.redBright, { emissive: C.redBright, emissiveIntensity: 1.0, roughness: 0.3 }),
  metalDark: mat(C.metalDark, { roughness: 0.35, metalness: 0.65 }),
  metal: mat(C.metal, { roughness: 0.35, metalness: 0.55 }),
  silver: mat(C.silver, { roughness: 0.32, metalness: 0.55 }),
  white: mat(C.white, { roughness: 0.4 }),
  glass: mat(C.glass, {
    roughness: 0.15,
    metalness: 0.15,
    transparent: true,
    opacity: 0.55,
    emissive: '#1e4fa3',
    emissiveIntensity: 0.15,
  }),
  glassWarm: mat(C.glassWarm, { emissive: '#ffd98a', emissiveIntensity: 0.8, roughness: 0.25 }),
  glassBlue: mat(C.glassBlue, { roughness: 0.15, metalness: 0.15, transparent: true, opacity: 0.65 }),
  road: mat(C.road, { roughness: 0.85 }),
  base: mat(C.base, { roughness: 0.55 }),
  platform: mat(C.platform, { roughness: 0.65 }),
};

function makeRealtyLogoTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 384;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#0a0e16';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  ctx.moveTo(140, 180);
  ctx.lineTo(210, 110);
  ctx.lineTo(280, 180);
  ctx.lineTo(280, 270);
  ctx.lineTo(140, 270);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 130px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Realty Income', 320, 160);
  ctx.fillStyle = '#bbbbbb';
  ctx.font = '52px Arial';
  ctx.fillText('The Monthly Dividend Company', 320, 250);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function createCar(g: THREE.Group, x: number, y: number, z: number, color: string, rotY = 0, scale = 1) {
  const grp = new THREE.Group();
  grp.position.set(x, y, z);
  grp.rotation.y = rotY;
  grp.scale.setScalar(scale);
  g.add(grp);
  box(grp, 'car body', 0, 0.04, 0, 0.22, 0.05, 0.11, mat(color, { metalness: 0.35, roughness: 0.35 }));
  box(grp, 'car cabin', 0.0, 0.08, 0, 0.11, 0.04, 0.1, M.glassBlue);
  [-0.07, 0.07].forEach((wx) => {
    [-0.05, 0.05].forEach((wz) => {
      const w = cyl(grp, 'wheel', wx, 0.018, wz, 0.022, 0.016, M.metalDark, 12);
      w.rotation.x = Math.PI / 2;
    });
  });
  box(grp, 'hl', -0.11, 0.04, 0, 0.005, 0.012, 0.07, mat('#ffeecc', { emissive: '#ffeecc', emissiveIntensity: 0.8 }));
  return grp;
}

function parkedCar(g: THREE.Group, x: number, z: number, color: string, rotY = 0) {
  const grp = new THREE.Group();
  grp.position.set(x, 0.07, z);
  grp.rotation.y = rotY;
  g.add(grp);
  box(grp, 'pk body', 0, 0.04, 0, 0.2, 0.045, 0.1, mat(color, { metalness: 0.35, roughness: 0.4 }));
  box(grp, 'pk cabin', 0, 0.075, 0, 0.1, 0.035, 0.09, M.glassBlue);
  return grp;
}

function pedestrian(g: THREE.Group, x: number, z: number, shirt: string) {
  const grp = new THREE.Group();
  grp.position.set(x, 0.09, z);
  g.add(grp);
  cyl(grp, 'ped body', 0, 0.05, 0, 0.022, 0.1, mat(shirt, { roughness: 0.7 }), 8);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), mat('#caa472', { roughness: 0.7 }));
  head.position.y = 0.12;
  grp.add(head);
  return grp;
}

function createHQTower(g: THREE.Group, cx: number, cy: number, cz: number) {
  const grp = new THREE.Group();
  grp.position.set(cx, cy, cz);
  g.add(grp);
  const W = 1.3;
  const H = 2.2;
  const D = 1.3;
  box(grp, 'tower body', 0, H / 2, 0, W, H, D, M.oBlue);
  box(grp, 'tower base', 0, 0.06, 0, W + 0.2, 0.12, D + 0.2, M.platform);
  const glows: THREE.Mesh[] = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 5; col++) {
      const wx = -W / 2 + 0.16 + col * 0.25;
      const wy = 0.22 + row * 0.23;
      const lit = (row * 5 + col) % 3 !== 0;
      const m1 = lit ? M.glassWarm : M.glass;
      const wF = box(grp, `tower win F ${row}_${col}`, wx, wy, D / 2 + 0.006, 0.2, 0.16, 0.008, m1);
      const wB = box(grp, `tower win B ${row}_${col}`, wx, wy, -D / 2 - 0.006, 0.2, 0.16, 0.008, m1);
      if (lit) {
        glows.push(wF);
        glows.push(wB);
      }
    }
  }
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 5; col++) {
      const wz = -D / 2 + 0.16 + col * 0.25;
      const wy = 0.22 + row * 0.23;
      const lit = (row * 3 + col) % 3 !== 0;
      const m1 = lit ? M.glassWarm : M.glass;
      box(grp, `tower win L ${row}_${col}`, -W / 2 - 0.006, wy, wz, 0.008, 0.16, 0.2, m1);
      box(grp, `tower win R ${row}_${col}`, W / 2 + 0.006, wy, wz, 0.008, 0.16, 0.2, m1);
    }
  }
  box(grp, 'tower roof', 0, H + 0.03, 0, W + 0.06, 0.06, D + 0.06, M.oNavy);
  box(grp, 'roof terrace 1', 0.1, H + 0.1, 0.1, W * 0.7, 0.06, D * 0.7, M.oBlueBright);
  box(grp, 'roof terrace 2', 0.2, H + 0.16, 0.2, W * 0.42, 0.06, D * 0.42, M.oBlue);
  const rg1 = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), mat('#2f7d42', { roughness: 0.8 }));
  rg1.position.set(-0.4, H + 0.12, -0.35);
  grp.add(rg1);
  const rg2 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), mat('#2f7d42', { roughness: 0.8 }));
  rg2.position.set(-0.35, H + 0.12, 0.4);
  grp.add(rg2);
  box(grp, 'hvac 1', 0.45, H + 0.11, -0.4, 0.16, 0.08, 0.16, M.silver);
  box(grp, 'hvac 2', 0.5, H + 0.11, 0.0, 0.12, 0.07, 0.12, M.metal);
  const logoCube = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.32), M.redHot);
  logoCube.name = 'logo cube';
  logoCube.position.set(0.2, H + 0.42, 0.2);
  grp.add(logoCube);
  const logoTex = makeRealtyLogoTexture();
  box(grp, 'banner bg', 0, H + 0.78, 0, 1.7, 0.42, 0.05, mat('#0a0a0a', { roughness: 0.4 }));
  texturedPlane(grp, logoTex, 0, H + 0.78, 0.03, 1.65, 0.4, 0, 0.5);
  cyl(grp, 'banner post L', -0.55, H + 0.45, 0, 0.016, 0.4, M.silver, 8);
  cyl(grp, 'banner post R', 0.55, H + 0.45, 0, 0.016, 0.4, M.silver, 8);
  box(grp, 'entrance', 0, 0.2, D / 2 + 0.008, 0.6, 0.36, 0.012, mat('#0a0a0a', { roughness: 0.3 }));
  box(grp, 'door L', -0.13, 0.17, D / 2 + 0.015, 0.11, 0.28, 0.005, M.glassWarm);
  box(grp, 'door R', 0.13, 0.17, D / 2 + 0.015, 0.11, 0.28, 0.005, M.glassWarm);
  return { group: grp, logoCube, glows };
}

function createTenant(
  g: THREE.Group,
  cx: number,
  cy: number,
  cz: number,
  label: string,
  brandColor: string,
  w = 1.1,
  d = 0.8,
) {
  const grp = new THREE.Group();
  grp.position.set(cx, cy, cz);
  g.add(grp);
  const H = 0.38;
  box(grp, `tenant body ${label}`, 0, H / 2, 0, w, H, d, M.white);
  box(grp, `tenant band ${label}`, 0, H - 0.04, 0, w + 0.02, 0.12, d + 0.02, mat(brandColor, { emissive: brandColor, emissiveIntensity: 0.35, roughness: 0.4 }));
  box(grp, `tenant roof ${label}`, 0, H + 0.02, 0, w + 0.04, 0.04, d + 0.04, M.metalDark);
  box(grp, `tenant base ${label}`, 0, 0.03, 0, w + 0.06, 0.05, d + 0.06, M.platform);
  const tex = makeFacadeTextTexture(label, brandColor, '#ffffff');
  texturedPlane(grp, tex, 0, H - 0.04, d / 2 + 0.012, w * 0.8, 0.1, 0, 0.7);
  box(grp, `tenant glass ${label}`, 0, H * 0.35, d / 2 + 0.006, w * 0.85, H * 0.45, 0.008, M.glassWarm);
  box(grp, `tenant lot ${label}`, 0, 0.02, d / 2 + 0.4, w + 0.2, 0.012, 0.5, M.road);
  return grp;
}

function buildRealtyIncomeDiorama() {
  const g = new THREE.Group();
  box(g, 'plinth', 0, -0.13, 0, gx(7.4), 0.26, gx(6.0), M.base);
  box(g, 'platform', 0, 0.02, 0, gx(6.9), 0.12, gx(5.6), M.platform);
  box(g, 'road x', 0, 0.084, 0.6, gx(6.5), 0.012, gx(0.5), M.road);
  box(g, 'road z', 0, 0.084, 0, gx(0.5), 0.012, gx(5.0), M.road);
  for (let i = -5; i <= 5; i++) {
    box(g, `lane mark x ${i}`, i * 0.45, 0.087, 0.6, 0.16, 0.005, 0.02, M.white);
  }
  for (let i = 0; i < 5; i++) {
    box(g, `crosswalk N ${i}`, -0.32 + i * 0.16, 0.087, 0.18, 0.08, 0.005, 0.22, M.white);
    box(g, `crosswalk S ${i}`, -0.32 + i * 0.16, 0.087, 1.02, 0.08, 0.005, 0.22, M.white);
  }

  const hq = createHQTower(g, 0, 0.08, -1.4);

  const tenantGlows: THREE.Mesh[] = [];
  const tenants = [
    { label: 'Walmart', color: C.walmartBlue, x: -3.0, z: -1.0, w: 1.2, d: 0.9 },
    { label: 'CVS', color: C.cvsRed, x: 3.0, z: -1.2, w: 1.0, d: 0.8 },
    { label: 'Walgreens', color: C.walgreensRed, x: -0.2, z: 2.0, w: 1.4, d: 0.9 },
    { label: 'Dollar General', color: C.dollarYellow, x: -3.0, z: 1.2, w: 1.1, d: 0.8 },
    { label: 'FedEx', color: C.fedexPurple, x: 3.0, z: 0.9, w: 1.1, d: 0.8 },
    { label: '7-Eleven', color: C.sevenGreen, x: -2.6, z: -2.6, w: 0.9, d: 0.7 },
  ];
  tenants.forEach((t) => {
    const grp = createTenant(g, t.x, 0.08, t.z, t.label, t.color, t.w, t.d);
    grp.traverse((o) => {
      if (o instanceof THREE.Mesh && o.name.startsWith('tenant glass')) tenantGlows.push(o);
    });
  });

  const treeSpots: [number, number][] = [
    [-3.9, -2.6],
    [3.9, -2.6],
    [-3.9, 2.6],
    [3.9, 2.6],
    [-1.4, -0.2],
    [1.4, -0.2],
    [0, 2.9],
    [2.0, 2.7],
    [-3.9, 0],
  ];
  treeSpots.forEach(([x, z]) => tree(g, x, z, 0.42));
  const lampSpots: [number, number][] = [
    [-1.6, 0.9],
    [1.6, 0.9],
    [-1.6, -0.6],
    [1.6, -0.6],
  ];
  lampSpots.forEach(([lx, lz]) => {
    cyl(g, 'lamp post', lx, 0.18, lz, 0.018, 0.32, M.metalDark, 8);
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 12, 10),
      mat('#fff2c8', { emissive: '#ffd98a', emissiveIntensity: 0.8 }),
    );
    lamp.position.set(lx, 0.36, lz);
    g.add(lamp);
  });

  const movingCars: RealtyRuntime['movingCars'] = [];
  const carColors = ['#1a1a1d', '#c0392b', '#2a5a9a', '#5f5e5a'];
  for (let i = 0; i < 4; i++) {
    const car = createCar(g, -3.3 + i * 1.9, 0.07, 0.6, carColors[i], Math.PI / 2, 1.0);
    movingCars.push({ group: car, baseX: -3.3 + i * 1.9, speed: 0.18 + i * 0.04 });
  }

  rooftopPanel(g, '1', '안정적 배당', '월 단위 배당 지급\n장기 현금흐름', -3.0, 0.95, -1.0, 1.0, 0.36, '#d4a020');
  rooftopPanel(g, '2', 'AAA 리테일', '신용도 높은 임차인\n낮은 공실 위험', 3.0, 1.0, -1.2, 1.0, 0.36, '#1a3a6a');
  rooftopPanel(g, '3', '장기 임대', '장기 NNN 계약\n안정적 수익 구조', -0.2, 1.0, 2.0, 1.0, 0.36, '#2d8c4a');
  rooftopPanel(g, '4', '전국 포트폴리오', '분산된 부동산 자산\n지역 리스크 완화', -3.0, 0.95, 1.2, 1.0, 0.36, '#4d148c');
  rooftopPanel(g, '5', '월배당 리츠', '매월 배당 지급\n예측 가능한 수익', 3.0, 1.0, 0.9, 1.0, 0.36, '#c0392b');
  rooftopPanel(g, '6', '필수소비재 임차인', '경기 방어적 업종\n안정적 임대 수요', -2.6, 0.9, -2.6, 1.0, 0.36, '#15233a');

  const lotCarColors = ['#1a1a1d', '#c0392b', '#2a5a9a', '#5f5e5a', '#e8eef0', '#3a3a40'];
  const lotSpots: [number, number][] = [
    [-3.3, -0.3],
    [-2.7, -0.3],
    [2.7, -0.5],
    [3.3, -0.5],
    [-0.6, 2.5],
    [0.2, 2.5],
    [-3.3, 1.8],
    [-2.7, 1.8],
    [2.7, 1.5],
    [3.3, 1.5],
  ];
  lotSpots.forEach(([cx, cz], i) => parkedCar(g, cx, cz, lotCarColors[i % lotCarColors.length], 0));

  const pedColors = ['#c0392b', '#2a5a9a', '#d4a020', '#2d8c4a', '#5f5e5a'];
  const pedSpots: [number, number][] = [
    [-0.5, 0.95],
    [0.5, 0.25],
    [-1.0, 1.4],
    [1.2, 1.6],
    [-2.0, -1.6],
    [2.0, -1.7],
  ];
  pedSpots.forEach(([px, pz], i) => pedestrian(g, px, pz, pedColors[i % pedColors.length]));

  const towerGlow = new THREE.PointLight('#ffd98a', 1.2, 5);
  towerGlow.position.set(0, 1.6, -1.0);
  g.add(towerGlow);
  const goldGlow = new THREE.PointLight('#ffcf3a', 0.7, 3.5);
  goldGlow.position.set(0, 2.6, -1.4);
  g.add(goldGlow);
  const streetGlow = new THREE.PointLight('#fff2c8', 0.6, 4.0);
  streetGlow.position.set(0, 1.0, 0.6);
  g.add(streetGlow);

  g.userData = { logoCube: hq.logoCube, movingCars, tenantGlows: hq.glows.concat(tenantGlows) };
  return g;
}

export function createRealtyIncome(): THREE.Group {
  const root = buildRealtyIncomeDiorama();
  const SPEED = 0.4;
  root.userData.tick = (time: number) => {
    const t = time * SPEED;
    const tRaw = time;
    const u = root.userData as RealtyRuntime;

    if (u.logoCube) {
      u.logoCube.rotation.y = tRaw * 0.6;
      (u.logoCube.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.9 + 0.4 * Math.sin(tRaw * 2);
    }

    u.movingCars.forEach((car, idx) => {
      const pos = ((tRaw * car.speed) + idx * 0.25) % 1;
      car.group.position.x = -3.6 + pos * 7.2;
    });

    if (u.tenantGlows) {
      u.tenantGlows.forEach((m, i) => {
        const mm = m.material as THREE.MeshStandardMaterial;
        mm.emissiveIntensity = 0.65 + 0.25 * Math.sin(tRaw * 1.5 + i * 0.6);
      });
    }

    root.rotation.y = Math.sin(t * 0.15) * 0.008;
  };
  return root;
}
