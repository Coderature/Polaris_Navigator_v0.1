// @ts-nocheck — Celltrion (068270) & Samsung Biologics (207940) dioramas.
import * as THREE from 'three';

/**
 * 바이오/제약 디오라마 (간단 버전) — 2개 빌더.
 *   - createCelltrion()        셀트리온 (068270)
 *   - createSamsungBiologics()  삼성바이오로직스 (207940)
 * 빌더 표준: 무인자 ()=>THREE.Group, three만 import, GROUND_XZ=1.25 + gx(),
 *           root.userData.tick=(time:number)=>, v4 톤.
 * 공통 컨셉: 바이오리액터 탱크 + 연구/생산동 + 배양 펄스. 색·배치로 두 회사 구분.
 */

const GROUND_XZ = 1.25;
const gx = (n: number) => n * GROUND_XZ;

function mat(color: number, o: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.2, ...o });
}

function box(
  g: THREE.Group,
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
  sz: number,
  m: THREE.Material,
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  g.add(mesh);
  return mesh;
}

function cyl(
  g: THREE.Group,
  x: number,
  y: number,
  z: number,
  rT: number,
  rB: number,
  h: number,
  m: THREE.Material,
  seg = 20,
) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rT, rB, h, seg), m);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  g.add(mesh);
  return mesh;
}

function buildBioDiorama(
  palette: {
    plinth: number;
    platform: number;
    building: number;
    glass: number;
    tank: number;
    tankGlow: number;
    warm: number;
    accent: number;
  },
  tankCount: number,
): THREE.Group {
  const g = new THREE.Group();

  box(g, 0, -0.12, 0, gx(7.0), 0.24, gx(7.0), mat(palette.plinth, { roughness: 0.9 }));
  box(g, 0, 0.01, 0, gx(6.4), 0.06, gx(6.4), mat(palette.platform, { roughness: 0.85 }));

  box(g, gx(-1.7), 0.9, gx(-1.3), gx(2.2), 1.7, gx(2.0), mat(palette.building, { roughness: 0.6, metalness: 0.3 }));
  box(
    g,
    gx(-1.7),
    0.95,
    gx(-0.3),
    gx(2.0),
    1.2,
    0.04,
    mat(palette.glass, {
      roughness: 0.15,
      metalness: 0.6,
      transparent: true,
      opacity: 0.5,
      emissive: palette.glass,
      emissiveIntensity: 0.16,
    }),
  );
  box(g, gx(-1.7), 1.8, gx(-1.3), gx(2.3), 0.12, gx(2.1), mat(palette.platform));

  const tanks: THREE.Mesh[] = [];
  for (let i = 0; i < tankCount; i++) {
    const x = gx(0.6 + i * 0.85);
    cyl(g, x, 0.9, gx(-0.6), 0.32, 0.32, 1.6, mat(palette.tank, { metalness: 0.5, roughness: 0.35 }), 22);
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      mat(palette.tank, { metalness: 0.5, roughness: 0.35 }),
    );
    dome.position.set(x, 1.7, gx(-0.6));
    g.add(dome);
    const glow = cyl(
      g,
      x,
      0.7,
      gx(-0.6) + 0.34,
      0.08,
      0.08,
      0.5,
      mat(palette.tankGlow, { emissive: palette.tankGlow, emissiveIntensity: 0.6, roughness: 0.4 }),
      12,
    );
    glow.rotation.x = Math.PI / 2;
    tanks.push(glow);
  }

  for (let i = 0; i < tankCount - 1; i++) {
    const x = gx(0.6 + i * 0.85) + gx(0.42);
    const pipe = cyl(g, x, 0.5, gx(-0.6), 0.04, 0.04, gx(0.7), mat(palette.platform, { metalness: 0.6 }), 8);
    pipe.rotation.z = Math.PI / 2;
  }

  const warm = new THREE.PointLight(palette.warm, 0.55, 8, 2);
  warm.position.set(gx(-1.7), 2.4, gx(-0.3));
  g.add(warm);
  const acc = new THREE.PointLight(palette.accent, 0.4, 6, 2);
  acc.position.set(gx(1.2), 1.6, gx(-0.6));
  g.add(acc);

  g.userData = { tanks };
  return g;
}

function attachTick(root: THREE.Group) {
  root.userData.tick = (time: number) => {
    const u = root.userData as { tanks: THREE.Mesh[] };
    u.tanks?.forEach((t, i) => {
      const m = t.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 0.5 + Math.abs(Math.sin(time * 1.5 + i * 0.6)) * 0.35;
    });
    root.rotation.y = Math.sin(time * 0.3) * 0.005;
  };
}

export function createCelltrion(): THREE.Group {
  const root = buildBioDiorama(
    {
      plinth: 0x2a3340,
      platform: 0x39434f,
      building: 0x46505c,
      glass: 0x8fd4a8,
      tank: 0x9aa4b0,
      tankGlow: 0x2bd47a,
      warm: 0xfff2c8,
      accent: 0x18b85a,
    },
    4,
  );
  attachTick(root);
  return root;
}

export function createSamsungBiologics(): THREE.Group {
  const root = buildBioDiorama(
    {
      plinth: 0x2a3340,
      platform: 0x39434f,
      building: 0x42505f,
      glass: 0x7fb4d4,
      tank: 0xaab4c0,
      tankGlow: 0x3a7bd5,
      warm: 0xfff2c8,
      accent: 0x1428a0,
    },
    5,
  );
  attachTick(root);
  return root;
}
