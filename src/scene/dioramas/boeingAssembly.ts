// @ts-nocheck — DESIGN diorama port; strict typing deferred.
import * as THREE from 'three';

/** XZ footprint multiplier (matches village ground scale). */
const GROUND_XZ = 1.25;
const gx = (n: number) => n * GROUND_XZ;

type MatOpts = {
  roughness?: number;
  metalness?: number;
  transparent?: boolean;
  opacity?: number;
  emissive?: string;
  emissiveIntensity?: number;
  side?: THREE.Side;
};

interface AirlinerOptions {
  bodyColor?: string;
  accentColor?: string;
  bodyLen?: number;
  bodyRadius?: number;
  wingSpan?: number;
  wingChord?: number;
  engines?: boolean;
  windowCount?: number;
}

interface ConveyorPart {
  group: THREE.Group;
  offset: number;
  type: string;
  length: number;
}

interface PartsConveyor {
  group: THREE.Group;
  parts: ConveyorPart[];
  length: number;
  ledL: THREE.Mesh;
  ledR: THREE.Mesh;
}

interface BoeingAssemblyRuntime {
  conveyor1: PartsConveyor;
  conveyor2: PartsConveyor;
  moneyPaths: {
    curve: THREE.CatmullRomCurve3;
    coins: { mesh: THREE.Mesh; offset: number }[];
    speed: number;
  }[];
  goldGlow: THREE.PointLight;
}

// ===== Palette (Boeing house livery) =====
    const C = {
      boeingBlue: '#0033a0', boeingBlueLight: '#1e5dc4', boeingBlueDeep: '#001e6e',
      white: '#f5f5f5', silver: '#cfd4dc', offWhite: '#e8e8e8',
      metalDark: '#3a3a40', metal: '#7a7a80', metalLight: '#a8a8b0',
      glass: '#aed8ff', glassDeep: '#5a8fcf',
      apron: '#2a2d35', apronLight: '#3a3d45',
      base: '#0a0e1a', platform: '#1c2030',
      grass: '#2d8c4a',
      warm: '#fff2c8', amber: '#ffaf3a', hotCyan: '#aedfff',
      cargoTan: '#8a6440', bark: '#7a4b2a',
      solar: '#1a3052', solarHot: '#0a3a8a',
      partGold: '#d4af6a', goldGlow: '#ffd970',
      red: '#e31937'
    };

    const mat = (color: string, o: MatOpts = {}) => new THREE.MeshStandardMaterial({
      color,
      roughness: o.roughness ?? 0.6,
      metalness: o.metalness ?? 0.08,
      transparent: o.transparent ?? false,
      opacity: o.opacity ?? 1,
      emissive: o.emissive ?? '#000000',
      emissiveIntensity: o.emissiveIntensity ?? 0,
      side: o.side ?? THREE.FrontSide
    });

    const M = {
      boeingBlue: mat(C.boeingBlue, { roughness: .4, metalness: .25, emissive: '#001458', emissiveIntensity: .15 }),
      boeingBlueLight: mat(C.boeingBlueLight, { roughness: .35, metalness: .3, emissive: C.boeingBlue, emissiveIntensity: .2 }),
      white: mat(C.white, { roughness: .4, metalness: .15 }),
      offWhite: mat(C.offWhite, { roughness: .42, metalness: .15 }),
      silver: mat(C.silver, { roughness: .32, metalness: .55 }),
      metal: mat(C.metal, { roughness: .4, metalness: .6 }),
      metalDark: mat(C.metalDark, { roughness: .45, metalness: .7 }),
      metalLight: mat(C.metalLight, { roughness: .35, metalness: .55 }),
      glass: mat(C.glass, { roughness: .1, metalness: .15, transparent: true, opacity: .45, emissive: '#4a8eda', emissiveIntensity: .12 }),
      glassDeep: mat(C.glassDeep, { roughness: .12, metalness: .15, transparent: true, opacity: .6 }),
      apron: mat(C.apron, { roughness: .82 }),
      apronLight: mat(C.apronLight, { roughness: .76 }),
      base: mat(C.base, { roughness: .55 }),
      platform: mat(C.platform, { roughness: .78 }),
      grass: mat(C.grass, { roughness: .85 }),
      warmWindow: mat(C.warm, { roughness: .35, emissive: '#ffb93d', emissiveIntensity: .65 }),
      amberLight: mat(C.amber, { emissive: C.amber, emissiveIntensity: 1.0, roughness: .3 }),
      solar: mat(C.solar, { roughness: .25, metalness: .6, emissive: C.solarHot, emissiveIntensity: .25 }),
      partGold: mat(C.partGold, { roughness: .35, metalness: .55, emissive: '#5a4a20', emissiveIntensity: .15 }),
      cargoTan: mat(C.cargoTan, { roughness: .8 }),
      bark: mat(C.bark, { roughness: .85 }),
      green: mat('#2f7d42', { roughness: .8 }),
      windowGlow: mat(C.hotCyan, { emissive: C.hotCyan, emissiveIntensity: 1.0, roughness: .2 }),
      red: mat(C.red, { emissive: C.red, emissiveIntensity: 0.4, roughness: .35 }),
      goldCoin: new THREE.MeshStandardMaterial({
        color: '#ffd700', emissive: '#ffaa00', emissiveIntensity: 1.5,
        roughness: .25, metalness: .85
      })
    };

    // ===== Helpers =====
    function box(g: THREE.Group, name, x, y, z, sx, sy, sz, material) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
      mesh.name = name;
      mesh.position.set(x, y, z);
      mesh.castShadow = true; mesh.receiveShadow = true;
      g.add(mesh);
      return mesh;
    }
    function cyl(g: THREE.Group, name, x, y, z, r, h, material, radial = 24) {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, radial), material);
      mesh.name = name;
      mesh.position.set(x, y, z);
      mesh.castShadow = true; mesh.receiveShadow = true;
      g.add(mesh);
      return mesh;
    }
    function roundRect(ctx: CanvasRenderingContext2D, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    // ===== BOEING logo texture =====
    function makeBoeingLogoTexture(bg = '#0033a0', fg = '#ffffff') {
      const c = document.createElement('canvas');
      c.width = 1024; c.height = 256;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, c.width, c.height);
      // Boeing 시그니처: B 위에 작은 곡선 (간단화)
      ctx.strokeStyle = fg;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(c.width/2, 60, 380, Math.PI * 1.18, Math.PI * 1.82);
      ctx.stroke();
      // BOEING 텍스트
      ctx.fillStyle = fg;
      ctx.font = 'bold 130px "Helvetica Neue", Arial';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.letterSpacing = '8px';
      ctx.fillText('BOEING', c.width/2, c.height/2 + 25);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    }

    function makeFacadeTextTexture(text, bg = '#0033a0', fg = '#ffffff') {
      const c = document.createElement('canvas');
      c.width = 1024; c.height = 128;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = fg;
      ctx.font = 'bold 80px "Helvetica Neue", Arial';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.letterSpacing = '6px';
      ctx.fillText(text, c.width/2, c.height/2);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    }

    function texturedPlane(g: THREE.Group, tex, x, y, z, w, h, rotY = 0, emissive = 0.4) {
      const m = new THREE.MeshStandardMaterial({
        map: tex, side: THREE.DoubleSide, roughness: .4,
        emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: emissive
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
      mesh.position.set(x, y, z);
      mesh.rotation.y = rotY;
      g.add(mesh);
      return mesh;
    }

    // ===== Tree =====
    function tree(g: THREE.Group, x, z, s = .5) {
      cyl(g, 'tree trunk', x, .23 * s / .5, z, .035, .38 * s / .5, M.bark, 10);
      const crown = new THREE.Mesh(new THREE.SphereGeometry(.18 * s / .5, 16, 12), M.green);
      crown.position.set(x, .52 * s / .5, z);
      crown.castShadow = true; crown.receiveShadow = true;
      g.add(crown);
    }

    // ============================================================
    // ===== Airliner Builder (Boeing 787/737 style) =====
    // ============================================================
    function createAirliner(g: THREE.Group, x, y, z, rotY = 0, scale = 1, options: AirlinerOptions = {}) {
      const {
        bodyColor = '#f5f5f5',
        accentColor = '#0033a0',
        bodyLen = 1.2,       // 동체 길이
        bodyRadius = 0.085,  // 동체 반지름
        wingSpan = 0.95,     // 날개 폭
        wingChord = 0.32,    // 날개 코드
        engines = true,
        windowCount = 12
      } = options;

      const grp = new THREE.Group();
      grp.position.set(x, y, z);
      grp.rotation.y = rotY;
      grp.scale.setScalar(scale);
      g.add(grp);

      const bodyMat = mat(bodyColor, { roughness: .35, metalness: .25 });
      const accentMat = mat(accentColor, { roughness: .4, metalness: .3, emissive: accentColor, emissiveIntensity: .15 });
      const darkMat = mat('#1a1a1d', { roughness: .35, metalness: .65 });

      // 동체 (Cylinder, 옆으로 눕힘)
      const fuselage = new THREE.Mesh(
        new THREE.CylinderGeometry(bodyRadius, bodyRadius, bodyLen, 24),
        bodyMat
      );
      fuselage.rotation.z = Math.PI / 2;
      fuselage.castShadow = true;
      grp.add(fuselage);

      // 노즈콘 (Cone, 앞쪽)
      const nose = new THREE.Mesh(
        new THREE.ConeGeometry(bodyRadius, bodyRadius * 2.2, 24),
        bodyMat
      );
      nose.rotation.z = -Math.PI / 2;
      nose.position.set(bodyLen/2 + bodyRadius * 1.1, 0, 0);
      grp.add(nose);

      // 꼬리 (Cone, 뒤쪽 가늘어짐)
      const tail = new THREE.Mesh(
        new THREE.ConeGeometry(bodyRadius, bodyRadius * 1.6, 24),
        bodyMat
      );
      tail.rotation.z = Math.PI / 2;
      tail.position.set(-bodyLen/2 - bodyRadius * 0.8, 0, 0);
      grp.add(tail);

      // 주 날개 (낮은 날개, 약간 뒤로 후퇴)
      const wingGeom = new THREE.BoxGeometry(wingChord, 0.018, wingSpan);
      const wing = new THREE.Mesh(wingGeom, bodyMat);
      wing.position.set(-0.02, -0.045, 0);
      wing.castShadow = true;
      grp.add(wing);
      // 날개 끝 살짝 위로 (윙렛 느낌)
      const wingletL = new THREE.Mesh(
        new THREE.BoxGeometry(wingChord * 0.4, 0.05, 0.04),
        bodyMat
      );
      wingletL.position.set(-0.02, -0.025, -wingSpan/2 - 0.02);
      grp.add(wingletL);
      const wingletR = new THREE.Mesh(
        new THREE.BoxGeometry(wingChord * 0.4, 0.05, 0.04),
        bodyMat
      );
      wingletR.position.set(-0.02, -0.025, wingSpan/2 + 0.02);
      grp.add(wingletR);

      // 꼬리 수평 안정판
      const hTail = new THREE.Mesh(
        new THREE.BoxGeometry(wingChord * 0.65, 0.014, wingSpan * 0.45),
        bodyMat
      );
      hTail.position.set(-bodyLen/2 - 0.02, 0.02, 0);
      grp.add(hTail);

      // 수직 꼬리 (V-tail)
      const vTail = new THREE.Mesh(
        new THREE.BoxGeometry(wingChord * 0.5, 0.22, 0.018),
        bodyMat
      );
      vTail.position.set(-bodyLen/2 - 0.02, 0.13, 0);
      grp.add(vTail);
      // 꼬리에 작은 Boeing 청색 액센트
      const vTailAccent = new THREE.Mesh(
        new THREE.BoxGeometry(wingChord * 0.4, 0.18, 0.022),
        accentMat
      );
      vTailAccent.position.set(-bodyLen/2 - 0.025, 0.14, 0);
      grp.add(vTailAccent);

      // 동체 측면 청색 띠
      const stripe = new THREE.Mesh(
        new THREE.CylinderGeometry(bodyRadius + 0.001, bodyRadius + 0.001, bodyLen, 24, 1, true, 0, Math.PI),
        accentMat
      );
      stripe.rotation.z = Math.PI / 2;
      stripe.rotation.y = 0;
      stripe.scale.y = 0.18; // 얇은 띠로
      stripe.position.set(0, -bodyRadius * 0.5, 0);
      grp.add(stripe);

      // 창문 (양 측면)
      const winMat = M.windowGlow.clone();
      for (let i = 0; i < windowCount; i++) {
        const offset = -bodyLen/2 + bodyLen * 0.15 + i * (bodyLen * 0.7 / windowCount);
        // 좌측
        const winL = new THREE.Mesh(new THREE.PlaneGeometry(0.015, 0.011), winMat);
        winL.position.set(offset, 0.015, bodyRadius + 0.002);
        grp.add(winL);
        // 우측
        const winR = new THREE.Mesh(new THREE.PlaneGeometry(0.015, 0.011), winMat);
        winR.position.set(offset, 0.015, -bodyRadius - 0.002);
        winR.rotation.y = Math.PI;
        grp.add(winR);
      }
      // 조종실 창문 (정면)
      const cockpit = new THREE.Mesh(
        new THREE.PlaneGeometry(0.08, 0.025),
        M.glassDeep
      );
      cockpit.position.set(bodyLen/2 + bodyRadius * 0.6, 0.04, 0);
      cockpit.rotation.y = Math.PI / 2;
      grp.add(cockpit);

      // 엔진 (날개 아래 2개)
      if (engines) {
        const engGeom = new THREE.CylinderGeometry(0.045, 0.05, 0.18, 16);
        const engineL = new THREE.Mesh(engGeom, darkMat);
        engineL.rotation.z = Math.PI / 2;
        engineL.position.set(0.05, -0.085, -wingSpan * 0.3);
        engineL.castShadow = true;
        grp.add(engineL);
        // 엔진 흡입구 (밝은 cylinder cap)
        const intakeL = new THREE.Mesh(
          new THREE.CylinderGeometry(0.048, 0.048, 0.02, 16),
          M.metalLight
        );
        intakeL.rotation.z = Math.PI / 2;
        intakeL.position.set(0.14, -0.085, -wingSpan * 0.3);
        grp.add(intakeL);

        const engineR = engineL.clone();
        engineR.position.z = wingSpan * 0.3;
        grp.add(engineR);
        const intakeR = intakeL.clone();
        intakeR.position.z = wingSpan * 0.3;
        grp.add(intakeR);
      }

      // 랜딩 기어 (앞 1개 + 뒤 2개, 단순화)
      const wheelMat = M.metalDark;
      // 노즈 기어
      const noseGear = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.02, 12),
        wheelMat
      );
      noseGear.rotation.x = Math.PI / 2;
      noseGear.position.set(bodyLen/2 - 0.05, -bodyRadius - 0.018, 0);
      grp.add(noseGear);
      // 메인 기어 (양쪽)
      [-1, 1].forEach((sign) => {
        const main = new THREE.Mesh(
          new THREE.CylinderGeometry(0.022, 0.022, 0.025, 12),
          wheelMat
        );
        main.rotation.x = Math.PI / 2;
        main.position.set(-0.1, -bodyRadius - 0.022, sign * 0.08);
        grp.add(main);
      });

      // 작은 BOEING 텍스트 (동체 옆) — 청색 띠 위
      // (먼 거리 가독성 한계로 생략, 청색 줄무늬만)

      return grp;
    }

    // ============================================================
    // ===== 부품 빌더 (컨베이어 위 이동용) =====
    // ============================================================
    function createPartWing(scale = 1) {
      const grp = new THREE.Group();
      grp.scale.setScalar(scale);
      const wing = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.018, 0.08),
        M.offWhite
      );
      wing.castShadow = true;
      grp.add(wing);
      // 윙렛
      const wlt = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.04, 0.018),
        M.offWhite
      );
      wlt.position.set(0.09, 0.015, 0);
      grp.add(wlt);
      return grp;
    }

    function createPartEngine(scale = 1) {
      const grp = new THREE.Group();
      grp.scale.setScalar(scale);
      const eng = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.05, 0.16, 16),
        mat('#1a1a1d', { metalness: .65, roughness: .35 })
      );
      eng.rotation.z = Math.PI / 2;
      eng.castShadow = true;
      grp.add(eng);
      // 흡입구
      const intake = new THREE.Mesh(
        new THREE.CylinderGeometry(0.048, 0.048, 0.012, 16),
        M.metalLight
      );
      intake.rotation.z = Math.PI / 2;
      intake.position.set(0.08, 0, 0);
      grp.add(intake);
      // 받침대
      box(grp, 'eng cradle', 0, -0.055, 0, 0.12, 0.025, 0.06, M.metalDark);
      return grp;
    }

    function createPartFuselage(scale = 1) {
      const grp = new THREE.Group();
      grp.scale.setScalar(scale);
      const fuse = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.2, 20),
        M.offWhite
      );
      fuse.rotation.z = Math.PI / 2;
      fuse.castShadow = true;
      grp.add(fuse);
      // 작은 청색 띠
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.005, 0.01),
        M.boeingBlueLight
      );
      stripe.position.set(0, 0.03, 0.058);
      grp.add(stripe);
      // 받침
      box(grp, 'fuse cradle L', -0.06, -0.055, 0, 0.04, 0.025, 0.08, M.metalDark);
      box(grp, 'fuse cradle R', 0.06, -0.055, 0, 0.04, 0.025, 0.08, M.metalDark);
      return grp;
    }

    function createPartNose(scale = 1) {
      const grp = new THREE.Group();
      grp.scale.setScalar(scale);
      const nose = new THREE.Mesh(
        new THREE.ConeGeometry(0.065, 0.16, 16),
        M.offWhite
      );
      nose.rotation.z = -Math.PI / 2;
      nose.castShadow = true;
      grp.add(nose);
      // 조종실 창
      const cockpit = new THREE.Mesh(
        new THREE.PlaneGeometry(0.06, 0.022),
        M.glassDeep
      );
      cockpit.position.set(0.045, 0.03, 0);
      cockpit.rotation.y = Math.PI / 2;
      grp.add(cockpit);
      box(grp, 'nose cradle', 0, -0.055, 0, 0.12, 0.025, 0.08, M.metalDark);
      return grp;
    }

    // ============================================================
    // ===== 부품 컨베이어 =====
    // ============================================================
    function createPartsConveyor(g: THREE.Group, x, y, z, length = 2.4, rotY = 0) {
      const grp = new THREE.Group();
      grp.position.set(x, y, z);
      grp.rotation.y = rotY;
      g.add(grp);

      // 베이스
      box(grp, 'conv base', 0, 0.04, 0, length, 0.06, 0.28, mat('#2a2a30', { metalness: .4 }));
      // 벨트
      box(grp, 'conv belt', 0, 0.075, 0, length, 0.012, 0.24, mat('#1a1a22', { roughness: .9 }));
      // 사이드 가드 (양옆)
      box(grp, 'conv side L', 0, 0.07, 0.13, length, 0.04, 0.012, M.metalDark);
      box(grp, 'conv side R', 0, 0.07, -0.13, length, 0.04, 0.012, M.metalDark);
      // 롤러 (양 끝)
      const rollerL = cyl(grp, 'conv roller L', -length/2 + 0.04, 0.06, 0, 0.04, 0.28, M.metal, 12);
      rollerL.rotation.x = Math.PI / 2;
      const rollerR = cyl(grp, 'conv roller R', length/2 - 0.04, 0.06, 0, 0.04, 0.28, M.metal, 12);
      rollerR.rotation.x = Math.PI / 2;
      // 지지 다리
      const legCount = Math.max(2, Math.floor(length / 0.6));
      for (let i = 0; i < legCount; i++) {
        const lx = -length/2 + 0.15 + i * ((length - 0.3) / (legCount - 1));
        box(grp, `conv leg ${i} L`, lx, -0.01, 0.1, 0.04, 0.1, 0.04, M.metal);
        box(grp, `conv leg ${i} R`, lx, -0.01, -0.1, 0.04, 0.1, 0.04, M.metal);
      }

      // 컨베이어 위 부품 (순환)
      const parts = [];
      const partTypes = ['wing', 'engine', 'fuselage', 'nose', 'wing', 'engine'];
      partTypes.forEach((type, i) => {
        const offset = i / partTypes.length;
        let part;
        if (type === 'wing') part = createPartWing(1.0);
        else if (type === 'engine') part = createPartEngine(1.0);
        else if (type === 'fuselage') part = createPartFuselage(1.0);
        else if (type === 'nose') part = createPartNose(1.0);
        part.position.set(0, 0.12, 0);
        grp.add(part);
        parts.push({ group: part, offset, type, length });
      });

      // 시그널 LED (양 끝, 깜빡임)
      const ledL = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 8, 8),
        new THREE.MeshBasicMaterial({ color: '#ff3a3a' })
      );
      ledL.position.set(-length/2 + 0.04, 0.115, 0.15);
      grp.add(ledL);
      const ledR = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 8, 8),
        new THREE.MeshBasicMaterial({ color: '#34c759' })
      );
      ledR.position.set(length/2 - 0.04, 0.115, 0.15);
      grp.add(ledR);

      return { group: grp, parts, length, ledL, ledR };
    }

    // ============================================================
    // ===== Boeing 격납고 (사용자 OK 받은 디자인 유지) =====
    // ============================================================
    function createBoeingHangar(g: THREE.Group, cx, cy, cz) {
      const grp = new THREE.Group();
      grp.position.set(cx, cy, cz);
      g.add(grp);

      const W = 2.6, H = 0.85, D = 1.6;

      // 본체 (큰 흰 박스)
      box(grp, 'hangar body', 0, H/2, 0, W, H, D, M.white);
      // 옥상 (얇은 메탈)
      box(grp, 'hangar roof', 0, H + 0.025, 0, W + 0.05, 0.05, D + 0.05, M.metalLight);
      // 베이스
      box(grp, 'hangar base', 0, 0.04, 0, W + 0.1, 0.06, D + 0.1, M.platform);
      // 정면 청색 띠 (옥상 아래)
      box(grp, 'hangar blue trim', 0, H + 0.005, D/2 + 0.003, W, 0.045, 0.015, M.boeingBlue);

      // ===== 격납고 큰 셔터 (정면 4개) =====
      const shutterW = 0.55;
      const shutterH = 0.55;
      for (let i = 0; i < 4; i++) {
        const sx = -W/2 + 0.25 + i * 0.62;
        // 셔터 박스 (어두운 회색)
        box(grp, `shutter ${i}`, sx, shutterH/2 + 0.05, D/2 + 0.005, shutterW, shutterH, 0.02, mat('#1c1c20', { roughness: .5, metalness: .4 }));
        // 셔터 가로 줄무늬 (디테일)
        for (let j = 0; j < 6; j++) {
          box(grp, `shutter line ${i}_${j}`, sx, 0.1 + j * 0.085, D/2 + 0.016, shutterW - 0.02, 0.008, 0.005, mat('#2a2a30'));
        }
        // 셔터 위 안전 노란 줄
        box(grp, `shutter warn ${i}`, sx, shutterH + 0.06, D/2 + 0.012, shutterW, 0.018, 0.008, mat('#ffcf3a', { emissive: '#ffcf3a', emissiveIntensity: 0.5 }));
      }
      // 좌측 끝 셔터 1개는 "열려 있음" 표현 (어두운 내부 + 미완성 비행기 동체 일부 보임)
      const openX = -W/2 + 0.25; // 첫 셔터 위치
      box(grp, 'open shutter dark', openX, shutterH/2 + 0.05, D/2 - 0.01, shutterW - 0.02, shutterH, 0.02, mat('#0a0a0e', { emissive: '#0a0a0e' }));
      // 안에 보이는 미완성 동체 (작은 cylinder)
      const inside = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.4, 16),
        M.offWhite
      );
      inside.rotation.z = Math.PI / 2;
      inside.position.set(openX, 0.18, D/2 - 0.18);
      grp.add(inside);
      // 안에 따뜻한 작업등
      const insideLight = new THREE.Mesh(
        new THREE.PlaneGeometry(0.45, 0.1),
        M.warmWindow.clone()
      );
      insideLight.position.set(openX, 0.5, D/2 - 0.2);
      grp.add(insideLight);

      // ===== 옥상 솔라 패널 (이미지에서 본 디자인 유지) =====
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 3; j++) {
          const sx = -W/2 + 0.3 + i * 0.4;
          const sz = -D/2 + 0.3 + j * 0.5;
          const panel = box(grp, `solar ${i}_${j}`, sx, H + 0.06, sz, 0.36, 0.012, 0.42, M.solar);
          panel.rotation.x = -Math.PI / 26;
        }
      }
      // 옥상 환기구 (작은 박스 3개)
      for (let i = 0; i < 3; i++) {
        box(grp, `roof vent ${i}`, -0.6 + i * 0.6, H + 0.13, -D/2 + 0.15, 0.16, 0.12, 0.16, M.metalDark);
        cyl(grp, `roof vent stack ${i}`, -0.6 + i * 0.6, H + 0.23, -D/2 + 0.15, 0.04, 0.16, M.metal, 12);
      }

      // ===== 정면 위 BOEING 큰 로고 =====
      const boeingTex = makeBoeingLogoTexture('#0033a0', '#ffffff');
      texturedPlane(grp, boeingTex, 0, H - 0.12, D/2 + 0.013, 1.8, 0.42, 0, 0.45);
      // 로고 양옆 청색 패치
      box(grp, 'logo bg', 0, H - 0.12, D/2 + 0.008, 2.1, 0.45, 0.01, M.boeingBlue);

      // ===== 측면 (우측) BOEING 작은 로고 =====
      const sideTex = makeFacadeTextTexture('BOEING', '#ffffff', '#0033a0');
      texturedPlane(grp, sideTex, W/2 + 0.011, H/2 + 0.05, 0, 1.2, 0.16, Math.PI / 2, 0.4);

      // ===== 측면 (좌측) 창문 격자 (사무실 영역) =====
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 3; j++) {
          const wy = 0.25 + j * 0.2;
          const wz = -D/2 + 0.3 + i * 0.4;
          box(grp, `office win ${i}_${j}`, -W/2 - 0.011, wy, wz, 0.01, 0.12, 0.28, M.warmWindow.clone());
        }
      }

      return grp;
    }

    // ============================================================
    // ===== 부품 보관소 (격납고 좌측 작은 빌딩) =====
    // ============================================================
    function createPartsWarehouse(g: THREE.Group, cx, cy, cz) {
      const grp = new THREE.Group();
      grp.position.set(cx, cy, cz);
      g.add(grp);

      const W = 0.9, H = 0.45, D = 0.8;
      box(grp, 'wh body', 0, H/2, 0, W, H, D, M.offWhite);
      box(grp, 'wh roof', 0, H + 0.018, 0, W + 0.04, 0.035, D + 0.04, M.metalDark);
      box(grp, 'wh base', 0, 0.04, 0, W + 0.08, 0.06, D + 0.08, M.platform);
      // 정면 셔터
      box(grp, 'wh shutter', 0, 0.18, D/2 + 0.005, W * 0.6, 0.28, 0.018, mat('#1c1c20'));
      // 셔터 가로 줄
      for (let j = 0; j < 4; j++) {
        box(grp, `wh shutter line ${j}`, 0, 0.08 + j * 0.07, D/2 + 0.014, W * 0.55, 0.008, 0.005, mat('#2a2a30'));
      }
      // 작은 BOEING 라벨
      const lbl = makeFacadeTextTexture('PARTS', '#0033a0', '#ffffff');
      texturedPlane(grp, lbl, 0, 0.4, D/2 + 0.011, 0.42, 0.06, 0, 0.4);
      // 옥상 솔라 4장
      for (let i = 0; i < 4; i++) {
        const sx = -W/2 + 0.15 + (i % 2) * 0.3;
        const sz = -D/2 + 0.2 + Math.floor(i / 2) * 0.35;
        box(grp, `wh solar ${i}`, sx, H + 0.045, sz, 0.25, 0.01, 0.3, M.solar);
      }
      // 옆에 크레이트 박스 (출하 대기)
      for (let i = 0; i < 3; i++) {
        box(grp, `wh crate ${i}`, W/2 + 0.18, 0.1, -D/2 + 0.18 + i * 0.22, 0.16, 0.14, 0.16, M.cargoTan);
      }
      return grp;
    }

    // ============================================================
    // ===== 작업 트랙터 (정지 여객기 옆) =====
    // ============================================================
    function createTowTractor(g: THREE.Group, x, y, z, rotY = 0, scale = 1) {
      const grp = new THREE.Group();
      grp.position.set(x, y, z); grp.rotation.y = rotY; grp.scale.setScalar(scale);
      g.add(grp);
      box(grp, 'tow body', 0, 0.045, 0, 0.2, 0.07, 0.13, M.amberLight);
      box(grp, 'tow cabin', -0.04, 0.1, 0, 0.1, 0.05, 0.1, mat('#2a2a30'));
      box(grp, 'tow window', -0.04, 0.1, 0, 0.09, 0.04, 0.102, M.glassDeep);
      // 바퀴
      [[-0.07, -0.06], [0.07, -0.06], [-0.07, 0.06], [0.07, 0.06]].forEach(([bx, bz]) => {
        const w = cyl(grp, 'wheel', bx, 0.02, bz, 0.02, 0.025, M.metalDark, 12);
        w.rotation.x = Math.PI / 2;
      });
      return grp;
    }

    // ============================================================
    // ===== Marshaller (작업자, 작은 흰 박스) =====
    // ============================================================
    function createWorker(g: THREE.Group, x, y, z, vestColor = '#ffaf3a') {
      const grp = new THREE.Group();
      grp.position.set(x, y, z);
      g.add(grp);
      // 몸통 (오렌지 조끼)
      box(grp, 'worker body', 0, 0.06, 0, 0.04, 0.08, 0.025, mat(vestColor, { emissive: vestColor, emissiveIntensity: 0.4 }));
      // 머리
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.018, 8, 6),
        mat('#ffd5b0')
      );
      head.position.set(0, 0.12, 0);
      grp.add(head);
      // 헬멧 (작은 박스)
      box(grp, 'worker helmet', 0, 0.135, 0, 0.025, 0.015, 0.025, mat('#ffcf3a'));
      return grp;
    }

    // ============================================================
    // ===== Master: Boeing Diorama =====
    // ============================================================
    function buildBoeingAssemblyDiorama() {
      const g = new THREE.Group();

      // ===== Base / Apron (격납고 앞 넓은 광장) =====
      box(g, 'plinth', 0, -0.13, 0, gx(5.4), .26, gx(4.6), M.base);
      box(g, 'platform', 0, .02, 0, gx(5.0), .12, gx(4.2), M.apron);

      // ===== 격납고 앞 넓은 에이프런 (활주로 제거, 광장으로) =====
      // 격납고 정면 (z=-0.5 ~ z=2.0 정도) 넓은 콘크리트
      box(g, 'apron front', 0, .083, 0.9, gx(4.0), .012, gx(2.0), M.apronLight);
      // 에이프런 위 안내선 (노란 줄, 비행기 정지 위치 표시)
      for (let i = 0; i < 3; i++) {
        const z = 0.2 + i * 0.7;
        box(g, `marking line ${i}`, 0.5, .09, z, 0.6, 0.005, 0.02, mat('#ffcf3a', { emissive: '#ffcf3a', emissiveIntensity: 0.3 }));
        box(g, `marking T ${i}`, 0.5, .09, z + 0.08, 0.02, 0.005, 0.16, mat('#ffcf3a', { emissive: '#ffcf3a', emissiveIntensity: 0.3 }));
      }
      // 비행기 정지 표시 (큰 원형 마크)
      const stopMark1 = new THREE.Mesh(
        new THREE.RingGeometry(0.18, 0.21, 32),
        mat('#ffcf3a', { emissive: '#ffcf3a', emissiveIntensity: 0.5 })
      );
      stopMark1.rotation.x = -Math.PI / 2;
      stopMark1.position.set(0.7, 0.092, 0.3);
      g.add(stopMark1);
      const stopMark2 = new THREE.Mesh(
        new THREE.RingGeometry(0.15, 0.18, 32),
        mat('#ffcf3a', { emissive: '#ffcf3a', emissiveIntensity: 0.5 })
      );
      stopMark2.rotation.x = -Math.PI / 2;
      stopMark2.position.set(-1.3, 0.092, 0.6);
      g.add(stopMark2);

      // ===== 격납고 (중앙 뒤) =====
      const hangar = createBoeingHangar(g, 0, 0.08, -0.9);
      // ===== 부품 보관소 (격납고 좌측) =====
      const warehouse = createPartsWarehouse(g, -2.1, 0.08, -0.8);
      // ===== 부품 컨베이어 (보관소 → 격납고 좌측, 가로) =====
      const conveyor1 = createPartsConveyor(g, -0.9, 0.08, -0.2, 2.2, 0);
      // ===== 부품 컨베이어 (격납고 우측, 출하 라인) =====
      const conveyor2 = createPartsConveyor(g, 2.0, 0.08, -0.6, 1.6, Math.PI / 2);

      // ===== 정지 여객기 2대 =====
      // 큰 여객기 (Boeing 787 스타일) — 우측 정지 마크 위
      const airliner787 = createAirliner(g, 0.7, 0.21, 0.3, -Math.PI / 6, 1.3, {
        bodyColor: '#f5f5f5',
        accentColor: '#0033a0',
        bodyLen: 1.3,
        bodyRadius: 0.09,
        wingSpan: 1.0,
        wingChord: 0.34,
        windowCount: 14
      });
      // 작은 여객기 (Boeing 737 스타일) — 좌측 정지 마크 위
      const airliner737 = createAirliner(g, -1.3, 0.18, 0.6, Math.PI / 8, 1.0, {
        bodyColor: '#f5f5f5',
        accentColor: '#1e5dc4',
        bodyLen: 0.95,
        bodyRadius: 0.075,
        wingSpan: 0.78,
        wingChord: 0.26,
        windowCount: 10
      });

      // ===== 견인 트랙터 (787 옆) =====
      createTowTractor(g, 0.05, 0.085, 0.55, Math.PI / 3, 1.0);
      // ===== 작업자들 =====
      createWorker(g, 0.4, 0.085, 0.6, '#ffaf3a');
      createWorker(g, -1.0, 0.085, 0.9, '#ffaf3a');
      createWorker(g, -1.5, 0.085, 0.4, '#ff5a73');
      createWorker(g, 0.95, 0.085, 0.7, '#34c759');

      // ===== 잔디 (외곽) =====
      const grassPatches = [
        [-2.8, 1.7, 0.6, 0.5], [2.8, 1.7, 0.6, 0.5],
        [-2.8, -1.6, 0.6, 0.5], [2.8, -1.6, 0.6, 0.5],
        [-3.0, 0, 0.4, 1.5], [3.0, 0, 0.4, 1.5]
      ];
      grassPatches.forEach(([x, z, w, d]) => {
        const patch = new THREE.Mesh(
          new THREE.PlaneGeometry(w, d),
          M.grass
        );
        patch.rotation.x = -Math.PI / 2;
        patch.position.set(x, 0.084, z);
        g.add(patch);
      });

      // ===== 나무 (외곽) =====
      const treeSpots = [
        [-2.8, -1.95], [-2.8, -1.4], [-2.8, 1.95],
        [2.8, -1.95], [2.8, -1.4], [2.8, 1.95],
        [-1.5, 2.0], [1.5, 2.0], [0, 2.0],
        [-2.95, 0.3], [2.95, 0.3]
      ];
      treeSpots.forEach(([x, z]) => tree(g, x, z, 0.42));

      // ===== 조명탑 (활주로 등 X, 단순 가로등) =====
      for (let i = 0; i < 4; i++) {
        const lx = -1.8 + i * 1.2;
        cyl(g, `lamp post ${i}`, lx, 0.25, 1.9, 0.025, 0.4, M.metalDark, 8);
        const lamp = new THREE.Mesh(
          new THREE.SphereGeometry(0.04, 12, 10),
          M.warmWindow.clone()
        );
        lamp.position.set(lx, 0.46, 1.9);
        g.add(lamp);
        // 작은 광원
        const lampLight = new THREE.PointLight('#fff2c8', 0.3, 1.2);
        lampLight.position.set(lx, 0.45, 1.9);
        g.add(lampLight);
      }

      // ===== 매출 흐름 (출하 컨베이어 → 격납고 옥상, 금색 코인) =====
      const moneyPaths = [];
      [
        { start: [-2.1, 0.4, -0.4], end: [0, 1.5, -0.9] },  // 보관소 → 격납고
        { start: [2.0, 0.3, -0.6], end: [0, 1.5, -0.9] }    // 출하 → 격납고
      ].forEach((path, idx) => {
        const s = new THREE.Vector3(...path.start);
        const m = new THREE.Vector3((s.x + path.end[0])/2, 2.0, (s.z + path.end[2])/2);
        const e = new THREE.Vector3(...path.end);
        const curve = new THREE.CatmullRomCurve3([s, m, e]);
        const coins = [];
        for (let i = 0; i < 3; i++) {
          const coin = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, 0.014, 16),
            M.goldCoin.clone()
          );
          g.add(coin);
          coins.push({ mesh: coin, offset: i / 3 });
        }
        moneyPaths.push({ curve, coins, speed: 0.05 + idx * 0.008 });
      });

      const goldGlow = new THREE.PointLight('#ffd700', 0.4, 2.5);
      goldGlow.position.set(0, 1.5, -0.9);
      g.add(goldGlow);

      // ===== 조명 =====
      const hangarGlow = new THREE.PointLight('#fff2c8', 0.7, 3.5);
      hangarGlow.position.set(0, 0.6, -0.3);
      g.add(hangarGlow);
      const blueGlow = new THREE.PointLight('#4a8eda', 0.4, 2.5);
      blueGlow.position.set(0, 0.9, -0.5);
      g.add(blueGlow);

      g.userData = {
        conveyor1, conveyor2, moneyPaths, goldGlow
      };
      return g;
    }

    
export function createBoeing(): THREE.Group {
  const root = buildBoeingAssemblyDiorama();
  const SPEED = 0.4;
  root.userData.tick = (time: number) => {
    const t = time * SPEED;
    const tRaw = time;
    const u = root.userData as BoeingAssemblyRuntime;

    u.conveyor1.parts.forEach((p) => {
      const progress = ((tRaw * 0.15) + p.offset) % 1;
      const localX = -u.conveyor1.length / 2 + 0.1 + progress * (u.conveyor1.length - 0.2);
      p.group.position.x = localX;
      if (p.type === 'fuselage' || p.type === 'engine') {
        p.group.rotation.x = tRaw * 0.5;
      }
    });

    u.conveyor2.parts.forEach((p) => {
      const progress = ((tRaw * 0.12) + p.offset) % 1;
      const localX = -u.conveyor2.length / 2 + 0.1 + progress * (u.conveyor2.length - 0.2);
      p.group.position.x = localX;
      if (p.type === 'fuselage' || p.type === 'engine') {
        p.group.rotation.x = tRaw * 0.5;
      }
    });

    (u.conveyor1.ledL.material as THREE.MeshBasicMaterial).color.setHSL(0, 1, 0.4 + 0.2 * Math.sin(tRaw * 4));
    (u.conveyor1.ledR.material as THREE.MeshBasicMaterial).color.setHSL(0.33, 1, 0.4 + 0.2 * Math.sin(tRaw * 3));
    (u.conveyor2.ledL.material as THREE.MeshBasicMaterial).color.setHSL(0, 1, 0.4 + 0.2 * Math.sin(tRaw * 4 + 1));
    (u.conveyor2.ledR.material as THREE.MeshBasicMaterial).color.setHSL(0.33, 1, 0.4 + 0.2 * Math.sin(tRaw * 3 + 1));

    u.moneyPaths.forEach((path) => {
      path.coins.forEach((c, idx) => {
        const progress = ((tRaw * path.speed) + c.offset) % 1;
        c.mesh.position.copy(path.curve.getPoint(progress));
        c.mesh.rotation.x = Math.PI / 2;
        c.mesh.rotation.y = tRaw * 4 + idx;
        (c.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity =
          1.4 + 0.4 * Math.sin(t * 2.5 + idx);
      });
    });
    u.goldGlow.intensity = 0.35 + 0.2 * Math.sin(t * 1.5);

    root.rotation.y = Math.sin(t * 0.2) * 0.008;
  };
  return root;
}
