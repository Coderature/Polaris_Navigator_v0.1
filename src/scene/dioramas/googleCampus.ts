// @ts-nocheck — Alphabet (GOOGL) Google campus diorama.
import * as THREE from 'three';
import { gx, mat, box, cyl, texturedPlane, rooftopPanel, tree, makeFacadeTextTexture } from './dioramaCommon';

interface GoogleRuntime {
  hubCube: THREE.Mesh;
  mapsPins: { group: THREE.Group; baseY: number }[];
  serverLEDs: THREE.Mesh[];
  youtubeScreens: THREE.Mesh[];
  satelliteGlows: THREE.Mesh[];
}

const C = {
  gBlue: '#4285f4',
  gRed: '#ea4335',
  gYellow: '#fbbc05',
  gGreen: '#34a853',
  gBlueBright: '#6aa6ff',
  gDark: '#0e1626',
  gNavy: '#13243e',
  glass: '#2a4a7a',
  glassWarm: '#cfe0ff',
  glassBlue: '#3a78c8',
  metalDark: '#3a3a40',
  metal: '#7a7a80',
  silver: '#c8c8cc',
  road: '#1c1e22',
  base: '#08090d',
  platform: '#15171c',
  white: '#f0f3f3',
  ytRed: '#ff0033',
  androidGreen: '#3ddc84',
  mapsGreen: '#34a853',
  server: '#23314a',
};

const M = {
  gBlue: mat(C.gBlue, { roughness: 0.35, emissive: C.gBlue, emissiveIntensity: 0.35 }),
  gRed: mat(C.gRed, { roughness: 0.35, emissive: C.gRed, emissiveIntensity: 0.35 }),
  gYellow: mat(C.gYellow, { roughness: 0.35, emissive: C.gYellow, emissiveIntensity: 0.35 }),
  gGreen: mat(C.gGreen, { roughness: 0.35, emissive: C.gGreen, emissiveIntensity: 0.35 }),
  gBlueHot: mat(C.gBlueBright, { emissive: C.gBlueBright, emissiveIntensity: 1.3, roughness: 0.25 }),
  gDark: mat(C.gDark, { roughness: 0.5 }),
  gNavy: mat(C.gNavy, { roughness: 0.5, metalness: 0.2 }),
  metalDark: mat(C.metalDark, { roughness: 0.35, metalness: 0.65 }),
  metal: mat(C.metal, { roughness: 0.35, metalness: 0.55 }),
  silver: mat(C.silver, { roughness: 0.32, metalness: 0.55 }),
  white: mat(C.white, { roughness: 0.4 }),
  glass: mat(C.glass, {
    roughness: 0.15,
    metalness: 0.15,
    transparent: true,
    opacity: 0.55,
    emissive: '#1a3a6a',
    emissiveIntensity: 0.2,
  }),
  glassWarm: mat(C.glassWarm, { emissive: '#cfe0ff', emissiveIntensity: 0.8, roughness: 0.25 }),
  glassBlue: mat(C.glassBlue, { roughness: 0.15, transparent: true, opacity: 0.6 }),
  ytRed: mat(C.ytRed, { emissive: C.ytRed, emissiveIntensity: 1.0, roughness: 0.3 }),
  androidGreen: mat(C.androidGreen, { roughness: 0.4, emissive: C.androidGreen, emissiveIntensity: 0.3 }),
  mapsGreen: mat(C.mapsGreen, { emissive: C.mapsGreen, emissiveIntensity: 0.6, roughness: 0.3 }),
  server: mat(C.server, { roughness: 0.45, metalness: 0.3 }),
  road: mat(C.road, { roughness: 0.85 }),
  base: mat(C.base, { roughness: 0.55 }),
  platform: mat(C.platform, { roughness: 0.65 }),
};

const BRAND = [C.gBlue, C.gRed, C.gYellow, C.gGreen];

function makeGoogleLogoTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 384;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#0e1626';
  ctx.fillRect(0, 0, c.width, c.height);
  const letters: [string, string][] = [
    ['G', '#4285f4'],
    ['o', '#ea4335'],
    ['o', '#fbbc05'],
    ['g', '#4285f4'],
    ['l', '#34a853'],
    ['e', '#ea4335'],
  ];
  ctx.font = 'bold 200px Arial, sans-serif';
  ctx.textBaseline = 'middle';
  const totalW = letters.length * 130;
  let x = (c.width - totalW) / 2 + 65;
  letters.forEach(([ch, col]) => {
    ctx.fillStyle = col;
    ctx.textAlign = 'center';
    ctx.fillText(ch, x, c.height / 2);
    x += 130;
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function createMapsPin(scale = 1) {
  const grp = new THREE.Group();
  grp.scale.setScalar(scale);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), M.mapsGreen);
  head.position.y = 0.18;
  grp.add(head);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 16), M.mapsGreen);
  tip.position.y = 0.07;
  tip.rotation.x = Math.PI;
  grp.add(tip);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 10), M.white);
  dot.position.y = 0.18;
  dot.position.z = 0.06;
  grp.add(dot);
  return grp;
}

function createGoogleHQ(g: THREE.Group, cx: number, cy: number, cz: number) {
  const grp = new THREE.Group();
  grp.position.set(cx, cy, cz);
  g.add(grp);
  const W = 2.2;
  const H = 1.3;
  const D = 1.5;
  box(grp, 'hq body', 0, H / 2, 0, W, H, D, M.gDark);
  box(grp, 'hq base', 0, 0.06, 0, W + 0.2, 0.12, D + 0.2, M.platform);
  for (let i = 0; i < 4; i++) {
    box(
      grp,
      `roof stripe ${i}`,
      -W / 2 + 0.3 + i * (W / 4),
      H + 0.04,
      0,
      W / 4 - 0.04,
      0.08,
      D + 0.06,
      mat(BRAND[i], { emissive: BRAND[i], emissiveIntensity: 0.4 }),
    );
  }
  const logoTex = makeGoogleLogoTexture();
  texturedPlane(grp, logoTex, 0, H * 0.55, D / 2 + 0.012, 1.6, 0.5, 0, 1.2);
  const glows: THREE.Mesh[] = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 9; col++) {
      const wx = -W / 2 + 0.18 + col * 0.23;
      const wy = 0.2 + row * 0.2;
      const lit = (row * 9 + col) % 3 !== 0;
      if (row !== 2) {
        const m1 = lit
          ? mat(BRAND[(row + col) % 4], { emissive: BRAND[(row + col) % 4], emissiveIntensity: 0.5, roughness: 0.3 })
          : M.glass;
        const w = box(grp, `hq win F ${row}_${col}`, wx, wy, D / 2 + 0.006, 0.18, 0.15, 0.008, m1);
        if (lit) glows.push(w);
      }
      const wz = -D / 2 + 0.18 + col * 0.15;
      box(grp, `hq win L ${row}_${col}`, -W / 2 - 0.006, wy, wz, 0.008, 0.15, 0.12, lit ? M.glassWarm : M.glass);
      box(grp, `hq win R ${row}_${col}`, W / 2 + 0.006, wy, wz, 0.008, 0.15, 0.12, lit ? M.glassWarm : M.glass);
    }
  }
  return { group: grp, glows };
}

function createPlatformHub(g: THREE.Group, cx: number, cy: number, cz: number) {
  const grp = new THREE.Group();
  grp.position.set(cx, cy, cz);
  g.add(grp);
  box(grp, 'hub pad', 0, 0.02, 0, 0.9, 0.04, 0.9, M.gNavy);
  for (let i = 0; i < 4; i++) {
    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.022, 8, 12, Math.PI / 2),
      mat(BRAND[i], { emissive: BRAND[i], emissiveIntensity: 1.0, roughness: 0.3 }),
    );
    arc.rotation.x = Math.PI / 2;
    arc.rotation.z = (i * Math.PI) / 2;
    arc.position.y = 0.06;
    grp.add(arc);
  }
  const cube = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), M.gBlue);
  cube.name = 'hub cube';
  cube.position.set(0, 0.28, 0);
  grp.add(cube);
  const gTex = makeFacadeTextTexture('G', '#4285f4', '#ffffff');
  [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach((rot) => {
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(0.16, 0.16),
      new THREE.MeshStandardMaterial({
        map: gTex,
        emissive: '#ffffff',
        emissiveMap: gTex,
        emissiveIntensity: 0.6,
        roughness: 0.3,
        transparent: true,
      }),
    );
    face.position.set(Math.sin(rot) * 0.101, 0.28, Math.cos(rot) * 0.101);
    face.rotation.y = rot;
    cube.add(face);
  });
  return { group: grp, cube };
}

function createServerSatellite(g: THREE.Group, cx: number, cy: number, cz: number, ledStore: THREE.Mesh[]) {
  const grp = new THREE.Group();
  grp.position.set(cx, cy, cz);
  g.add(grp);
  const H = 0.5;
  box(grp, 'sat body Cloud AI', 0, H / 2, 0, 1.0, H, 0.8, M.gDark);
  box(grp, 'sat roof Cloud AI', 0, H + 0.02, 0, 1.04, 0.04, 0.84, M.gBlue);
  box(grp, 'sat base Cloud AI', 0, 0.03, 0, 1.06, 0.05, 0.86, M.platform);
  const tex = makeFacadeTextTexture('Cloud AI', '#0e1626', '#4285f4');
  texturedPlane(grp, tex, 0, H * 0.75, 0.41, 0.85, 0.12, 0, 0.7);
  for (let r = 0; r < 3; r++) {
    const rx = -0.3 + r * 0.3;
    box(grp, `rack ${r}`, rx, 0.22, 0.0, 0.22, 0.36, 0.5, M.server);
    for (let l = 0; l < 6; l++) {
      const led = box(
        grp,
        `rack led ${r}_${l}`,
        rx,
        0.1 + l * 0.05,
        0.26,
        0.16,
        0.02,
        0.008,
        mat(BRAND[(r + l) % 4], { emissive: BRAND[(r + l) % 4], emissiveIntensity: 0.8 }),
      );
      ledStore.push(led);
    }
  }
  return grp;
}

function createYouTubeSatellite(g: THREE.Group, cx: number, cy: number, cz: number, screenStore: THREE.Mesh[]) {
  const grp = new THREE.Group();
  grp.position.set(cx, cy, cz);
  g.add(grp);
  const H = 0.45;
  box(grp, 'sat body YouTube', 0, H / 2, 0, 0.95, H, 0.7, M.gDark);
  box(grp, 'sat roof YouTube', 0, H + 0.02, 0, 0.99, 0.04, 0.74, M.ytRed);
  box(grp, 'sat base YouTube', 0, 0.03, 0, 1.01, 0.05, 0.76, M.platform);
  box(grp, 'yt sign', 0, H + 0.14, 0, 0.3, 0.2, 0.05, M.ytRed);
  const tri = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.1, 3), M.white);
  tri.position.set(0, H + 0.14, 0.03);
  tri.rotation.x = Math.PI / 2;
  tri.rotation.z = -Math.PI / 2;
  grp.add(tri);
  for (let i = 0; i < 3; i++) {
    const scr = box(
      grp,
      `yt screen ${i}`,
      -0.3 + i * 0.3,
      H * 0.55,
      0.36,
      0.24,
      0.16,
      0.008,
      mat(BRAND[i % 4], { emissive: BRAND[i % 4], emissiveIntensity: 0.7 }),
    );
    screenStore.push(scr);
  }
  return grp;
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
  box(grp, `sat body ${label}`, 0, H / 2, 0, w, H, d, M.gDark);
  box(grp, `sat roof ${label}`, 0, H + 0.02, 0, w + 0.04, 0.04, d + 0.04, mat(color, { emissive: color, emissiveIntensity: 0.35 }));
  box(grp, `sat base ${label}`, 0, 0.03, 0, w + 0.06, 0.05, d + 0.06, M.platform);
  const tex = makeFacadeTextTexture(label, '#0e1626', color);
  texturedPlane(grp, tex, 0, H * 0.6, d / 2 + 0.008, w * 0.85, 0.14, 0, 0.7);
  for (let i = 0; i < 3; i++) {
    box(grp, `sat win ${label} ${i}`, -w / 3 + (i * w) / 3, H * 0.3, d / 2 + 0.006, 0.16, 0.12, 0.008, M.glassWarm);
  }
  return grp;
}

function createAndroidFigure(g: THREE.Group, x: number, y: number, z: number, scale = 1) {
  const grp = new THREE.Group();
  grp.position.set(x, y, z);
  grp.scale.setScalar(scale);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    M.androidGreen,
  );
  head.position.y = 0.34;
  grp.add(head);
  [-0.06, 0.06].forEach((ax) => {
    const ant = cyl(grp, 'android antenna', ax, 0.44, 0, 0.008, 0.08, M.androidGreen, 6);
    ant.rotation.z = ax > 0 ? -0.3 : 0.3;
  });
  box(grp, 'android body', 0, 0.18, 0, 0.2, 0.26, 0.14, M.androidGreen);
  [-0.04, 0.04].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), M.white);
    eye.position.set(ex, 0.38, 0.1);
    grp.add(eye);
  });
  return grp;
}

function buildGoogleDiorama() {
  const g = new THREE.Group();
  box(g, 'plinth', 0, -0.13, 0, gx(7.6), 0.26, gx(6.0), M.base);
  box(g, 'platform', 0, 0.02, 0, gx(7.1), 0.12, gx(5.6), M.platform);
  box(g, 'road x', 0, 0.084, 1.5, gx(6.0), 0.012, gx(0.45), M.road);
  box(g, 'road z L', -2.3, 0.084, 0, gx(0.4), 0.012, gx(4.0), M.road);
  box(g, 'road z R', 2.3, 0.084, 0, gx(0.4), 0.012, gx(4.0), M.road);

  const hq = createGoogleHQ(g, 0, 0.08, -1.5);
  const hub = createPlatformHub(g, 0, 0.08, 0.3);

  const satGlows: THREE.Mesh[] = [];
  const serverLEDs: THREE.Mesh[] = [];
  const youtubeScreens: THREE.Mesh[] = [];

  const searchGrp = createSatellite(g, -2.7, 0.08, -1.4, 'Search', C.gBlue, 1.0, 0.7);
  searchGrp.traverse((o) => {
    if (o instanceof THREE.Mesh && o.name.startsWith('sat roof Search')) satGlows.push(o);
  });
  createYouTubeSatellite(g, 0.0, 0.08, -2.7, youtubeScreens);
  createServerSatellite(g, 2.7, 0.08, -1.3, serverLEDs);
  const androidGrp = createSatellite(g, 3.0, 0.08, 0.4, 'Android', C.androidGreen, 0.9, 0.7);
  androidGrp.traverse((o) => {
    if (o instanceof THREE.Mesh && o.name.startsWith('sat roof Android')) satGlows.push(o);
  });
  createAndroidFigure(g, 3.0, 0.55, 0.4, 0.8);
  const mapsGrp = createSatellite(g, -3.0, 0.08, 0.4, 'Maps', C.gGreen, 0.9, 0.7);
  mapsGrp.traverse((o) => {
    if (o instanceof THREE.Mesh && o.name.startsWith('sat roof Maps')) satGlows.push(o);
  });
  const hwGrp = createSatellite(g, -1.6, 0.08, 2.2, 'Pixel', C.gYellow, 0.9, 0.7);
  hwGrp.traverse((o) => {
    if (o instanceof THREE.Mesh && o.name.startsWith('sat roof Pixel')) satGlows.push(o);
  });

  const mapsPins: GoogleRuntime['mapsPins'] = [];
  const pinSpots: [number, number, number][] = [
    [-3.0, 0.7, 0.4],
    [1.6, 0.6, 2.2],
    [-1.6, 0.7, 2.2],
    [2.2, 0.7, 1.6],
  ];
  pinSpots.forEach(([px, py, pz]) => {
    const pin = createMapsPin(0.8);
    pin.position.set(px, py, pz);
    g.add(pin);
    mapsPins.push({ group: pin, baseY: py });
  });

  const treeSpots: [number, number][] = [
    [-1.3, -0.6],
    [1.3, -0.6],
    [-1.3, 1.2],
    [1.3, 1.2],
    [0, 2.7],
    [-3.7, 2.3],
    [3.7, 2.3],
  ];
  treeSpots.forEach(([x, z]) => tree(g, x, z, 0.4));

  rooftopPanel(g, '1', 'Search & Ads', '검색·광고\n핵심 수익원', -2.7, 1.0, -1.4, 1.0, 0.36, '#4285f4');
  rooftopPanel(g, '2', 'YouTube', '글로벌 콘텐츠\n플랫폼', 0.0, 1.05, -2.7, 1.0, 0.36, '#ff0033');
  rooftopPanel(g, '3', 'Cloud & AI', 'Gemini·클라우드\n인프라', 2.7, 1.1, -1.3, 1.0, 0.36, '#34a853');
  rooftopPanel(g, '4', 'Android', '모바일 OS\n생태계', 3.0, 1.0, 0.4, 1.0, 0.36, '#3ddc84');

  const hqGlow = new THREE.PointLight('#cfe0ff', 1.2, 5);
  hqGlow.position.set(0, 1.4, -1.5);
  g.add(hqGlow);
  const hubGlow = new THREE.PointLight('#6aa6ff', 1.0, 3.5);
  hubGlow.position.set(0, 0.6, 0.3);
  g.add(hubGlow);
  const cloudGlow = new THREE.PointLight('#4285f4', 0.6, 3.5);
  cloudGlow.position.set(2.7, 0.8, -1.3);
  g.add(cloudGlow);
  const ytGlow = new THREE.PointLight('#ff0033', 0.5, 3.0);
  ytGlow.position.set(0, 0.8, -2.7);
  g.add(ytGlow);

  g.userData = {
    hubCube: hub.cube,
    mapsPins,
    serverLEDs,
    youtubeScreens,
    satelliteGlows: hq.glows.concat(satGlows),
  };
  return g;
}

export function createGoogleCampus(): THREE.Group {
  const root = buildGoogleDiorama();
  const SPEED = 0.4;
  root.userData.tick = (time: number) => {
    const t = time * SPEED;
    const tRaw = time;
    const u = root.userData as GoogleRuntime;

    if (u.hubCube) {
      u.hubCube.rotation.y = tRaw * 0.5;
      u.hubCube.position.y = 0.28 + Math.sin(tRaw * 1.5) * 0.02;
    }

    if (u.mapsPins) {
      u.mapsPins.forEach((entry, i) => {
        const pin = entry.group;
        pin.rotation.y = tRaw * 0.6 + i;
        pin.position.y = entry.baseY + 0.05 * Math.sin(tRaw * 1.8 + i);
      });
    }

    if (u.serverLEDs) {
      u.serverLEDs.forEach((led, i) => {
        (led.material as THREE.MeshStandardMaterial).emissiveIntensity =
          0.4 + 0.6 * Math.abs(Math.sin(tRaw * 3 + i * 0.7));
      });
    }

    if (u.youtubeScreens) {
      u.youtubeScreens.forEach((scr, i) => {
        (scr.material as THREE.MeshStandardMaterial).emissiveIntensity =
          0.5 + 0.4 * Math.sin(tRaw * 2 + i * 1.1);
      });
    }

    if (u.satelliteGlows) {
      u.satelliteGlows.forEach((m, i) => {
        (m.material as THREE.MeshStandardMaterial).emissiveIntensity =
          0.5 + 0.3 * Math.sin(tRaw * 1.5 + i * 0.5);
      });
    }

    root.rotation.y = Math.sin(t * 0.15) * 0.008;
  };
  return root;
}
