// @ts-nocheck — S-Oil (010950) value-chain diorama from DESIGN buildingTemplates (Gas Station v3).
import * as THREE from 'three';

const GROUND_FOOTPRINT_XZ = 1.25;
const gx = (n: number) => n * GROUND_FOOTPRINT_XZ;

function mat(hex: number, roughness = 0.65, metalness = 0.1): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: hex, roughness, metalness });
}

function bx(w: number, h: number, d: number, m: THREE.Material, px = 0, py = 0, pz = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.position.set(px, py + h / 2, pz);
  return mesh;
}

function cy(r: number, h: number, m: THREE.Material, px = 0, py = 0, pz = 0, segs = 10): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.92, r, h, segs), m);
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.position.set(px, py + h / 2, pz);
  return mesh;
}

function grp(...parts: THREE.Object3D[]): THREE.Group {
  const g = new THREE.Group();
  parts.forEach(p => g.add(p));
  return g;
}

export function createSOilRefinery(): THREE.Group {
  const green = mat(0x0b5a35, 0.55, 0.15);
  const greenDark = mat(0x063a22, 0.5, 0.2);
  const yellow = mat(0xf4c430, 0.45, 0.05);
  const cream = mat(0xe8e4d0, 0.75, 0.1);
  const paper = mat(0xd8ccb4, 0.8);
  const wood = mat(0x6d4b32, 0.58);
  const metal = mat(0xc0c0c0, 0.3, 0.7);
  const metalDark = mat(0x888888, 0.5, 0.4);
  const pipeM = mat(0x666666, 0.38, 0.6);
  const road = mat(0x242824, 0.8);
  const whiteAccent = mat(0xf4f4f4, 0.6);
  const glass = new THREE.MeshStandardMaterial({
    color: 0xa8d4ee,
    transparent: true,
    opacity: 0.55,
    roughness: 0.1,
    metalness: 0.1,
    emissive: 0x3a78a0,
    emissiveIntensity: 0.15,
  });
  const glassDark = mat(0x2a3a4a, 0.2, 0.5);
  const warmWindow = new THREE.MeshStandardMaterial({
    color: 0xfff2c8,
    roughness: 0.35,
    emissive: 0xffb93d,
    emissiveIntensity: 0.85,
  });
  const oilDropMat = new THREE.MeshStandardMaterial({
    color: 0x2a1500,
    roughness: 0.15,
    metalness: 0.3,
    emissive: 0x3a1a08,
    emissiveIntensity: 0.4,
  });
  const smokeMat = new THREE.MeshBasicMaterial({
    color: 0xaaaaaa,
    transparent: true,
    opacity: 0.45,
  });
  const gasPad = mat(0xbdbdb5, 0.95);
  const gasLine = mat(0xfff8e8, 0.8);
  const pumpBody = mat(0xe8e4d0, 0.7);
  const pumpScreen = new THREE.MeshStandardMaterial({
    color: 0x003322,
    emissive: 0x1a8a55,
    emissiveIntensity: 1.5,
  });
  const headlightMat = new THREE.MeshBasicMaterial({ color: 0xfff8c0 });

  const root = new THREE.Group();
  const add = (o: THREE.Object3D) => {
    root.add(o);
    return o;
  };
  const cbx = (sx: number, sy: number, sz: number, m: THREE.Material, x: number, y: number, z: number) =>
    add(bx(sx, sy, sz, m, x, y - sy / 2, z)) as THREE.Mesh;

  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  const makeSignTexture = (text: string, bg: string, color: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = bg;
    roundRect(ctx, 14, 14, canvas.width - 28, canvas.height - 28, 28);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
    roundRect(ctx, 14, 14, canvas.width - 28, canvas.height - 28, 28);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.font = 'bold 130px Arial, sans-serif';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };

  const addSign = (
    text: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    bg: string,
    color: string,
    rotX = 0,
  ) => {
    const tex = makeSignTexture(text, bg, color);
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({
        map: tex,
        side: THREE.DoubleSide,
        emissive: 0xffffff,
        emissiveMap: tex,
        emissiveIntensity: 0.2,
      }),
    );
    mesh.position.set(x, y, z);
    mesh.rotation.x = rotX;
    mesh.castShadow = true;
    return add(mesh);
  };

  const makePriceBoardTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 320;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0b5a35';
    ctx.fillRect(8, 8, canvas.width - 16, 60);
    ctx.fillStyle = '#fff8e8';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S-OIL', canvas.width / 2, 40);
    ctx.fillStyle = '#ff7a00';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'left';
    const labels = ['휘발유', '경유', 'LPG'];
    const prices = ['1,657', '1,527', '1,077'];
    for (let i = 0; i < 3; i++) {
      ctx.fillText(labels[i]!, 18, 110 + i * 60);
      ctx.textAlign = 'right';
      ctx.fillText(prices[i]!, canvas.width - 18, 110 + i * 60);
      ctx.textAlign = 'left';
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };

  const addToGroup = (parent: THREE.Group, o: THREE.Object3D) => {
    parent.add(o);
    return o;
  };

  const cbxG = (g: THREE.Group, sx: number, sy: number, sz: number, m: THREE.Material, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m);
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = true;
    return addToGroup(g, mesh) as THREE.Mesh;
  };

  const createGasStation = (baseX: number, baseZ: number) => {
    const station = new THREE.Group();
    station.position.set(baseX, 0, baseZ);
    add(station);

    cbxG(station, 0.9, 0.02, 0.7, gasPad, 0, 0.13, 0);
    cbxG(station, 0.005, 0.005, 0.18, gasLine, -0.18, 0.142, 0.15);
    cbxG(station, 0.005, 0.005, 0.18, gasLine, 0.18, 0.142, 0.15);
    cbxG(station, 0.005, 0.005, 0.18, gasLine, -0.18, 0.142, -0.15);
    cbxG(station, 0.005, 0.005, 0.18, gasLine, 0.18, 0.142, -0.15);

    for (const [px, pz] of [
      [-0.38, -0.28],
      [0.38, -0.28],
      [-0.38, 0.18],
      [0.38, 0.18],
    ]) {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.4, 12), metalDark);
      pillar.position.set(px, 0.34, pz);
      pillar.castShadow = true;
      addToGroup(station, pillar);
    }

    cbxG(station, 0.85, 0.04, 0.55, whiteAccent, 0, 0.56, -0.05);
    cbxG(station, 0.87, 0.06, 0.03, green, 0, 0.535, 0.225);
    cbxG(station, 0.03, 0.06, 0.55, green, -0.43, 0.535, -0.05);
    cbxG(station, 0.03, 0.06, 0.55, green, 0.43, 0.535, -0.05);

    [[-0.18, -0.05], [0.18, -0.05]].forEach(([px, pz]) => {
      cbxG(station, 0.08, 0.16, 0.05, pumpBody, px, 0.22, pz);
      cbxG(station, 0.06, 0.04, 0.005, pumpScreen, px, 0.27, pz - 0.0265);
      const hose = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 6), mat(0x222222));
      hose.position.set(px + 0.045, 0.18, pz - 0.025);
      hose.rotation.z = Math.PI / 4;
      addToGroup(station, hose);
    });

    cbxG(station, 0.55, 0.3, 0.18, whiteAccent, 0, 0.27, -0.55);
    cbxG(station, 0.57, 0.05, 0.2, green, 0, 0.43, -0.55);
    cbxG(station, 0.4, 0.13, 0.01, glassDark, 0, 0.22, -0.45);
    cbxG(station, 0.38, 0.11, 0.005, warmWindow.clone(), 0, 0.22, -0.444);

    const storeTex = makeSignTexture('S-OIL', '#ffffff', '#0b5a35');
    const storeSign = new THREE.Mesh(
      new THREE.PlaneGeometry(0.32, 0.08),
      new THREE.MeshStandardMaterial({
        map: storeTex,
        side: THREE.DoubleSide,
        emissive: 0xffffff,
        emissiveMap: storeTex,
        emissiveIntensity: 0.2,
      }),
    );
    storeSign.position.set(0, 0.46, -0.443);
    addToGroup(station, storeSign);

    const priceTex = makePriceBoardTexture();
    const priceBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(0.18, 0.22),
      new THREE.MeshStandardMaterial({
        map: priceTex,
        emissive: 0xffffff,
        emissiveMap: priceTex,
        emissiveIntensity: 0.5,
        side: THREE.DoubleSide,
      }),
    );
    priceBoard.position.set(0.55, 0.35, 0.05);
    priceBoard.rotation.y = -Math.PI / 2;
    addToGroup(station, priceBoard);
    const pricePole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.2, 8), metalDark);
    pricePole.position.set(0.55, 0.18, 0.05);
    addToGroup(station, pricePole);

    const car = new THREE.Group();
    car.position.set(-0.18, 0.18, 0.08);
    addToGroup(station, car);
    cbxG(car, 0.18, 0.06, 0.1, whiteAccent, 0, 0, 0);
    cbxG(car, 0.13, 0.04, 0.09, whiteAccent, 0, 0.05, 0);
    const hl1 = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), headlightMat.clone());
    hl1.position.set(0.09, 0, 0.035);
    addToGroup(car, hl1);
    const hl2 = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), headlightMat.clone());
    hl2.position.set(0.09, 0, -0.035);
    addToGroup(car, hl2);
    for (const [wx, wz] of [
      [-0.06, -0.04],
      [0.06, -0.04],
      [-0.06, 0.04],
      [0.06, 0.04],
    ]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.015, 8), mat(0x1a1a1a));
      wheel.position.set(wx, -0.03, wz);
      wheel.rotation.x = Math.PI / 2;
      addToGroup(car, wheel);
    }

    const canopyLight = new THREE.PointLight(0xfff8c0, 0.6, 1.2);
    canopyLight.position.set(0, 0.5, 0);
    station.add(canopyLight);

    return { canopyLight, headlights: [hl1, hl2] as THREE.Mesh[] };
  };

  const addPipe = (px: number, py: number, pz: number, len: number, axis: 'x' | 'tilt') => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, len, 8), pipeM);
    mesh.position.set(px, py, pz);
    if (axis === 'x') mesh.rotation.z = Math.PI / 2;
    else {
      mesh.rotation.x = Math.PI / 2;
      mesh.rotation.z = Math.PI / 8;
    }
    mesh.castShadow = mesh.receiveShadow = true;
    return add(mesh);
  };

  cbx(gx(4.8), 0.02, gx(4.3), road, 0, 0.01, 0);
  cbx(gx(4.8), 0.26, gx(4.3), wood, 0, 0.13, 0);
  cbx(gx(4.35), 0.12, gx(3.85), paper, 0, 0.28, 0);
  cbx(gx(4.0), 0.04, gx(0.5), road, 0, 0.1, 1.5);
  cbx(gx(2.45), 0.04, gx(0.38), road, 0.6, 0.11, -0.55);

  const hqX = -1.4;
  const hqZ = -0.55;
  cbx(1.6, 2.4, 1.2, green, hqX, 1.2, hqZ);
  cbx(1.7, 0.14, 1.3, whiteAccent, hqX, 2.46, hqZ);
  cbx(0.9, 0.22, 0.7, greenDark, hqX, 2.65, hqZ);

  const winCols = 6;
  const winRows = 8;
  const winW = 0.18;
  const winH = 0.22;
  const winGapX = 0.05;
  const winGapY = 0.05;
  const totalW = winCols * winW + (winCols - 1) * winGapX;
  const totalH = winRows * winH + (winRows - 1) * winGapY;
  const startX = hqX - totalW / 2 + winW / 2;
  const startY = 1.2 - totalH / 2 + winH / 2;

  const frontWindows: { mesh: THREE.Mesh; row: number; col: number }[] = [];
  for (let row = 0; row < winRows; row++) {
    for (let col = 0; col < winCols; col++) {
      const x = startX + col * (winW + winGapX);
      const y = startY + row * (winH + winGapY);
      frontWindows.push({
        mesh: cbx(winW, winH, 0.025, warmWindow.clone(), x, y, 0.06),
        row,
        col,
      });
    }
  }
  for (let i = 0; i < 5; i++) {
    const x = startX - winW / 2 - winGapX / 2 + i * (winW + winGapX);
    cbx(0.025, totalH + 0.1, 0.03, whiteAccent, x, 1.2, 0.07);
  }
  cbx(0.035, 2.2, 1.1, glass, -2.215, 1.2, hqZ);
  cbx(0.035, 2.2, 1.1, glass, -0.585, 1.2, hqZ);
  cbx(1.3, 0.4, 0.06, glassDark, hqX, 0.25, 0.07);
  cbx(1.4, 0.05, 0.25, whiteAccent, hqX, 0.5, 0.18);
  cbx(0.4, 0.18, 0.03, warmWindow.clone(), hqX, 0.2, 0.085);
  cbx(0.3, 0.2, 0.3, metalDark, -1.7, 2.62, -0.7);
  cbx(0.3, 0.2, 0.3, metalDark, -1.1, 2.62, -0.4);

  const dishPivot = new THREE.Group();
  dishPivot.position.set(-1.8, 2.92, hqZ);
  add(dishPivot);
  const dish = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2.2),
    metal,
  );
  dish.rotation.x = Math.PI;
  dishPivot.add(dish);
  const dishAntenna = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 8), metalDark);
  dishAntenna.position.set(0, 0.12, 0);
  dishPivot.add(dishAntenna);
  const dishLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.025, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xff3355 }),
  );
  dishLed.position.set(0, 0.24, 0);
  dishPivot.add(dishLed);

  const roofSign = addSign('S-OIL', hqX, 2.85, 0.1, 1.0, 0.32, '#ffffff', '#0b5a35');
  roofSign.rotation.x = -Math.PI / 10;
  cbx(0.04, 0.28, 0.04, metalDark, -1.85, 2.72, 0.1);
  cbx(0.04, 0.28, 0.04, metalDark, -0.95, 2.72, 0.1);
  addSign('S-OIL', hqX, 1.7, 0.084, 0.9, 0.32, '#0b5a35', '#ffffff');

  add(cy(0.38, 3.0, metal, 0, 0, 0, 16));
  add(cy(0.49, 0.06, yellow, 0, 0.92, 0, 24));
  add(cy(0.47, 0.06, yellow, 0, 1.67, 0, 24));
  add(cy(0.44, 0.06, yellow, 0, 2.42, 0, 24));
  add(cy(0.21, 0.15, metalDark, 0, 2.995, 0, 16));
  add(cy(0.22, 2.2, metalDark, 0.7, 0, 0.5, 14));
  add(cy(0.19, 0.12, metalDark, 0.7, 2.18, 0.5, 14));

  type SmokeBead = {
    mesh: THREE.Mesh;
    baseX: number;
    baseY: number;
    baseZ: number;
    offset: number;
    drift: number;
    speed: number;
  };
  const smokeBeads: SmokeBead[] = [];
  const smokeOrigins = [
    { x: 0, y: 3.25, z: 0, count: 5 },
    { x: 0.7, y: 2.35, z: 0.5, count: 4 },
  ];
  smokeOrigins.forEach((origin, originIdx) => {
    for (let i = 0; i < origin.count; i++) {
      const smoke = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), smokeMat.clone());
      smoke.castShadow = false;
      smoke.userData.excludeFromGroundBounds = true;
      add(smoke);
      smokeBeads.push({
        mesh: smoke,
        baseX: origin.x,
        baseY: origin.y,
        baseZ: origin.z,
        offset: i / origin.count,
        drift: (originIdx * 2 + i) * 1.1,
        speed: 0.18 + originIdx * 0.02 + i * 0.01,
      });
    }
  });

  const tankPositions: [number, number, number][] = [
    [0.5, 0.35, -1.5],
    [1.4, 0.35, -1.5],
    [0.5, 0.35, -0.6],
    [1.4, 0.35, -0.6],
  ];
  tankPositions.forEach(([x, y, z]) => {
    add(cy(0.4, 0.7, cream, x, y - 0.35, z, 32));
    add(cy(0.42, 0.035, yellow, x, y + 0.03, z, 32));
    const logoTex = makeSignTexture('S-OIL', '#0b5a35', '#ffffff');
    const logo = new THREE.Mesh(
      new THREE.PlaneGeometry(0.36, 0.16),
      new THREE.MeshStandardMaterial({ map: logoTex, side: THREE.DoubleSide }),
    );
    logo.position.set(x, y + 0.04, z - 0.405);
    add(logo);
  });

  addPipe(0.95, 0.8, -1.5, 1.0, 'x');
  addPipe(0.95, 0.8, -0.6, 1.0, 'x');
  addPipe(0.55, 0.78, -0.25, 1.25, 'tilt');

  const gasStation = createGasStation(1.35, 0.7);

  cbx(0.32, 0.28, 0.32, green, -0.9, 0.24, 1.2);
  const truckTank = add(cy(0.18, 0.75, cream, -0.45, 0.1, 1.2, 16));
  truckTank.rotation.z = Math.PI / 2;
  for (let i = 0; i < 4; i++) {
    const w = add(cy(0.055, 0.05, road, -0.85 + i * 0.22, 0.105, 1.4, 12));
    w.rotation.x = Math.PI / 2;
  }

  cbx(0.3, 0.12, 0.2, cream, -2.05, 0.13, 0.5);

  const buildingLight = new THREE.PointLight(0xfff2c8, 0.7, 3.5);
  buildingLight.position.set(hqX, 1.2, hqZ);
  add(buildingLight);

  type OilBead = { mesh: THREE.Mesh; phaseOffset: number };
  type OilPath = { start: THREE.Vector3; end: THREE.Vector3; beads: OilBead[]; speed: number };
  const oilPaths: OilPath[] = [];

  const addOilPath = (start: [number, number, number], end: [number, number, number], count: number, speed: number) => {
    const beads: OilBead[] = [];
    for (let i = 0; i < count; i++) {
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 10), oilDropMat.clone());
      bead.castShadow = false;
      bead.userData.excludeFromGroundBounds = true;
      add(bead);
      beads.push({ mesh: bead, phaseOffset: i / count });
    }
    oilPaths.push({ start: new THREE.Vector3(...start), end: new THREE.Vector3(...end), beads, speed });
  };

  addOilPath([0, 0.8, 0], [0.5, 0.8, -1.45], 5, 0.4);
  addOilPath([0, 0.8, 0], [1.4, 0.8, -1.45], 4, 0.35);
  addOilPath([0, 0.8, 0], [0.5, 0.8, -0.6], 4, 0.45);
  addOilPath([0, 0.8, 0], [1.4, 0.8, -0.6], 4, 0.38);

  root.userData.tick = (t: number) => {
    oilPaths.forEach((path) => {
      path.beads.forEach((b) => {
        const progress = ((t * path.speed) + b.phaseOffset) % 1;
        const pos = new THREE.Vector3().lerpVectors(path.start, path.end, progress);
        b.mesh.position.copy(pos);
        b.mesh.position.y += Math.sin(t * 8 + b.phaseOffset * 10) * 0.015;
        (b.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity =
          0.3 + 0.15 * Math.sin(t * 3 + b.phaseOffset * 6);
      });
    });

    smokeBeads.forEach((s) => {
      const progress = ((t * s.speed) + s.offset) % 1;
      s.mesh.position.set(
        s.baseX + Math.sin(t * 0.8 + s.drift) * 0.1 + progress * 0.15,
        s.baseY + progress * 1.4,
        s.baseZ + Math.cos(t * 0.8 + s.drift) * 0.1,
      );
      (s.mesh.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - progress);
      s.mesh.scale.setScalar(0.6 + progress * 1.5);
    });

    frontWindows.forEach((fw) => {
      const wave = 0.5 + 0.6 * Math.max(0, Math.sin(t * 1.2 - fw.row * 0.3 + fw.col * 0.1));
      (fw.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = wave;
    });

    dishPivot.rotation.y = t * 0.5;
    (dishLed.material as THREE.MeshBasicMaterial).color.setHSL(0, 1, 0.5 + 0.25 * Math.sin(t * 8));

    gasStation.canopyLight.intensity = 0.6 + 0.1 * Math.sin(t * 1.2);
    gasStation.headlights.forEach((h, i) => {
      h.material.color.setRGB(1, 0.97 + 0.03 * Math.sin(t * 4 + i), 0.75);
    });
  };

  return root;
}

