// @ts-nocheck — KB Financial (105560) holding-company diorama.
import * as THREE from 'three';

/**
 * KB금융 (105560) — 금융지주 디오라마 (간단 버전).
 * 빌더 표준: createKbFinancial(): THREE.Group, three만 import,
 *           GROUND_XZ=1.25 + gx(), root.userData.tick=(time:number)=>, v4 톤.
 * 구성: 본점 타워 + 금고(Vault) + 지점 + 금융 데이터 펄스. KB 옐로 액센트.
 */

const GROUND_XZ = 1.25;
const gx = (n: number) => n * GROUND_XZ;

const COL = {
  plinth: 0x2a3340,
  platform: 0x39434f,
  tower: 0x44506a,
  glass: 0x8fb7d4,
  vault: 0x6b7280,
  vaultDoor: 0x8a93a0,
  branch: 0x4a5562,
  road: 0x3b444f,
  warm: 0xfff2c8,
  kbYellow: 0xffc800,
  accent: 0xffb600,
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

function buildKbDiorama(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'kbDiorama';

  box(g, 0, -0.12, 0, gx(7.0), 0.24, gx(7.0), mat(COL.plinth, { roughness: 0.9 }));
  box(g, 0, 0.01, 0, gx(6.4), 0.06, gx(6.4), mat(COL.platform, { roughness: 0.85 }));
  box(g, 0, 0.06, gx(1.3), gx(5.4), 0.02, gx(0.8), mat(COL.road, { roughness: 1.0 }));

  box(g, gx(-1.8), 1.5, gx(-1.2), gx(1.6), 3.0, gx(1.6), mat(COL.tower, { roughness: 0.5, metalness: 0.4 }));
  box(
    g,
    gx(-1.8),
    1.5,
    gx(-0.4),
    gx(1.4),
    2.8,
    0.04,
    mat(COL.glass, {
      roughness: 0.12,
      metalness: 0.7,
      transparent: true,
      opacity: 0.55,
      emissive: COL.glass,
      emissiveIntensity: 0.18,
    }),
  );
  const sign = box(
    g,
    gx(-1.8),
    3.1,
    gx(-1.2),
    gx(0.7),
    0.3,
    0.12,
    mat(COL.kbYellow, { emissive: COL.kbYellow, emissiveIntensity: 0.7, roughness: 0.4 }),
  );
  sign.name = 'kbSign';

  box(g, gx(0.6), 0.7, gx(-1.0), gx(1.5), 1.3, gx(1.3), mat(COL.vault, { metalness: 0.4, roughness: 0.6 }));
  const vaultDoor = cyl(
    g,
    gx(0.6),
    0.7,
    gx(-0.35),
    0.5,
    0.5,
    0.12,
    mat(COL.vaultDoor, { metalness: 0.7, roughness: 0.3 }),
    28,
  );
  vaultDoor.rotation.x = Math.PI / 2;
  vaultDoor.name = 'vaultDoor';
  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.04, 8, 18),
    mat(COL.kbYellow, { metalness: 0.6, roughness: 0.4 }),
  );
  handle.position.set(gx(0.6), 0.7, gx(-0.28));
  g.add(handle);

  for (let i = 0; i < 2; i++) {
    box(g, gx(1.9), 0.5, gx(-0.3 + i * 0.9), gx(0.9), 0.9, gx(0.7), mat(COL.branch, { roughness: 0.6 }));
    box(
      g,
      gx(1.9),
      0.6,
      gx(-0.3 + i * 0.9) + gx(0.36),
      gx(0.7),
      0.5,
      0.03,
      mat(COL.glass, { roughness: 0.15, metalness: 0.6, transparent: true, opacity: 0.5 }),
    );
  }

  const leds: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const led = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 8),
      mat(COL.accent, { emissive: COL.accent, emissiveIntensity: 0.6 }),
    );
    led.position.set(gx(-1.8) - gx(0.5) + i * gx(0.25), 0.5 + i * 0.4, gx(-0.36));
    g.add(led);
    leds.push(led);
  }

  const warm = new THREE.PointLight(COL.warm, 0.55, 9, 2);
  warm.position.set(gx(-1.8), 3.0, gx(-0.4));
  g.add(warm);
  const yellow = new THREE.PointLight(COL.kbYellow, 0.4, 6, 2);
  yellow.position.set(gx(0.6), 1.4, gx(-0.4));
  g.add(yellow);

  g.userData = { sign, vaultDoor, leds };
  return g;
}

export function createKbFinancial(): THREE.Group {
  const root = buildKbDiorama();

  root.userData.tick = (time: number) => {
    const u = root.userData as { sign: THREE.Mesh; vaultDoor: THREE.Mesh; leds: THREE.Mesh[] };
    if (u.sign) {
      const m = u.sign.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 0.6 + Math.sin(time * 1.5) * 0.2;
    }
    if (u.vaultDoor) u.vaultDoor.rotation.y = time * 0.3;
    u.leds?.forEach((led, i) => {
      const m = led.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 0.4 + Math.abs(Math.sin(time * 2.0 + i * 0.5)) * 0.5;
    });
    root.rotation.y = Math.sin(time * 0.3) * 0.005;
  };

  return root;
}
