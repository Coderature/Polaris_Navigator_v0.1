// @ts-nocheck — Kakao (035720) business-model diorama.
import * as THREE from 'three';
import {
  GROUND_XZ,
  gx,
  mat,
  box,
  texturedPlane,
  rooftopPanel,
  tree,
  makeFacadeTextTexture,
} from './dioramaCommon';

interface KakaoRuntime {
  hubRing: THREE.Mesh;
  mascot: THREE.Group;
  satelliteGlows: THREE.Mesh[];
  roadGlows: THREE.Mesh[];
}

const C = {
  kakaoYellow: '#ffe300',
  kakaoYellowBright: '#fff35a',
  kakaoGold: '#d4a020',
  kakaoBrown: '#3a1d1d',
  kakaoDark: '#1a1206',
  kakaoNavy: '#241a08',
  glass: '#6a5a2a',
  glassWarm: '#fff0a0',
  glassGold: '#e0b800',
  metalDark: '#3a3a40',
  metal: '#7a7a80',
  silver: '#c8c8cc',
  road: '#1c1e22',
  base: '#08090d',
  platform: '#15171c',
  white: '#f0f3f3',
  mascotTan: '#e0a868',
  mascotDark: '#5a3a1a',
};

const M = {
  kakaoYellow: mat(C.kakaoYellow, { roughness: 0.35, emissive: C.kakaoYellow, emissiveIntensity: 0.4 }),
  kakaoYellowHot: mat(C.kakaoYellowBright, { emissive: C.kakaoYellowBright, emissiveIntensity: 1.4, roughness: 0.25 }),
  kakaoGold: mat(C.kakaoGold, { roughness: 0.35, metalness: 0.4 }),
  kakaoBrown: mat(C.kakaoBrown, { roughness: 0.5 }),
  kakaoDark: mat(C.kakaoDark, { roughness: 0.5 }),
  kakaoNavy: mat(C.kakaoNavy, { roughness: 0.5, metalness: 0.2 }),
  metalDark: mat(C.metalDark, { roughness: 0.35, metalness: 0.65 }),
  metal: mat(C.metal, { roughness: 0.35, metalness: 0.55 }),
  silver: mat(C.silver, { roughness: 0.32, metalness: 0.55 }),
  white: mat(C.white, { roughness: 0.4 }),
  glass: mat(C.glass, {
    roughness: 0.15,
    metalness: 0.15,
    transparent: true,
    opacity: 0.55,
    emissive: '#4a3a0a',
    emissiveIntensity: 0.2,
  }),
  glassWarm: mat(C.glassWarm, { emissive: '#fff0a0', emissiveIntensity: 0.8, roughness: 0.25 }),
  glassGold: mat(C.glassGold, {
    roughness: 0.15,
    transparent: true,
    opacity: 0.6,
    emissive: C.glassGold,
    emissiveIntensity: 0.3,
  }),
  road: mat(C.road, { roughness: 0.85 }),
  roadGlow: mat(C.kakaoYellow, { emissive: C.kakaoYellow, emissiveIntensity: 0.9, roughness: 0.4 }),
  base: mat(C.base, { roughness: 0.55 }),
  platform: mat(C.platform, { roughness: 0.65 }),
  mascotTan: mat(C.mascotTan, { roughness: 0.6 }),
  mascotDark: mat(C.mascotDark, { roughness: 0.5 }),
};

function makeKakaoLogoTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 384;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#1a1206';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#ffe300';
  ctx.font = 'bold 220px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('kakao', c.width / 2, c.height / 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function createKakaoHQ(g: THREE.Group, cx: number, cy: number, cz: number) {
  const grp = new THREE.Group();
  grp.position.set(cx, cy, cz);
  g.add(grp);
  const W = 2.0;
  const H = 1.4;
  const D = 1.6;
  box(grp, 'hq body', 0, H / 2, 0, W, H, D, M.kakaoBrown);
  box(grp, 'hq base', 0, 0.06, 0, W + 0.2, 0.12, D + 0.2, M.platform);
  box(grp, 'hq roof', 0, H + 0.03, 0, W + 0.06, 0.06, D + 0.06, M.kakaoNavy);
  const logoTex = makeKakaoLogoTexture();
  texturedPlane(grp, logoTex, 0, H * 0.5, D / 2 + 0.012, 1.5, 0.5, 0, 1.2);
  const glows: THREE.Mesh[] = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 8; col++) {
      const wx = -W / 2 + 0.18 + col * 0.24;
      const wy = 0.22 + row * 0.24;
      const lit = (row * 8 + col) % 4 !== 0;
      if (row !== 2) {
        const w = box(grp, `hq win F ${row}_${col}`, wx, wy, D / 2 + 0.006, 0.2, 0.18, 0.008, lit ? M.glassWarm : M.glass);
        if (lit) glows.push(w);
      }
      const wz = -D / 2 + 0.18 + col * 0.18;
      box(grp, `hq win L ${row}_${col}`, -W / 2 - 0.006, wy, wz, 0.008, 0.18, 0.14, lit ? M.glassWarm : M.glass);
      box(grp, `hq win R ${row}_${col}`, W / 2 + 0.006, wy, wz, 0.008, 0.18, 0.14, lit ? M.glassWarm : M.glass);
    }
  }
  return { group: grp, glows, roofY: H + 0.06 };
}

function createMascot(g: THREE.Group, cx: number, cy: number, cz: number) {
  const grp = new THREE.Group();
  grp.position.set(cx, cy, cz);
  g.add(grp);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 14), M.mascotTan);
  body.position.set(0, 0.16, 0);
  body.scale.set(1, 1.1, 1);
  grp.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 14), M.mascotTan);
  head.position.set(0, 0.4, 0);
  grp.add(head);
  [-0.1, 0.1].forEach((ex) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), M.mascotTan);
    ear.position.set(ex, 0.52, 0);
    grp.add(ear);
  });
  [-0.05, 0.05].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), M.mascotDark);
    eye.position.set(ex, 0.42, 0.15);
    grp.add(eye);
  });
  return grp;
}

function createPlatformHub(g: THREE.Group, cx: number, cy: number, cz: number) {
  const grp = new THREE.Group();
  grp.position.set(cx, cy, cz);
  g.add(grp);
  box(grp, 'hub pad', 0, 0.02, 0, 0.85, 0.04, 0.85, M.kakaoNavy);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 10, 40), M.kakaoYellowHot);
  ring.name = 'hub ring';
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, 0.06, 0);
  grp.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.015, 8, 32), M.kakaoYellow);
  ring2.rotation.x = Math.PI / 2;
  ring2.position.set(0, 0.05, 0);
  grp.add(ring2);
  const tex = makeFacadeTextTexture('kakao', '#1a1206', '#ffe300');
  texturedPlane(grp, tex, 0, 0.08, 0, 0.5, 0.12, 0, 0.8);
  return { group: grp, ring };
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
  box(grp, `sat body ${label}`, 0, H / 2, 0, w, H, d, M.kakaoDark);
  box(grp, `sat roof ${label}`, 0, H + 0.02, 0, w + 0.04, 0.04, d + 0.04, mat(color, { emissive: color, emissiveIntensity: 0.35 }));
  box(grp, `sat base ${label}`, 0, 0.03, 0, w + 0.06, 0.05, d + 0.06, M.platform);
  const tex = makeFacadeTextTexture(label, '#1a1206', color);
  texturedPlane(grp, tex, 0, H * 0.6, d / 2 + 0.008, w * 0.85, 0.14, 0, 0.7);
  for (let i = 0; i < 3; i++) {
    box(grp, `sat win ${label} ${i}`, -w / 3 + (i * w) / 3, H * 0.3, d / 2 + 0.006, 0.16, 0.12, 0.008, M.glassWarm);
  }
  return grp;
}

function buildKakaoDiorama() {
  const g = new THREE.Group();
  box(g, 'plinth', 0, -0.13, 0, gx(7.4), 0.26, gx(6.0), M.base);
  box(g, 'platform', 0, 0.02, 0, gx(6.9), 0.12, gx(5.6), M.platform);

  const roadGlows: THREE.Mesh[] = [];
  const roadDefs: [number, number, number, number][] = [
    [0, 1.2, gx(5.5), gx(0.18)],
    [-2.0, 0, gx(0.18), gx(3.5)],
    [2.0, 0, gx(0.18), gx(3.5)],
    [0, -0.8, gx(3.0), gx(0.16)],
  ];
  roadDefs.forEach(([rx, rz, rw, rd], i) => {
    box(g, `road base ${i}`, rx, 0.083, rz, rw, 0.012, rd, M.road);
    const glow = box(g, `road glow ${i}`, rx, 0.09, rz, rw * 0.5, 0.006, rd * 0.5, M.roadGlow);
    roadGlows.push(glow);
  });

  const hq = createKakaoHQ(g, 0, 0.08, -1.0);
  const mascot = createMascot(g, 0, 0.08 + hq.roofY + 1.4, -1.0);
  const hub = createPlatformHub(g, 0, 0.08, 0.8);

  const satGlows: THREE.Mesh[] = [];
  const sats = [
    { label: 'Talk', color: '#ffe300', x: -2.6, z: -1.4 },
    { label: 'Content', color: '#fff35a', x: 0.0, z: -2.6 },
    { label: 'Mobility', color: '#e0b800', x: 2.6, z: -1.4 },
    { label: 'Commerce', color: '#ffe300', x: -3.0, z: 0.4 },
    { label: 'Pay', color: '#fff35a', x: 3.0, z: 0.4 },
    { label: 'Games', color: '#e0b800', x: -1.4, z: 2.4 },
    { label: 'Cloud', color: '#d4a020', x: 1.4, z: 2.4 },
  ];
  sats.forEach((s) => {
    const grp = createSatellite(g, s.x, 0.08, s.z, s.label, s.color, 0.9, 0.7);
    grp.traverse((o) => {
      if (o instanceof THREE.Mesh && o.name.startsWith(`sat roof ${s.label}`)) satGlows.push(o);
    });
  });

  const treeSpots: [number, number][] = [
    [-1.2, -0.4],
    [1.2, -0.4],
    [-1.2, 1.6],
    [1.2, 1.6],
    [-3.6, 2.4],
    [3.6, 2.4],
  ];
  treeSpots.forEach(([x, z]) => tree(g, x, z, 0.4));

  rooftopPanel(g, '1', 'Communication', '카카오톡\n국민 메신저', -2.6, 1.0, -1.4, 1.0, 0.36, '#ffe300');
  rooftopPanel(g, '2', 'Content', '카카오페이지·멜론\n다양한 콘텐츠', 0.0, 1.05, -2.6, 1.0, 0.36, '#fff35a');
  rooftopPanel(g, '3', 'Mobility', '카카오 T\n이동의 모든 순간', 2.6, 1.0, -1.4, 1.0, 0.36, '#e0b800');
  rooftopPanel(g, '4', 'Fintech', '카카오페이\n간편하고 안전한 금융', 3.0, 1.0, 0.4, 1.0, 0.36, '#fff35a');

  const hqGlow = new THREE.PointLight('#fff0a0', 1.2, 5);
  hqGlow.position.set(0, 1.2, -1.0);
  g.add(hqGlow);
  const hubGlow = new THREE.PointLight('#ffe300', 1.0, 3.5);
  hubGlow.position.set(0, 0.6, 0.8);
  g.add(hubGlow);
  const yellowGlow = new THREE.PointLight('#fff35a', 0.6, 4.5);
  yellowGlow.position.set(0, 0.5, 0.5);
  g.add(yellowGlow);

  g.userData = {
    hubRing: hub.ring,
    mascot,
    satelliteGlows: hq.glows.concat(satGlows),
    roadGlows,
  };
  return g;
}

export function createKakao(): THREE.Group {
  const root = buildKakaoDiorama();
  const SPEED = 0.4;
  root.userData.tick = (time: number) => {
    const t = time * SPEED;
    const tRaw = time;
    const u = root.userData as KakaoRuntime;

    if (u.hubRing) {
      u.hubRing.rotation.z = tRaw * 0.7;
      (u.hubRing.material as THREE.MeshStandardMaterial).emissiveIntensity =
        1.0 + 0.6 * Math.sin(tRaw * 2.5);
    }
    if (u.mascot) {
      u.mascot.rotation.y = Math.sin(tRaw * 0.5) * 0.3;
    }
    if (u.satelliteGlows) {
      u.satelliteGlows.forEach((m, i) => {
        (m.material as THREE.MeshStandardMaterial).emissiveIntensity =
          0.6 + 0.3 * Math.sin(tRaw * 1.5 + i * 0.5);
      });
    }
    if (u.roadGlows) {
      u.roadGlows.forEach((m, i) => {
        (m.material as THREE.MeshStandardMaterial).emissiveIntensity =
          0.7 + 0.4 * Math.sin(tRaw * 2 + i * 0.8);
      });
    }

    root.rotation.y = Math.sin(t * 0.15) * 0.008;
  };
  return root;
}
