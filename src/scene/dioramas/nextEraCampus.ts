// @ts-nocheck — NextEra Energy (NEE) diorama; builder body unmodified from DESIGN spec.
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
  makeLabelPanelTexture,
  makeFacadeTextTexture,
  type MatOpts,
} from './dioramaCommon';

interface NextEraRuntime {
  turbineRotors: THREE.Group[];
  powerLineBeads: THREE.Mesh[];
  batteryGlows: THREE.Mesh[];
  houseGlows: THREE.Mesh[];
}

// ===== Palette (NextEra tone — clean energy green + sky blue) =====
const C = {
  neeGreen: '#5ac43a', neeGreenBright: '#8aff5a', neeGreenDeep: '#3a8c1a',
  neeBlue: '#2a8ad8', neeBlueBright: '#4ad9ff', neeCyan: '#5de0ff',
  neeDark: '#0e1a24', neeNavy: '#13283a',
  glass: '#2a5a7a', glassWarm: '#cfe8ff', glassBlue: '#3a78c8',
  metalDark: '#3a3a40', metal: '#7a7a80', silver: '#c8c8cc', steel: '#a0aab0',
  road: '#1c1e22', base: '#08090d', platform: '#15171c',
  white: '#f0f3f3', turbineWhite: '#eef2f4',
  solarPanel: '#1a3a8a', solarCell: '#2a5ac0',
  battery: '#c8d0d4', batteryGlow: '#5ac43a',
  grass: '#2d8c4a', bark: '#7a4b2a', houseRoof: '#3a3a44',
};

const M = {
  neeGreen: mat(C.neeGreen, { roughness: .35, emissive: C.neeGreen, emissiveIntensity: 0.4 }),
  neeGreenHot: mat(C.neeGreenBright, { emissive: C.neeGreenBright, emissiveIntensity: 1.4, roughness: .25 }),
  neeBlue: mat(C.neeBlue, { roughness: .35, emissive: C.neeBlue, emissiveIntensity: 0.2 }),
  neeCyanHot: mat(C.neeCyan, { emissive: C.neeCyan, emissiveIntensity: 1.4, roughness: .25 }),
  neeDark: mat(C.neeDark, { roughness: .5 }),
  neeNavy: mat(C.neeNavy, { roughness: .5, metalness: .2 }),
  metalDark: mat(C.metalDark, { roughness: .35, metalness: .65 }),
  metal: mat(C.metal, { roughness: .35, metalness: .55 }),
  silver: mat(C.silver, { roughness: .32, metalness: .55 }),
  steel: mat(C.steel, { roughness: .3, metalness: .7 }),
  white: mat(C.white, { roughness: .4 }),
  turbineWhite: mat(C.turbineWhite, { roughness: .4, metalness: .1 }),
  glass: mat(C.glass, { roughness: .15, metalness: .15, transparent: true, opacity: 0.55, emissive: '#1a3a5a', emissiveIntensity: 0.2 }),
  glassWarm: mat(C.glassWarm, { emissive: '#cfe8ff', emissiveIntensity: 0.8, roughness: .25 }),
  glassBlue: mat(C.glassBlue, { roughness: .15, transparent: true, opacity: .6 }),
  solarPanel: mat(C.solarPanel, { roughness: .25, metalness: .4, emissive: C.solarCell, emissiveIntensity: 0.25 }),
  battery: mat(C.battery, { roughness: .4, metalness: .5 }),
  batteryGlow: mat(C.batteryGlow, { emissive: C.batteryGlow, emissiveIntensity: 1.2, roughness: .3 }),
  road: mat(C.road, { roughness: .85 }),
  base: mat(C.base, { roughness: .55 }),
  platform: mat(C.platform, { roughness: .65 }),
  houseRoof: mat(C.houseRoof, { roughness: .6 }),
};

function makeNeeLogoTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 384;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#0e1a24';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#5ac43a';
  ctx.font = 'bold 130px Arial, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('NEXTera', c.width / 2, c.height / 2 - 50);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 110px Arial, sans-serif';
  ctx.fillText('ENERGY', c.width / 2, c.height / 2 + 70);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function createTurbine(g: THREE.Group, x: number, y: number, z: number, scale = 1) {
  const grp = new THREE.Group();
  grp.position.set(x, y, z); grp.scale.setScalar(scale);
  g.add(grp);
  cyl(grp, 'turbine tower', 0, 0.55, 0, 0.04, 1.1, M.turbineWhite, 14);
  cyl(grp, 'turbine base', 0, 0.04, 0, 0.08, 0.08, M.steel, 14);
  box(grp, 'nacelle', 0, 1.12, 0.04, 0.1, 0.08, 0.16, M.turbineWhite);
  const rotor = new THREE.Group();
  rotor.position.set(0, 1.12, 0.13);
  grp.add(rotor);
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), M.steel);
  rotor.add(hub);
  for (let i = 0; i < 3; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.5, 0.008), M.turbineWhite);
    blade.position.y = 0.25;
    const bladeGrp = new THREE.Group();
    bladeGrp.rotation.z = (i * 2 * Math.PI) / 3;
    bladeGrp.add(blade);
    const tip = new THREE.Mesh(
      new THREE.BoxGeometry(0.026, 0.06, 0.009),
      mat('#e0392b', { emissive: '#e0392b', emissiveIntensity: 0.3 }),
    );
    tip.position.y = 0.47;
    bladeGrp.add(tip);
    rotor.add(bladeGrp);
  }
  rotor.name = 'rotor';
  return { group: grp, rotor };
}

function createSolarArray(g: THREE.Group, cx: number, cy: number, cz: number, rows = 3, cols = 4) {
  const grp = new THREE.Group();
  grp.position.set(cx, cy, cz);
  g.add(grp);
  for (let r = 0; r < rows; r++) {
    for (let cc = 0; cc < cols; cc++) {
      const px = -((cols - 1) * 0.34) / 2 + cc * 0.34;
      const pz = r * 0.3;
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.012, 0.22), M.solarPanel);
      panel.position.set(px, 0.12, pz);
      panel.rotation.x = -0.4;
      grp.add(panel);
      for (let k = 0; k < 3; k++) {
        box(grp, `cell ${r}_${cc}_${k}`, px - 0.1 + k * 0.1, 0.125, pz, 0.004, 0.004, 0.2, mat('#0a1a3a'));
      }
      cyl(grp, `solar post ${r}_${cc}`, px, 0.06, pz, 0.012, 0.1, M.metalDark, 8);
    }
  }
  return grp;
}

function createControlCenter(g: THREE.Group, cx: number, cy: number, cz: number) {
  const grp = new THREE.Group();
  grp.position.set(cx, cy, cz);
  g.add(grp);
  const W = 2.0, H = 1.2, D = 1.4;
  box(grp, 'hq body', 0, H / 2, 0, W, H, D, M.neeDark);
  box(grp, 'hq base', 0, 0.06, 0, W + 0.2, 0.12, D + 0.2, M.platform);
  box(grp, 'hq roof', 0, H + 0.03, 0, W + 0.06, 0.06, D + 0.06, M.neeNavy);
  const logoTex = makeNeeLogoTexture();
  texturedPlane(grp, logoTex, 0, H * 0.55, D / 2 + 0.012, 1.5, 0.55, 0, 1.2);
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 9; col++) {
      const wx = -W / 2 + 0.18 + col * 0.21;
      const wy = 0.2 + row * 0.2;
      const lit = (row * 9 + col) % 4 !== 0;
      if (row !== 2) {
        box(grp, `hq win F ${row}_${col}`, wx, wy, D / 2 + 0.006, 0.17, 0.15, 0.008, lit ? M.glassWarm : M.glass);
      }
      const wz = -D / 2 + 0.18 + col * 0.14;
      box(grp, `hq win L ${row}_${col}`, -W / 2 - 0.006, wy, wz, 0.008, 0.15, 0.11, lit ? M.glassWarm : M.glass);
      box(grp, `hq win R ${row}_${col}`, W / 2 + 0.006, wy, wz, 0.008, 0.15, 0.11, lit ? M.glassWarm : M.glass);
    }
  }
  return grp;
}

function createBatteryYard(g: THREE.Group, cx: number, cy: number, cz: number) {
  const grp = new THREE.Group();
  grp.position.set(cx, cy, cz);
  g.add(grp);
  box(grp, 'bat pad', 0, 0.04, 0, 2.0, 0.08, 0.8, M.neeNavy);
  const glows: THREE.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const bx = -0.7 + i * 0.48;
    box(grp, `bat container ${i}`, bx, 0.24, 0, 0.42, 0.3, 0.6, M.battery);
    box(grp, `bat ridge ${i}`, bx, 0.4, 0, 0.42, 0.02, 0.6, M.metalDark);
    const bolt = box(grp, `bat bolt ${i}`, bx, 0.24, 0.305, 0.14, 0.18, 0.008, M.batteryGlow);
    glows.push(bolt);
    const tex = makeFacadeTextTexture('ENERGY', '#0e1a24', '#8aff5a');
    texturedPlane(grp, tex, bx, 0.36, 0.306, 0.34, 0.06, 0, 0.6);
  }
  return { group: grp, glows };
}

function createTransmissionTower(g: THREE.Group, x: number, y: number, z: number, scale = 1) {
  const grp = new THREE.Group();
  grp.position.set(x, y, z); grp.scale.setScalar(scale);
  g.add(grp);
  const legs: [number, number][] = [[-0.12, -0.12], [0.12, -0.12], [-0.12, 0.12], [0.12, 0.12]];
  legs.forEach(([lx, lz], i) => {
    const leg = cyl(grp, `tower leg ${i}`, lx * 0.5, 0.45, lz * 0.5, 0.012, 0.9, M.steel, 6);
    leg.position.set(lx, 0.45, lz);
  });
  box(grp, 'tower arm 1', 0, 0.7, 0, 0.5, 0.02, 0.04, M.steel);
  box(grp, 'tower arm 2', 0, 0.85, 0, 0.4, 0.02, 0.04, M.steel);
  box(grp, 'tower body', 0, 0.45, 0, 0.18, 0.9, 0.18, mat('#a0aab0', { roughness: .4, metalness: .6, transparent: true, opacity: 0.3 }));
  return grp;
}

function createHouse(g: THREE.Group, x: number, y: number, z: number, scale = 1) {
  const grp = new THREE.Group();
  grp.position.set(x, y, z); grp.scale.setScalar(scale);
  g.add(grp);
  box(grp, 'house body', 0, 0.12, 0, 0.3, 0.24, 0.26, M.neeDark);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.12, 4), M.houseRoof);
  roof.position.set(0, 0.3, 0);
  roof.rotation.y = Math.PI / 4;
  grp.add(roof);
  const win = box(grp, 'house win', 0, 0.13, 0.131, 0.18, 0.12, 0.008, M.glassWarm);
  return { group: grp, win };
}

function buildNextEraDiorama() {
  const g = new THREE.Group();
  box(g, 'plinth', 0, -0.13, 0, gx(7.6), .26, gx(6.0), M.base);
  box(g, 'platform', 0, .02, 0, gx(7.1), .12, gx(5.6), M.platform);
  box(g, 'road front', 0, 0.084, 1.6, gx(6.5), 0.012, gx(0.45), M.road);
  box(g, 'road ring', 0, 0.084, 0.3, gx(5.0), 0.012, gx(0.4), M.road);

  const turbineRotors: THREE.Group[] = [];
  const t1 = createTurbine(g, -2.8, 0.08, -2.0, 1.0);
  const t2 = createTurbine(g, -1.9, 0.08, -2.4, 0.85);
  const t3 = createTurbine(g, -3.4, 0.08, -1.3, 0.75);
  [t1, t2, t3].forEach(t => turbineRotors.push(t.rotor));

  createSolarArray(g, 2.4, 0.08, -2.0, 3, 4);
  createControlCenter(g, 0, 0.08, -1.0);
  const battery = createBatteryYard(g, -1.0, 0.08, 1.0);

  createTransmissionTower(g, 2.2, 0.08, 0.2, 1.0);
  createTransmissionTower(g, 3.2, 0.08, 1.4, 0.9);

  const powerLineBeads: THREE.Mesh[] = [];
  const linePts: [number, number, number][] = [
    [0, 0.9, -0.4], [2.2, 0.85, 0.2], [3.2, 0.78, 1.4], [3.6, 0.5, 2.2],
  ];
  for (let i = 0; i < 8; i++) {
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), M.neeCyanHot);
    bead.name = `power bead ${i}`;
    bead.userData.points = linePts;
    bead.userData.offset = i / 8;
    g.add(bead);
    powerLineBeads.push(bead);
  }

  const houseGlows: THREE.Mesh[] = [];
  const houseSpots: [number, number, number][] = [
    [2.6, 0.08, 1.0], [3.0, 0.08, 1.8], [2.2, 0.08, 2.2], [3.4, 0.08, 2.6], [1.8, 0.08, 1.6],
  ];
  houseSpots.forEach(([hx, hy, hz]) => {
    const h = createHouse(g, hx, hy, hz, 1.0);
    houseGlows.push(h.win);
  });

  const treeSpots: [number, number][] = [[-3.8, 0.6], [-2.4, 1.8], [0.6, 1.8], [1.2, -2.2], [-0.8, -2.4]];
  treeSpots.forEach(([x, z]) => tree(g, x, z, 0.4));

  rooftopPanel(g, '1', 'Renewable Gen.', '풍력·태양광 발전', -2.8, 1.9, -2.0, 1.0, 0.36, '#5ac43a');
  rooftopPanel(g, '2', 'Energy Storage', '배터리 저장으로\n안정성 확보', -1.0, 1.0, 1.0, 1.0, 0.36, '#8aff5a');
  rooftopPanel(g, '3', 'Grid Transmission', '전력망 송전', 2.7, 1.2, 0.2, 1.0, 0.36, '#4ad9ff');
  rooftopPanel(g, '4', 'Utility Customers', '가정·기업에\n전력 공급', 2.8, 0.9, 1.8, 1.0, 0.36, '#2a8ad8');

  const hqGlow = new THREE.PointLight('#cfe8ff', 1.1, 5);
  hqGlow.position.set(0, 1.2, -1.0);
  g.add(hqGlow);
  const batGlow = new THREE.PointLight('#8aff5a', 0.9, 3.5);
  batGlow.position.set(-1.0, 0.7, 1.0);
  g.add(batGlow);
  const lineGlow = new THREE.PointLight('#5de0ff', 0.7, 4.0);
  lineGlow.position.set(2.5, 0.9, 0.8);
  g.add(lineGlow);
  const greenGlow = new THREE.PointLight('#5ac43a', 0.5, 4.0);
  greenGlow.position.set(-2.5, 1.2, -1.5);
  g.add(greenGlow);

  g.userData = {
    turbineRotors,
    powerLineBeads,
    batteryGlows: battery.glows,
    houseGlows,
  };
  return g;
}

function setBeadOnPath(bead: THREE.Mesh, frac: number) {
  const pts = bead.userData.points as [number, number, number][];
  const segCount = pts.length - 1;
  const scaled = frac * segCount;
  const seg = Math.min(Math.floor(scaled), segCount - 1);
  const local = scaled - seg;
  const [x1, y1, z1] = pts[seg];
  const [x2, y2, z2] = pts[seg + 1];
  bead.position.set(x1 + (x2 - x1) * local, y1 + (y2 - y1) * local, z1 + (z2 - z1) * local);
}

export function createNextEra(): THREE.Group {
  const root = buildNextEraDiorama();
  const SPEED = 0.4;
  root.userData.tick = (time: number) => {
    const t = time * SPEED;
    const tRaw = time;
    const u = root.userData as NextEraRuntime;

    if (u.turbineRotors) {
      u.turbineRotors.forEach((rotor, i) => {
        rotor.rotation.z = tRaw * (0.8 + i * 0.15);
      });
    }

    if (u.powerLineBeads) {
      u.powerLineBeads.forEach((bead, i) => {
        const frac = ((tRaw * 0.14) + i / u.powerLineBeads.length) % 1;
        setBeadOnPath(bead, frac);
        (bead.material as THREE.MeshStandardMaterial).emissiveIntensity =
          1.2 + 0.5 * Math.sin(tRaw * 3 + i);
      });
    }

    if (u.batteryGlows) {
      u.batteryGlows.forEach((m, i) => {
        (m.material as THREE.MeshStandardMaterial).emissiveIntensity =
          0.9 + 0.5 * Math.sin(tRaw * 2 + i * 0.6);
      });
    }

    if (u.houseGlows) {
      u.houseGlows.forEach((m, i) => {
        (m.material as THREE.MeshStandardMaterial).emissiveIntensity =
          0.6 + 0.3 * Math.sin(tRaw * 1.2 + i * 0.9);
      });
    }

    root.rotation.y = Math.sin(t * 0.15) * 0.008;
  };
  return root;
}
