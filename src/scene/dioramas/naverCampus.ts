// @ts-nocheck — Naver (035420) business-model diorama.
import * as THREE from 'three';
import {
  GROUND_XZ,
  gx,
  mat,
  box,
  cyl,
  roundRect,
  texturedPlane,
  rooftopPanel,
  tree,
  makeFacadeTextTexture,
} from './dioramaCommon';

interface NaverRuntime {
  hubRing: THREE.Mesh;
  hubCube: THREE.Mesh;
  satelliteGlows: THREE.Mesh[];
  movingCars: { group: THREE.Group; baseX: number; speed: number }[];
}

const C = {
  naverGreen: '#03c75a',
  naverGreenBright: '#1ee87f',
  naverGreenDeep: '#02913f',
  naverDark: '#0a1f14',
  naverNavy: '#0e2a1c',
  glass: '#2a6a4a',
  glassWarm: '#7affc0',
  glassGreen: '#1aa860',
  metalDark: '#3a3a40',
  metal: '#7a7a80',
  silver: '#c8c8cc',
  road: '#1c1e22',
  base: '#08090d',
  platform: '#15171c',
  white: '#f0f3f3',
  line: '#06c755',
  payGreen: '#03c75a',
  cloudBlue: '#2db4d8',
};

const M = {
  naverGreen: mat(C.naverGreen, { roughness: 0.35, emissive: C.naverGreen, emissiveIntensity: 0.4 }),
  naverGreenHot: mat(C.naverGreenBright, { emissive: C.naverGreenBright, emissiveIntensity: 1.4, roughness: 0.25 }),
  naverGreenDeep: mat(C.naverGreenDeep, { roughness: 0.4 }),
  naverDark: mat(C.naverDark, { roughness: 0.5 }),
  naverNavy: mat(C.naverNavy, { roughness: 0.5, metalness: 0.2 }),
  metalDark: mat(C.metalDark, { roughness: 0.35, metalness: 0.65 }),
  metal: mat(C.metal, { roughness: 0.35, metalness: 0.55 }),
  silver: mat(C.silver, { roughness: 0.32, metalness: 0.55 }),
  white: mat(C.white, { roughness: 0.4 }),
  glass: mat(C.glass, {
    roughness: 0.15,
    metalness: 0.15,
    transparent: true,
    opacity: 0.55,
    emissive: '#0a4a2a',
    emissiveIntensity: 0.2,
  }),
  glassWarm: mat(C.glassWarm, { emissive: '#7affc0', emissiveIntensity: 0.8, roughness: 0.25 }),
  glassGreen: mat(C.glassGreen, {
    roughness: 0.15,
    transparent: true,
    opacity: 0.6,
    emissive: C.glassGreen,
    emissiveIntensity: 0.3,
  }),
  road: mat(C.road, { roughness: 0.85 }),
  base: mat(C.base, { roughness: 0.55 }),
  platform: mat(C.platform, { roughness: 0.65 }),
};

function makeNaverLogoTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 384;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#0a1f14';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#03c75a';
  ctx.font = 'bold 200px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NAVER', c.width / 2, c.height / 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeNGlyphTexture(bg = '#03c75a', fg = '#ffffff') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = bg;
  roundRect(ctx, 0, 0, 256, 256, 40);
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.font = 'bold 190px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('N', 128, 138);
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
  box(grp, 'car cabin', 0.0, 0.08, 0, 0.11, 0.04, 0.1, mat(C.glassGreen, { transparent: true, opacity: 0.6 }));
  [-0.07, 0.07].forEach((wx) => {
    [-0.05, 0.05].forEach((wz) => {
      const w = cyl(grp, 'wheel', wx, 0.018, wz, 0.022, 0.016, M.metalDark, 12);
      w.rotation.x = Math.PI / 2;
    });
  });
  return grp;
}

function createNaverHQ(g: THREE.Group, cx: number, cy: number, cz: number) {
  const grp = new THREE.Group();
  grp.position.set(cx, cy, cz);
  g.add(grp);
  const W = 2.2;
  const H = 1.6;
  const D = 1.5;
  box(grp, 'hq body', 0, H / 2, 0, W, H, D, M.naverDark);
  box(grp, 'hq base', 0, 0.06, 0, W + 0.2, 0.12, D + 0.2, M.platform);
  box(grp, 'hq roof', 0, H + 0.03, 0, W + 0.06, 0.06, D + 0.06, M.naverNavy);
  const logoTex = makeNaverLogoTexture();
  texturedPlane(grp, logoTex, 0, H * 0.55, D / 2 + 0.012, 1.6, 0.5, 0, 1.2);
  const glows: THREE.Mesh[] = [];
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 9; col++) {
      const wx = -W / 2 + 0.18 + col * 0.24;
      const wy = 0.2 + row * 0.24;
      const lit = (row * 9 + col) % 4 !== 0;
      const m1 = lit ? M.glassWarm : M.glass;
      if (row !== 2 && row !== 3) {
        const w = box(grp, `hq win F ${row}_${col}`, wx, wy, D / 2 + 0.006, 0.2, 0.18, 0.008, m1);
        if (lit) glows.push(w);
      }
      const wz = -D / 2 + 0.16 + col * 0.18;
      box(grp, `hq win L ${row}_${col}`, -W / 2 - 0.006, wy, wz, 0.008, 0.18, 0.14, lit ? M.glassWarm : M.glass);
      box(grp, `hq win R ${row}_${col}`, W / 2 + 0.006, wy, wz, 0.008, 0.18, 0.14, lit ? M.glassWarm : M.glass);
    }
  }
  return { group: grp, glows };
}

function createPlatformHub(g: THREE.Group, cx: number, cy: number, cz: number) {
  const grp = new THREE.Group();
  grp.position.set(cx, cy, cz);
  g.add(grp);
  box(grp, 'hub pad', 0, 0.02, 0, 0.9, 0.04, 0.9, M.naverNavy);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.025, 10, 40), M.naverGreenHot);
  ring.name = 'hub ring';
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, 0.06, 0);
  grp.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.015, 8, 32), M.naverGreen);
  ring2.rotation.x = Math.PI / 2;
  ring2.position.set(0, 0.05, 0);
  grp.add(ring2);
  const cube = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), M.naverGreen);
  cube.name = 'hub cube';
  cube.position.set(0, 0.26, 0);
  grp.add(cube);
  const nTex = makeNGlyphTexture();
  [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach((rot) => {
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(0.15, 0.15),
      new THREE.MeshStandardMaterial({
        map: nTex,
        emissive: '#ffffff',
        emissiveMap: nTex,
        emissiveIntensity: 0.6,
        roughness: 0.3,
        transparent: true,
      }),
    );
    face.position.set(Math.sin(rot) * 0.091, 0.26, Math.cos(rot) * 0.091);
    face.rotation.y = rot;
    cube.add(face);
  });
  return { group: grp, ring, cube };
}

function createSatellite(
  g: THREE.Group,
  cx: number,
  cy: number,
  cz: number,
  label: string,
  color: string,
  w = 0.9,
  d = 0.7,
) {
  const grp = new THREE.Group();
  grp.position.set(cx, cy, cz);
  g.add(grp);
  const H = 0.45;
  box(grp, `sat body ${label}`, 0, H / 2, 0, w, H, d, M.naverDark);
  box(grp, `sat roof ${label}`, 0, H + 0.02, 0, w + 0.04, 0.04, d + 0.04, mat(color, { emissive: color, emissiveIntensity: 0.35 }));
  box(grp, `sat base ${label}`, 0, 0.03, 0, w + 0.06, 0.05, d + 0.06, M.platform);
  const tex = makeFacadeTextTexture(label, '#0a1f14', color);
  texturedPlane(grp, tex, 0, H * 0.6, d / 2 + 0.008, w * 0.85, 0.14, 0, 0.7);
  for (let i = 0; i < 3; i++) {
    box(grp, `sat win ${label} ${i}`, -w / 3 + (i * w) / 3, H * 0.3, d / 2 + 0.006, 0.16, 0.12, 0.008, M.glassWarm);
  }
  return grp;
}

function buildNaverDiorama() {
  const g = new THREE.Group();
  box(g, 'plinth', 0, -0.13, 0, gx(7.4), 0.26, gx(6.0), M.base);
  box(g, 'platform', 0, 0.02, 0, gx(6.9), 0.12, gx(5.6), M.platform);
  box(g, 'road x', 0, 0.084, 1.4, gx(6.0), 0.012, gx(0.45), M.road);
  box(g, 'road z L', -2.2, 0.084, 0, gx(0.4), 0.012, gx(4.0), M.road);
  box(g, 'road z R', 2.2, 0.084, 0, gx(0.4), 0.012, gx(4.0), M.road);

  const hq = createNaverHQ(g, 0, 0.08, -1.5);
  const hub = createPlatformHub(g, 0, 0.08, 0.2);

  const satGlows: THREE.Mesh[] = [];
  const sats = [
    { label: 'Search', color: '#03c75a', x: -2.6, z: -1.6 },
    { label: 'Commerce', color: '#1ee87f', x: 0.0, z: -2.6 },
    { label: 'Content', color: '#2db4d8', x: 2.6, z: -1.6 },
    { label: 'N Pay', color: '#03c75a', x: 3.0, z: 0.2 },
    { label: 'Cloud AI', color: '#2db4d8', x: 2.4, z: 1.8 },
    { label: 'LINE', color: '#06c755', x: -2.4, z: 1.8 },
    { label: 'Works', color: '#1aa860', x: -3.0, z: 0.2 },
  ];
  sats.forEach((s) => {
    const grp = createSatellite(g, s.x, 0.08, s.z, s.label, s.color, 0.9, 0.7);
    grp.traverse((o) => {
      if (o instanceof THREE.Mesh && o.name.startsWith(`sat roof ${s.label}`)) satGlows.push(o);
    });
  });

  const treeSpots: [number, number][] = [
    [-1.3, -0.6],
    [1.3, -0.6],
    [-1.3, 1.0],
    [1.3, 1.0],
    [0, 2.7],
    [-3.6, 2.4],
    [3.6, 2.4],
  ];
  treeSpots.forEach(([x, z]) => tree(g, x, z, 0.4));

  const movingCars: NaverRuntime['movingCars'] = [];
  const carColors = ['#1a1a1d', '#03c75a', '#5f5e5a'];
  for (let i = 0; i < 3; i++) {
    const car = createCar(g, -2.6 + i * 2.6, 0.07, 1.4, carColors[i], Math.PI / 2, 1.0);
    movingCars.push({ group: car, baseX: -2.6 + i * 2.6, speed: 0.18 + i * 0.05 });
  }

  rooftopPanel(g, '1', 'Search & Portal', '검색으로 연결하는 시작', -2.6, 1.0, -1.6, 1.0, 0.36, '#03c75a');
  rooftopPanel(g, '2', 'Commerce', '스마트스토어\n쇼핑의 모든 경험', 0.0, 1.05, -2.6, 1.0, 0.36, '#1ee87f');
  rooftopPanel(g, '3', 'Fintech', '네이버페이\n금융의 새 기준', 3.0, 1.0, 0.2, 1.0, 0.36, '#03c75a');
  rooftopPanel(g, '4', 'Cloud & AI', 'AI 기술과\n클라우드 인프라', 2.4, 1.05, 1.8, 1.0, 0.36, '#2db4d8');

  const hqGlow = new THREE.PointLight('#7affc0', 1.2, 5);
  hqGlow.position.set(0, 1.4, -1.5);
  g.add(hqGlow);
  const hubGlow = new THREE.PointLight('#1ee87f', 1.0, 3.5);
  hubGlow.position.set(0, 0.6, 0.2);
  g.add(hubGlow);
  const greenGlow = new THREE.PointLight('#03c75a', 0.6, 4.0);
  greenGlow.position.set(0, 1.0, 1.0);
  g.add(greenGlow);

  g.userData = {
    hubRing: hub.ring,
    hubCube: hub.cube,
    satelliteGlows: hq.glows.concat(satGlows),
    movingCars,
  };
  return g;
}

export function createNaver(): THREE.Group {
  const root = buildNaverDiorama();
  const SPEED = 0.4;
  root.userData.tick = (time: number) => {
    const t = time * SPEED;
    const tRaw = time;
    const u = root.userData as NaverRuntime;

    if (u.hubRing) {
      u.hubRing.rotation.z = tRaw * 0.8;
      (u.hubRing.material as THREE.MeshStandardMaterial).emissiveIntensity =
        1.0 + 0.6 * Math.sin(tRaw * 2.5);
    }
    if (u.hubCube) {
      u.hubCube.rotation.y = tRaw * 0.5;
      u.hubCube.position.y = 0.26 + Math.sin(tRaw * 1.5) * 0.02;
    }
    if (u.satelliteGlows) {
      u.satelliteGlows.forEach((m, i) => {
        (m.material as THREE.MeshStandardMaterial).emissiveIntensity =
          0.6 + 0.3 * Math.sin(tRaw * 1.5 + i * 0.5);
      });
    }
    u.movingCars.forEach((car, idx) => {
      const pos = (tRaw * car.speed + idx * 0.3) % 1;
      car.group.position.x = -3.0 + pos * 6.0;
    });

    root.rotation.y = Math.sin(t * 0.15) * 0.008;
  };
  return root;
}
