// @ts-nocheck — Albemarle (ALB) lithium value-chain diorama; DESIGN builder pattern.
import * as THREE from 'three';

/**
 * Albemarle (ALB) — Lithium value-chain diorama.
 *
 * 디오라마 빌더 표준 패턴 (DESIGN repo 호환):
 *   - 무인자 팩토리: createAlbemarle(): THREE.Group
 *   - three 만 import
 *   - 로컬 좌표 기준 GROUND_XZ = 1.25, gx() 사용
 *   - root.userData = { ...refs } 후 root.userData.tick = (time:number) => ...
 *   - tick 인자는 절대시각(초). v4 톤: 강한 네온/마젠타/분홍 금지, 떠다니는 코인/비드 금지.
 *
 * 가치사슬 3단계: ① 염호/광산 채굴 → ② 정제(킬른) → ③ 배터리 소재 출하
 */

const GROUND_XZ = 1.25;
const gx = (n: number) => n * GROUND_XZ;

const COL = {
  plinth:   0x2a3340,
  platform: 0x39434f,
  brineA:   0x2bb6a8,
  brineB:   0x1f8f86,
  metal:    0x8a93a0,
  metalDk:  0x5b636e,
  kiln:     0xb7723a,
  kilnHot:  0xff7a3c,
  building: 0x46505c,
  glass:    0x6fb7c9,
  road:     0x3b444f,
  crystal:  0xd8f3ef,
  warm:     0xfff2c8,
  accent:   0x2bb6a8,
};

function mat(color: number, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.2, ...opts });
}

function box(
  g: THREE.Group, name: string,
  x: number, y: number, z: number,
  sx: number, sy: number, sz: number,
  material: THREE.Material,
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  g.add(mesh);
  return mesh;
}

function cyl(
  g: THREE.Group, name: string,
  x: number, y: number, z: number,
  rTop: number, rBot: number, h: number,
  material: THREE.Material, seg = 20,
) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  g.add(mesh);
  return mesh;
}

function buildEnvironment(g: THREE.Group) {
  box(g, 'plinth', 0, -0.12, 0, gx(7.2), 0.24, gx(7.2), mat(COL.plinth, { roughness: 0.9 }));
  box(g, 'platform', 0, 0.01, 0, gx(6.6), 0.06, gx(6.6), mat(COL.platform, { roughness: 0.85 }));
  box(g, 'road', 0, 0.06, gx(0.2), gx(6.0), 0.02, gx(0.9), mat(COL.road, { roughness: 1.0 }));
}

function buildBrinePonds(g: THREE.Group) {
  const grp = new THREE.Group();
  grp.name = 'brinePonds';
  const ponds: THREE.Mesh[] = [];
  const baseX = gx(-2.2);
  for (let i = 0; i < 3; i++) {
    const z = gx(-1.4 + i * 1.3);
    box(grp, `pondRim${i}`, baseX, 0.08, z, gx(1.5), 0.1, gx(1.0), mat(COL.metalDk, { roughness: 0.8 }));
    const water = box(
      grp, `pond${i}`, baseX, 0.14, z, gx(1.34), 0.04, gx(0.84),
      mat(i % 2 ? COL.brineB : COL.brineA, { roughness: 0.25, metalness: 0.3, emissive: COL.brineB, emissiveIntensity: 0.12 }),
    );
    ponds.push(water);
  }
  const pumpArm = box(grp, 'pumpArm', baseX + gx(1.3), 0.55, gx(-1.4), 0.12, 0.12, gx(1.1), mat(COL.metal));
  cyl(grp, 'pumpBase', baseX + gx(1.3), 0.3, gx(-1.4), 0.14, 0.18, 0.5, mat(COL.metalDk));
  g.add(grp);
  return { ponds, pumpArm };
}

function buildRefinery(g: THREE.Group) {
  const grp = new THREE.Group();
  grp.name = 'refinery';
  grp.position.set(0, 0, gx(0.2));

  box(grp, 'refineryBody', 0, 0.7, gx(-0.1), gx(1.4), 1.3, gx(1.4), mat(COL.building, { roughness: 0.6, metalness: 0.4 }));
  box(grp, 'refineryGlass', 0, 0.8, gx(0.6), gx(1.2), 0.9, 0.04,
    mat(COL.glass, { roughness: 0.15, metalness: 0.6, transparent: true, opacity: 0.55, emissive: COL.glass, emissiveIntensity: 0.18 }));

  const kiln = cyl(grp, 'kiln', gx(0.1), 1.55, gx(-0.1), 0.26, 0.26, gx(2.0), mat(COL.kiln, { metalness: 0.5, roughness: 0.5 }), 24);
  kiln.rotation.z = Math.PI / 2;
  kiln.rotation.x = 0.12;

  const kilnGlow = cyl(grp, 'kilnGlow', gx(1.05), 1.6, gx(-0.1), 0.2, 0.2, 0.08,
    mat(COL.kilnHot, { emissive: COL.kilnHot, emissiveIntensity: 0.9, roughness: 0.4 }), 20);
  kilnGlow.rotation.z = Math.PI / 2;

  cyl(grp, 'stack1', gx(-0.5), 1.9, gx(-0.5), 0.1, 0.12, 1.4, mat(COL.metalDk));
  cyl(grp, 'stack2', gx(-0.2), 1.7, gx(-0.5), 0.09, 0.11, 1.1, mat(COL.metalDk));

  g.add(grp);
  return { kiln, kilnGlow };
}

function buildShipping(g: THREE.Group) {
  const grp = new THREE.Group();
  grp.name = 'shipping';
  grp.position.set(gx(2.4), 0, gx(0.1));

  for (let i = 0; i < 3; i++) {
    cyl(grp, `silo${i}`, gx(-0.2 + i * 0.55), 0.85, gx(-1.0), 0.26, 0.26, 1.5, mat(COL.metal, { metalness: 0.5, roughness: 0.4 }), 20);
    cyl(grp, `siloTop${i}`, gx(-0.2 + i * 0.55), 1.65, gx(-1.0), 0.0, 0.28, 0.32, mat(COL.metalDk), 20);
  }

  const crystals: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const ang = (i / 5) * Math.PI * 2;
    const c = new THREE.Mesh(
      new THREE.SphereGeometry(0.1 + (i % 2) * 0.04, 12, 10),
      mat(COL.crystal, { roughness: 0.2, metalness: 0.1, emissive: COL.crystal, emissiveIntensity: 0.15 }),
    );
    c.name = `crystal${i}`;
    c.position.set(gx(0.9) + Math.cos(ang) * 0.18, 0.18 + (i % 2) * 0.06, gx(0.3) + Math.sin(ang) * 0.18);
    c.castShadow = true;
    grp.add(c);
    crystals.push(c);
  }

  const truck = new THREE.Group();
  truck.name = 'shipTruck';
  box(truck, 'truckCab', 0, 0.28, 0.42, 0.34, 0.34, 0.34, mat(COL.warm, { metalness: 0.3, roughness: 0.5 }));
  box(truck, 'truckBed', 0, 0.3, -0.05, 0.4, 0.4, 0.66, mat(COL.metal));
  for (const [wx, wz] of [[0.18, 0.3], [-0.18, 0.3], [0.18, -0.25], [-0.18, -0.25]] as const) {
    const w = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.045, 8, 16), mat(0x1c2026, { roughness: 0.9 }));
    w.position.set(wx, 0.1, wz);
    w.rotation.y = Math.PI / 2;
    truck.add(w);
  }
  truck.position.set(gx(0.2), 0.06, gx(1.3));
  grp.add(truck);

  g.add(grp);
  return { crystals, truck };
}

function buildLights(g: THREE.Group) {
  const kilnLight = new THREE.PointLight(COL.kilnHot, 0.6, 6, 2);
  kilnLight.position.set(gx(1.0), 1.6, gx(0.1));
  kilnLight.name = 'kilnLight';
  g.add(kilnLight);

  const warmFill = new THREE.PointLight(COL.warm, 0.5, 8, 2);
  warmFill.position.set(gx(-1.0), 2.2, gx(1.0));
  g.add(warmFill);

  const brineGlow = new THREE.PointLight(COL.brineA, 0.4, 5, 2);
  brineGlow.position.set(gx(-2.2), 0.6, 0);
  g.add(brineGlow);
}

interface AlbemarleRuntime {
  ponds: THREE.Mesh[];
  pumpArm: THREE.Mesh;
  kiln: THREE.Mesh;
  kilnGlow: THREE.Mesh;
  crystals: THREE.Mesh[];
  truck: THREE.Group;
}

function buildAlbemarleDiorama(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'albemarleDiorama';

  buildEnvironment(g);
  const brine = buildBrinePonds(g);
  const refinery = buildRefinery(g);
  const shipping = buildShipping(g);
  buildLights(g);

  g.userData = {
    ponds: brine.ponds,
    pumpArm: brine.pumpArm,
    kiln: refinery.kiln,
    kilnGlow: refinery.kilnGlow,
    crystals: shipping.crystals,
    truck: shipping.truck,
  } as AlbemarleRuntime;

  return g;
}

export function createAlbemarle(): THREE.Group {
  const root = buildAlbemarleDiorama();

  root.userData.tick = (time: number) => {
    const u = root.userData as AlbemarleRuntime;

    if (u.kiln) u.kiln.rotation.x = time * 0.6;
    if (u.kilnGlow) {
      const m = u.kilnGlow.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 0.75 + Math.sin(time * 2.0) * 0.15;
    }
    if (u.pumpArm) u.pumpArm.position.y = 0.55 + Math.sin(time * 1.4) * 0.06;
    u.ponds?.forEach((p, i) => {
      const m = p.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 0.1 + Math.sin(time * 0.8 + i) * 0.04;
    });
    u.crystals?.forEach((c, i) => {
      const m = c.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 0.12 + Math.abs(Math.sin(time * 1.2 + i * 0.7)) * 0.1;
    });
    if (u.truck) {
      const cycle = (time * 0.18) % 2;
      const p = cycle < 1 ? cycle : 2 - cycle;
      u.truck.position.x = gx(2.4) + gx(-0.4 + p * 0.8);
    }
    root.rotation.y = Math.sin(time * 0.3) * 0.005;
  };

  return root;
}
