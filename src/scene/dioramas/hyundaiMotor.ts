// @ts-nocheck — Hyundai Motor (005380) automotive plant diorama.
import * as THREE from 'three';

/**
 * 현대자동차 (005380) — 자동차 제조 디오라마 (간단 버전).
 * 빌더 표준: createHyundaiMotor(): THREE.Group, three만 import,
 * GROUND_XZ=1.25 + gx(), root.userData.tick=(time:number)=>, v4 톤.
 * 구성: 공장동 + 조립 컨베이어(완성차 이동) + 완성차 야적 + 출하.
 */

const GROUND_XZ = 1.25;
const gx = (n: number) => n * GROUND_XZ;

const COL = {
  plinth: 0x2a3340,
  platform: 0x39434f,
  factory: 0x4a5562,
  glass: 0x6fb7c9,
  roof: 0x5b636e,
  conveyor: 0x2f3742,
  carBody: 0x2b6cb0,
  carBody2: 0xc0c8d0,
  road: 0x3b444f,
  warm: 0xfff2c8,
  accent: 0x00a0e0,
};

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

function makeCar(color: number): THREE.Group {
  const car = new THREE.Group();
  box(car, 0, 0.12, 0, 0.42, 0.14, 0.22, mat(color, { metalness: 0.4, roughness: 0.4 }));
  box(car, -0.02, 0.24, 0, 0.24, 0.12, 0.2, mat(color, { metalness: 0.4, roughness: 0.4 }));
  for (const [wx, wz] of [
    [0.14, 0.12],
    [-0.14, 0.12],
    [0.14, -0.12],
    [-0.14, -0.12],
  ] as const) {
    const w = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.028, 8, 14), mat(0x1c2026, { roughness: 0.9 }));
    w.position.set(wx, 0.06, wz);
    w.rotation.y = Math.PI / 2;
    car.add(w);
  }
  return car;
}

function buildHyundaiDiorama(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'hyundaiDiorama';

  box(g, 0, -0.12, 0, gx(7.0), 0.24, gx(7.0), mat(COL.plinth, { roughness: 0.9 }));
  box(g, 0, 0.01, 0, gx(6.4), 0.06, gx(6.4), mat(COL.platform, { roughness: 0.85 }));
  box(g, 0, 0.06, gx(1.2), gx(5.6), 0.02, gx(0.9), mat(COL.road, { roughness: 1.0 }));

  box(g, gx(-1.8), 0.85, gx(-1.4), gx(2.2), 1.6, gx(2.0), mat(COL.factory, { roughness: 0.6, metalness: 0.3 }));
  box(g, gx(-1.8), 1.7, gx(-1.4), gx(2.3), 0.12, gx(2.1), mat(COL.roof));
  box(
    g,
    gx(-1.8),
    0.9,
    gx(-0.4),
    gx(2.0),
    1.1,
    0.04,
    mat(COL.glass, {
      roughness: 0.15,
      metalness: 0.6,
      transparent: true,
      opacity: 0.5,
      emissive: COL.glass,
      emissiveIntensity: 0.15,
    }),
  );

  const conveyor = box(g, gx(0.6), 0.16, gx(-1.4), gx(4.2), 0.1, gx(0.5), mat(COL.conveyor, { roughness: 0.85 }));
  conveyor.name = 'conveyor';

  const lineCars: THREE.Group[] = [];
  for (let i = 0; i < 3; i++) {
    const c = makeCar(i % 2 ? COL.carBody2 : COL.carBody);
    c.position.set(gx(-1.0 + i * 1.2), 0.22, gx(-1.4));
    c.scale.setScalar(0.85);
    g.add(c);
    lineCars.push(c);
  }

  for (let r = 0; r < 2; r++) {
    for (let c2 = 0; c2 < 3; c2++) {
      const car = makeCar(c2 % 2 ? COL.carBody : COL.carBody2);
      car.position.set(gx(1.4 + c2 * 0.6), 0.06, gx(0.4 + r * 0.7));
      car.scale.setScalar(0.7);
      g.add(car);
    }
  }

  const warm = new THREE.PointLight(COL.warm, 0.55, 8, 2);
  warm.position.set(gx(-1.8), 2.4, gx(-0.4));
  g.add(warm);
  const blue = new THREE.PointLight(COL.accent, 0.4, 6, 2);
  blue.position.set(gx(0.6), 1.4, gx(-1.4));
  g.add(blue);

  g.userData = { conveyor, lineCars };
  return g;
}

export function createHyundaiMotor(): THREE.Group {
  const root = buildHyundaiDiorama();

  root.userData.tick = (time: number) => {
    const u = root.userData as { conveyor: THREE.Mesh; lineCars: THREE.Group[] };
    u.lineCars?.forEach((car, i) => {
      const span = gx(4.0);
      const start = gx(-1.8);
      const p = (time * 0.15 + i * 0.4) % 1;
      car.position.x = start + span * p;
    });
    root.rotation.y = Math.sin(time * 0.3) * 0.005;
  };

  return root;
}
