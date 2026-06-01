// @ts-nocheck — DESIGN diorama port; strict typing deferred.
import * as THREE from 'three';

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

// ===== Palette (Apple tone: white, silver, glass) =====
    const C = {
      appleWhite: '#f5f5f7', silver: '#c8c8cc',
      metalDark: '#5a5a64', metal: '#9a9a9e',
      glass: '#cfe4ff', glassDeep: '#7fb0e0',
      road: '#262830', base: '#0e1219', platform: '#d8dce3',
      grass: '#2d8c4a', grassLight: '#3fa85e',
      warm: '#fff2c8',
      appleBlue: '#007aff', hotData: '#aedfff', goldGlow: '#ffd970',
      panelBg: '#0a0a0a', screenBlue: '#3a78ff', screenPink: '#fa57a3', cloudBlue: '#aeddff'
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
      appleWhite: mat(C.appleWhite, { roughness: .35, metalness: .15 }),
      silver: mat(C.silver, { roughness: .32, metalness: .55 }),
      metal: mat(C.metal, { roughness: .4, metalness: .6 }),
      metalDark: mat(C.metalDark, { roughness: .45, metalness: .7 }),
      glass: mat(C.glass, { roughness: .08, metalness: .12, transparent: true, opacity: .48, emissive: '#4d8dff', emissiveIntensity: .15 }),
      glassDeep: mat(C.glassDeep, { roughness: .1, metalness: .15, transparent: true, opacity: .6 }),
      road: mat(C.road, { roughness: .82 }),
      base: mat(C.base, { roughness: .55 }),
      platform: mat(C.platform, { roughness: .78 }),
      grass: mat(C.grass, { roughness: .85 }),
      grassLight: mat(C.grassLight, { roughness: .8 }),
      warmWindow: mat(C.warm, { roughness: .35, emissive: '#ffb93d', emissiveIntensity: .55 }),
      green: mat('#2f7d42', { roughness: .8 }),
      bark: mat('#7a4b2a', { roughness: .85 }),
      black: mat('#0a0a0a', { roughness: .4 }),
      dataBead: new THREE.MeshStandardMaterial({
        color: C.hotData, emissive: C.hotData, emissiveIntensity: 1.8, roughness: .25
      }),
      goldCoin: new THREE.MeshStandardMaterial({
        color: '#ffd700', emissive: '#ffaa00', emissiveIntensity: 1.6,
        roughness: .25, metalness: .85
      })
    };

    // ===== Helpers =====
    function box(g, name, x, y, z, sx, sy, sz, material) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
      mesh.name = name;
      mesh.position.set(x, y, z);
      mesh.castShadow = true; mesh.receiveShadow = true;
      g.add(mesh);
      return mesh;
    }
    function cyl(g, name, x, y, z, r, h, material, radial = 24) {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, radial), material);
      mesh.name = name;
      mesh.position.set(x, y, z);
      mesh.castShadow = true; mesh.receiveShadow = true;
      g.add(mesh);
      return mesh;
    }
    function roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    // ===== Apple logo (canvas drawn) =====
    function drawAppleLogo(ctx, cx, cy, size, color) {
      ctx.save();
      ctx.fillStyle = color;
      const s = size / 200;
      // 본체: 두 원 + 아래 둥근 부분
      ctx.beginPath();
      ctx.arc(cx - 50*s, cy + 10*s, 95*s, 0, Math.PI*2);
      ctx.arc(cx + 50*s, cy + 10*s, 95*s, 0, Math.PI*2);
      ctx.arc(cx, cy + 60*s, 105*s, 0, Math.PI*2);
      ctx.arc(cx, cy - 30*s, 90*s, 0, Math.PI*2);
      ctx.fill();
      // 잎
      ctx.beginPath();
      ctx.ellipse(cx + 28*s, cy - 110*s, 18*s, 42*s, Math.PI/5, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    }

    function makeAppleLogoTexture(bg = '#0a0a0a', fg = '#ffffff') {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 512;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, c.width, c.height);
      drawAppleLogo(ctx, c.width/2, c.height/2 + 20, 360, fg);
      // 한 입 자국
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(c.width/2 + 130, c.height/2 + 25, 50, 0, Math.PI*2);
      ctx.fill();
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    }

    // ===== 옥상 광고판 텍스처 (#1~#6 캡션) =====
    function makeLabelPanelTexture(num, korTitle, korSubtitle) {
      const c = document.createElement('canvas');
      c.width = 768; c.height = 280;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#0a0a0a';
      roundRect(ctx, 6, 6, c.width-12, c.height-12, 32);
      ctx.fill();
      ctx.strokeStyle = '#3a3a3a';
      ctx.lineWidth = 3;
      roundRect(ctx, 6, 6, c.width-12, c.height-12, 32);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 86px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(num, 50, 90);
      ctx.font = 'bold 60px "Malgun Gothic", Arial';
      ctx.fillText(korTitle, 140, 90);
      if (korSubtitle) {
        ctx.fillStyle = '#c4c4c8';
        ctx.font = '34px "Malgun Gothic", Arial';
        const lines = korSubtitle.split('\n');
        lines.forEach((line, i) => {
          ctx.fillText(line, 50, 170 + i * 44);
        });
      }
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    }

    function makeFacadeTextTexture(text, bg = '#0a0a0a', fg = '#ffffff') {
      const c = document.createElement('canvas');
      c.width = 768; c.height = 128;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = fg;
      ctx.font = 'bold 64px "Helvetica Neue", Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, c.width/2, c.height/2);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    }

    function makeAppleServicesTexture() {
      const c = document.createElement('canvas');
      c.width = 1024; c.height = 512;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#1a1a1a';
      roundRect(ctx, 6, 6, c.width-12, c.height-12, 24);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 38px "Helvetica Neue", Arial';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('Apple Services', c.width/2, 56);
      const services = [
        { name: 'iCloud', color: '#4ab8e8' },
        { name: 'App Store', color: '#007aff' },
        { name: 'Music', color: '#fa57a3' },
        { name: 'TV+', color: '#1a1a1a', stroke: '#fff' },
        { name: 'Pay', color: '#0a0a0a', stroke: '#fff' },
        { name: 'Arcade', color: '#a259ff' },
        { name: 'News+', color: '#ff3b30' },
        { name: 'Fitness+', color: '#34c759' }
      ];
      const cols = 4;
      const cellW = 220, cellH = 170;
      const startX = (c.width - cellW * cols) / 2 + 16;
      const startY = 130;
      services.forEach((svc, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        const x = startX + col * cellW, y = startY + row * cellH;
        ctx.fillStyle = svc.color;
        roundRect(ctx, x, y, 180, 130, 32);
        ctx.fill();
        if (svc.stroke) {
          ctx.strokeStyle = svc.stroke; ctx.lineWidth = 3;
          roundRect(ctx, x, y, 180, 130, 32); ctx.stroke();
        }
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 30px "Helvetica Neue", Arial';
        ctx.fillText(svc.name, x + 90, y + 75);
      });
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    }

    function makePlatformListTexture() {
      const c = document.createElement('canvas');
      c.width = 384; c.height = 896;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#0a0a0a';
      roundRect(ctx, 6, 6, c.width-12, c.height-12, 28);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px "Malgun Gothic", Arial';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('소프트웨어 플랫폼', c.width/2, 52);
      const platforms = [
        { name: 'iOS', color: '#ffffff' },
        { name: 'macOS', color: '#e8e8e8' },
        { name: 'watchOS', color: '#fa57a3' },
        { name: 'tvOS', color: '#a259ff' },
        { name: 'visionOS', color: '#4ab8e8' }
      ];
      const startY = 140;
      const lineH = 140;
      platforms.forEach((p, i) => {
        const y = startY + i * lineH;
        ctx.fillStyle = '#1a1a1a';
        roundRect(ctx, 36, y - 50, c.width - 72, 110, 22);
        ctx.fill();
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 2;
        roundRect(ctx, 36, y - 50, c.width - 72, 110, 22);
        ctx.stroke();
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(82, y + 5, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 42px "Helvetica Neue", Arial';
        ctx.textAlign = 'left';
        ctx.fillText(p.name, 122, y + 12);
      });
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    }

    function makeIphoneAdTexture() {
      const c = document.createElement('canvas');
      c.width = 384; c.height = 640;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = '#1c1c1e';
      roundRect(ctx, 70, 70, 244, 460, 42);
      ctx.fill();
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 5;
      roundRect(ctx, 70, 70, 244, 460, 42);
      ctx.stroke();
      const screenGrad = ctx.createLinearGradient(0, 88, 0, 510);
      screenGrad.addColorStop(0, '#1e3a8a');
      screenGrad.addColorStop(1, '#3a78ff');
      ctx.fillStyle = screenGrad;
      roundRect(ctx, 88, 88, 208, 424, 32);
      ctx.fill();
      ctx.fillStyle = '#0a0a0a';
      roundRect(ctx, 142, 100, 100, 28, 14);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px "Helvetica Neue", Arial';
      ctx.textAlign = 'center';
      ctx.fillText('iPhone', c.width/2, c.height - 40);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    }

    function makeMChipAdTexture() {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 320;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#0a0a0a';
      roundRect(ctx, 4, 4, c.width-8, c.height-8, 22);
      ctx.fill();
      drawAppleLogo(ctx, 50, 50, 36, '#ffffff');
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px "Helvetica Neue", Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('M 시리즈', 80, 50);
      ctx.font = 'bold 24px "Malgun Gothic", Arial';
      ctx.fillText('Apple Silicon', 80, 84);
      const chipGrad = ctx.createLinearGradient(40, 130, 472, 270);
      chipGrad.addColorStop(0, '#2a2a30');
      chipGrad.addColorStop(0.5, '#4a4a55');
      chipGrad.addColorStop(1, '#1a1a20');
      ctx.fillStyle = chipGrad;
      roundRect(ctx, 40, 130, 432, 140, 14);
      ctx.fill();
      ctx.strokeStyle = '#5a8fbf';
      ctx.lineWidth = 2;
      roundRect(ctx, 40, 130, 432, 140, 14);
      ctx.stroke();
      ctx.fillStyle = '#d4af6a';
      for (let i = 0; i < 14; i++) {
        ctx.beginPath();
        ctx.arc(70 + i * 28, 200, 4, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px "Helvetica Neue", Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('M', c.width/2, 218);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    }

    function rooftopPanel(g, num, title, subtitle, x, y, z, w = 0.85, h = 0.31) {
      const tex = makeLabelPanelTexture(num, title, subtitle);
      const m = new THREE.MeshStandardMaterial({
        map: tex, side: THREE.DoubleSide, roughness: .4,
        emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: .32
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
      mesh.position.set(x, y, z);
      g.add(mesh);
      cyl(g, `panel post ${num}`, x, y - h/2 - 0.14, z, 0.012, 0.28, M.silver, 8);
      return mesh;
    }

    function texturedPlane(g, tex, x, y, z, w, h, rotY = 0, emissive = 0.3) {
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

    function tree(g, x, z, s = .5) {
      cyl(g, 'tree trunk', x, .23 * s / .5, z, .035, .38 * s / .5, M.bark, 10);
      const crown = new THREE.Mesh(new THREE.SphereGeometry(.18 * s / .5, 16, 12), M.green);
      crown.position.set(x, .52 * s / .5, z);
      crown.castShadow = true; crown.receiveShadow = true;
      g.add(crown);
    }

    function createMacBook(g, x, y, z, scale = 1) {
      const grp = new THREE.Group();
      grp.position.set(x, y, z); grp.scale.setScalar(scale);
      g.add(grp);
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.022, 0.28), M.silver);
      base.castShadow = true;
      grp.add(base);
      const screen = new THREE.Group();
      screen.position.set(0, 0.011, -0.14);
      screen.rotation.x = -Math.PI / 5;
      grp.add(screen);
      const screenBack = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.26, 0.015), M.silver);
      screenBack.position.set(0, 0.13, 0);
      screen.add(screenBack);
      const screenFront = new THREE.Mesh(
        new THREE.PlaneGeometry(0.37, 0.24),
        new THREE.MeshStandardMaterial({
          color: '#5a4ac9', emissive: '#5a4ac9', emissiveIntensity: 1.0, roughness: .15
        })
      );
      screenFront.position.set(0, 0.13, 0.008);
      screen.add(screenFront);
      const logoLight = new THREE.Mesh(
        new THREE.CircleGeometry(0.025, 16),
        new THREE.MeshBasicMaterial({ color: '#ffffff' })
      );
      logoLight.position.set(0, 0.13, -0.008);
      logoLight.rotation.y = Math.PI;
      screen.add(logoLight);
      return { group: grp, screen: screenFront };
    }

    function createAirPodsCase(g, x, y, z, scale = 1) {
      const grp = new THREE.Group();
      grp.position.set(x, y, z); grp.scale.setScalar(scale);
      g.add(grp);
      const caseBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.085, 0.075),
        M.appleWhite
      );
      caseBody.castShadow = true;
      grp.add(caseBody);
      const slot = new THREE.Mesh(
        new THREE.BoxGeometry(0.122, 0.003, 0.077),
        mat('#cccccc')
      );
      slot.position.set(0, 0.025, 0);
      grp.add(slot);
      const led = new THREE.Mesh(
        new THREE.SphereGeometry(0.008, 12, 8),
        new THREE.MeshBasicMaterial({ color: '#34c759' })
      );
      led.position.set(0, 0, 0.04);
      grp.add(led);
      return grp;
    }

    function createAppleWatch(g, x, y, z, scale = 1) {
      const grp = new THREE.Group();
      grp.position.set(x, y, z); grp.scale.setScalar(scale);
      g.add(grp);
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.105, 0.028), M.silver);
      body.castShadow = true;
      grp.add(body);
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.07, 0.085),
        new THREE.MeshStandardMaterial({
          color: C.screenPink, emissive: C.screenPink, emissiveIntensity: 1.2, roughness: .15
        })
      );
      screen.position.set(0, 0, 0.015);
      grp.add(screen);
      const crown = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.006, 0.018, 10),
        M.silver
      );
      crown.position.set(0.046, 0.02, 0);
      crown.rotation.z = Math.PI / 2;
      grp.add(crown);
      const strap1 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, 0.015), mat('#1a1a1a'));
      strap1.position.set(0, 0.07, 0);
      grp.add(strap1);
      const strap2 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, 0.015), mat('#1a1a1a'));
      strap2.position.set(0, -0.07, 0);
      grp.add(strap2);
      return { group: grp, screen };
    }

    function createICloud(g, x, y, z, scale = 1) {
      const grp = new THREE.Group();
      grp.position.set(x, y, z); grp.scale.setScalar(scale);
      g.add(grp);
      const cloudMat = new THREE.MeshStandardMaterial({
        color: C.cloudBlue, roughness: .4, transparent: true, opacity: .9,
        emissive: '#4ab8e8', emissiveIntensity: .45
      });
      const positions = [
        [0, 0, 0, 0.13],
        [0.1, 0.02, 0, 0.1],
        [-0.09, 0.01, 0, 0.095],
        [0.05, 0.07, 0, 0.08],
        [-0.05, 0.06, 0, 0.08]
      ];
      positions.forEach(([dx, dy, dz, r]) => {
        const s = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), cloudMat);
        s.position.set(dx, dy, dz);
        grp.add(s);
      });
      return grp;
    }

    function createIPhoneMini(g, x, y, z, scale = 1) {
      const grp = new THREE.Group();
      grp.position.set(x, y, z); grp.scale.setScalar(scale);
      g.add(grp);
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.014), mat('#1c1c1e', { metalness: .6 }));
      body.castShadow = true;
      grp.add(body);
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.085, 0.18),
        new THREE.MeshStandardMaterial({
          color: C.screenBlue, emissive: C.screenBlue, emissiveIntensity: 1.2, roughness: .15
        })
      );
      screen.position.set(0, 0, 0.008);
      grp.add(screen);
      return { group: grp, screen };
    }

    function createTruck(g, x, y, z, scale = 1) {
      const grp = new THREE.Group();
      grp.position.set(x, y, z); grp.scale.setScalar(scale);
      g.add(grp);
      box(grp, 'truck cabin', -0.18, 0.06, 0, 0.16, 0.12, 0.18, M.appleWhite);
      box(grp, 'truck cargo', 0.06, 0.08, 0, 0.32, 0.16, 0.2, M.appleWhite);
      const logo = new THREE.Mesh(
        new THREE.PlaneGeometry(0.06, 0.06),
        new THREE.MeshStandardMaterial({
          map: makeAppleLogoTexture('#0a0a0a', '#ffffff'),
          emissive: '#ffffff', emissiveIntensity: .2
        })
      );
      logo.position.set(0.06, 0.13, 0.101);
      grp.add(logo);
      [-0.18, -0.05, 0.18].forEach((bx, i) => {
        cyl(grp, `wheel ${i}`, bx, 0.015, 0.09, 0.025, 0.04, M.metalDark, 12).rotation.x = Math.PI / 2;
        cyl(grp, `wheel ${i}b`, bx, 0.015, -0.09, 0.025, 0.04, M.metalDark, 12).rotation.x = Math.PI / 2;
      });
      return grp;
    }

    function createCar(g, x, y, z, color = '#e8e8e8', rotY = 0) {
      const grp = new THREE.Group();
      grp.position.set(x, y, z);
      grp.rotation.y = rotY;
      g.add(grp);
      box(grp, 'car body', 0, 0.04, 0, 0.18, 0.06, 0.1, mat(color, { metalness: .4 }));
      box(grp, 'car top', 0, 0.085, 0, 0.12, 0.04, 0.09, mat(color, { metalness: .4 }));
      [-0.06, 0.06].forEach((bx) => {
        cyl(grp, 'wheel', bx, 0.015, 0.045, 0.015, 0.025, M.metalDark, 10).rotation.x = Math.PI / 2;
        cyl(grp, 'wheel', bx, 0.015, -0.045, 0.015, 0.025, M.metalDark, 10).rotation.x = Math.PI / 2;
      });
      return grp;
    }

    function createAppleParkRing(g, cx, cy, cz) {
      const ring = new THREE.Group();
      ring.position.set(cx, cy, cz);
      g.add(ring);

      const Rout = 1.45;
      const Rin = 1.05;
      const H = 0.45;

      const outer = new THREE.Mesh(
        new THREE.CylinderGeometry(Rout, Rout, H, 64, 1, true),
        M.glass
      );
      outer.position.set(0, H/2, 0);
      outer.receiveShadow = true;
      ring.add(outer);

      const innerMat = M.glass.clone();
      innerMat.side = THREE.BackSide;
      const inner = new THREE.Mesh(
        new THREE.CylinderGeometry(Rin, Rin, H, 64, 1, true),
        innerMat
      );
      inner.position.set(0, H/2, 0);
      ring.add(inner);

      const top = new THREE.Mesh(
        new THREE.RingGeometry(Rin, Rout, 64),
        M.appleWhite
      );
      top.position.set(0, H + 0.005, 0);
      top.rotation.x = -Math.PI / 2;
      top.receiveShadow = true;
      ring.add(top);

      const segs = 32;
      for (let i = 0; i < segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        const r = (Rin + Rout) / 2;
        const seg = new THREE.Mesh(
          new THREE.BoxGeometry((Rout - Rin) * 0.85, 0.01, 0.16),
          mat('#1a3052', { roughness: .3, metalness: .6, emissive: '#0a3a8a', emissiveIntensity: .15 })
        );
        seg.position.set(Math.cos(a) * r, H + 0.012, Math.sin(a) * r);
        seg.rotation.y = -a;
        ring.add(seg);
      }

      const bottom = new THREE.Mesh(
        new THREE.RingGeometry(Rin, Rout, 64),
        M.appleWhite
      );
      bottom.position.set(0, 0, 0);
      bottom.rotation.x = -Math.PI / 2;
      bottom.receiveShadow = true;
      ring.add(bottom);

      const winSegs = 48;
      const windowWaves = [];
      for (let i = 0; i < winSegs; i++) {
        const a = (i / winSegs) * Math.PI * 2;
        const w = new THREE.Mesh(
          new THREE.PlaneGeometry(0.16, 0.08),
          M.warmWindow.clone()
        );
        w.position.set(Math.cos(a) * (Rout + 0.001), 0.22, Math.sin(a) * (Rout + 0.001));
        w.lookAt(new THREE.Vector3(Math.cos(a) * (Rout + 2), 0.22, Math.sin(a) * (Rout + 2)));
        ring.add(w);
        windowWaves.push({ mesh: w, phase: i / winSegs });
      }

      const garden = new THREE.Mesh(
        new THREE.CircleGeometry(Rin - 0.03, 48),
        M.grass
      );
      garden.position.set(0, 0.012, 0);
      garden.rotation.x = -Math.PI / 2;
      garden.receiveShadow = true;
      ring.add(garden);

      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const r = 0.6;
        const patch = new THREE.Mesh(
          new THREE.CircleGeometry(0.14, 20),
          M.grassLight
        );
        patch.position.set(Math.cos(a) * r, 0.015, Math.sin(a) * r);
        patch.rotation.x = -Math.PI / 2;
        ring.add(patch);
      }

      const treeCount = 10;
      for (let i = 0; i < treeCount; i++) {
        const a = (i / treeCount) * Math.PI * 2;
        const r = 0.78;
        tree(ring, Math.cos(a) * r, Math.sin(a) * r, 0.36);
      }
      tree(ring, 0, 0, 0.5);

      const rainbow = new THREE.Group();
      rainbow.position.set(0, 0.02, 0.5);
      ring.add(rainbow);
      const rainbowColors = ['#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#007aff', '#af52de'];
      rainbowColors.forEach((col, i) => {
        const arch = new THREE.Mesh(
          new THREE.TorusGeometry(0.18 - i*0.022, 0.012, 8, 24, Math.PI),
          new THREE.MeshStandardMaterial({
            color: col, emissive: col, emissiveIntensity: .55, roughness: .3
          })
        );
        arch.position.set(0, i * 0.005, 0);
        rainbow.add(arch);
      });

      const parkLabelTex = (() => {
        const c = document.createElement('canvas');
        c.width = 512; c.height = 192;
        const ctx = c.getContext('2d')!;
        ctx.fillStyle = '#0a0a0a';
        roundRect(ctx, 6, 6, c.width-12, c.height-12, 28);
        ctx.fill();
        drawAppleLogo(ctx, 90, 96, 90, '#ffffff');
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 50px "Helvetica Neue", Arial';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText('Apple Park', 165, 100);
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
      })();
      const parkLabel = new THREE.Mesh(
        new THREE.PlaneGeometry(0.7, 0.26),
        new THREE.MeshStandardMaterial({
          map: parkLabelTex, side: THREE.DoubleSide, roughness: .4,
          emissive: '#ffffff', emissiveMap: parkLabelTex, emissiveIntensity: .35
        })
      );
      parkLabel.position.set(0, 0.95, 0);
      ring.add(parkLabel);
      cyl(ring, 'park label post', 0, 0.7, 0, 0.014, 0.42, M.silver, 8);

      return { ring, windowWaves };
    }

    function createDesignStudio(g, cx, cy, cz) {
      const grp = new THREE.Group();
      grp.position.set(cx, cy, cz);
      g.add(grp);
      box(grp, 'studio body', 0, 0.3, 0, 0.95, 0.55, 0.65, M.glass);
      box(grp, 'studio roof', 0, 0.595, 0, 1.0, 0.04, 0.7, M.appleWhite);
      box(grp, 'studio roof line', 0, 0.62, 0.32, 1.0, 0.025, 0.04, M.silver);
      box(grp, 'studio base', 0, 0.04, 0, 1.0, 0.06, 0.72, M.platform);
      box(grp, 'studio front glass', 0, 0.3, 0.33, 0.9, 0.45, 0.018, M.glassDeep);
      for (let i = 0; i < 6; i++) {
        box(grp, `studio mullion ${i}`, -0.36 + i * 0.144, 0.3, 0.34, 0.018, 0.45, 0.018, M.silver);
      }
      for (let i = 0; i < 3; i++) {
        box(grp, `studio desk ${i}`, -0.3 + i * 0.3, 0.12, 0.0, 0.18, 0.04, 0.1, M.silver);
        box(grp, `studio chair ${i}`, -0.3 + i * 0.3, 0.085, 0.18, 0.06, 0.06, 0.06, M.metalDark);
        box(grp, `studio mon ${i}`, -0.3 + i * 0.3, 0.17, -0.02, 0.08, 0.06, 0.005, mat(C.screenBlue, { emissive: C.screenBlue, emissiveIntensity: 0.9 }));
      }
      const facadeTex = makeFacadeTextTexture('DESIGN STUDIO', '#0a0a0a', '#ffffff');
      texturedPlane(grp, facadeTex, 0, 0.5, 0.341, 0.85, 0.075, 0, 0.4);
      rooftopPanel(grp, '1', '기획·디자인', '사용자 중심의 혁신적인\n제품 기획 및 디자인', 0, 1.0, 0);
      const iphoneTex = makeIphoneAdTexture();
      texturedPlane(grp, iphoneTex, -0.7, 0.4, 0.35, 0.32, 0.55, Math.PI / 12, 0.4);
      cyl(grp, 'iphone ad post', -0.7, 0.08, 0.35, 0.015, 0.18, M.silver, 8);
      return grp;
    }

    function createRDCenter(g, cx, cy, cz) {
      const grp = new THREE.Group();
      grp.position.set(cx, cy, cz);
      g.add(grp);
      box(grp, 'rd body', 0, 0.32, 0, 1.05, 0.6, 0.75, M.glass);
      box(grp, 'rd roof', 0, 0.63, 0, 1.1, 0.04, 0.8, M.appleWhite);
      box(grp, 'rd base', 0, 0.04, 0, 1.1, 0.06, 0.82, M.platform);
      box(grp, 'rd front glass', 0, 0.32, 0.38, 0.98, 0.48, 0.018, M.glassDeep);
      for (let i = 0; i < 6; i++) {
        box(grp, `rd mullion ${i}`, -0.42 + i * 0.168, 0.32, 0.39, 0.018, 0.48, 0.018, M.silver);
      }
      box(grp, 'rd equip 1', -0.3, 0.7, -0.15, 0.18, 0.1, 0.18, M.silver);
      box(grp, 'rd equip 2', 0.0, 0.69, -0.2, 0.16, 0.08, 0.16, M.metalDark);
      box(grp, 'rd equip 3', 0.3, 0.71, -0.15, 0.2, 0.12, 0.2, M.silver);
      cyl(grp, 'rd dish post', 0, 0.74, 0.2, 0.02, 0.1, M.metal, 8);
      const dish = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 16, 12, 0, Math.PI*2, 0, Math.PI / 2.2),
        M.silver
      );
      dish.rotation.x = Math.PI;
      dish.position.set(0, 0.83, 0.2);
      grp.add(dish);
      for (let i = 0; i < 4; i++) {
        box(grp, `rd ws ${i}`, -0.35 + i * 0.23, 0.12, 0.05, 0.16, 0.04, 0.1, M.silver);
        box(grp, `rd ws scr ${i}`, -0.35 + i * 0.23, 0.18, 0.0, 0.1, 0.07, 0.005, mat('#5a4ac9', { emissive: '#5a4ac9', emissiveIntensity: 0.8 }));
      }
      const facadeTex = makeFacadeTextTexture('R&D CENTER', '#0a0a0a', '#ffffff');
      texturedPlane(grp, facadeTex, 0, 0.52, 0.391, 0.95, 0.08, 0, 0.4);
      rooftopPanel(grp, '2', '칩·R&D', 'Apple Silicon 설계 및\n소프트웨어·기술 혁신', 0, 1.05, 0);
      const mchipTex = makeMChipAdTexture();
      texturedPlane(grp, mchipTex, 0.78, 0.42, 0.15, 0.42, 0.27, -Math.PI / 8, 0.4);
      cyl(grp, 'mchip post', 0.78, 0.18, 0.15, 0.015, 0.2, M.silver, 8);
      const platformTex = makePlatformListTexture();
      texturedPlane(grp, platformTex, 0.78, 0.55, -0.25, 0.26, 0.62, -Math.PI / 6, 0.4);
      cyl(grp, 'platform post', 0.78, 0.16, -0.25, 0.015, 0.22, M.silver, 8);
      return grp;
    }

    function createManufacturing(g, cx, cy, cz) {
      const grp = new THREE.Group();
      grp.position.set(cx, cy, cz);
      g.add(grp);
      box(grp, 'mfg body', 0, 0.3, 0, 1.5, 0.55, 0.7, M.appleWhite);
      box(grp, 'mfg roof', 0, 0.585, 0, 1.55, 0.04, 0.75, M.silver);
      box(grp, 'mfg base', 0, 0.04, 0, 1.55, 0.06, 0.78, M.platform);
      for (let i = 0; i < 6; i++) {
        const x = -0.6 + i * 0.24;
        const sawT = new THREE.Mesh(
          new THREE.BoxGeometry(0.16, 0.08, 0.7),
          M.metalDark
        );
        sawT.position.set(x, 0.66, 0);
        grp.add(sawT);
        const skylight = new THREE.Mesh(
          new THREE.PlaneGeometry(0.12, 0.66),
          M.warmWindow.clone()
        );
        skylight.position.set(x + 0.04, 0.68, 0);
        skylight.rotation.y = Math.PI / 3;
        grp.add(skylight);
      }
      for (let i = 0; i < 3; i++) {
        const dx = -0.4 + i * 0.4;
        box(grp, `mfg dock ${i}`, dx, 0.18, 0.355, 0.25, 0.26, 0.018, M.metalDark);
        box(grp, `mfg warn ${i}`, dx, 0.06, 0.36, 0.27, 0.012, 0.005, mat('#ffcf3a', { emissive: '#ffcf3a', emissiveIntensity: 0.4 }));
      }
      for (let i = 0; i < 4; i++) {
        const sx = -0.55 + i * 0.37;
        cyl(grp, `mfg stack ${i}`, sx, 0.78, -0.28, 0.05, 0.32, M.metalDark, 14);
      }
      box(grp, 'mfg duct', 0.5, 0.74, 0.25, 0.5, 0.18, 0.2, M.silver);
      const mfgTex = makeFacadeTextTexture('PARTNER MANUFACTURING', '#0a0a0a', '#ffffff');
      texturedPlane(grp, mfgTex, 0, 0.5, 0.366, 1.3, 0.08, 0, 0.4);
      rooftopPanel(grp, '3', '제품 제조', '글로벌 파트너사의 생산·\n품질 관리 및 공급망 운영', 0, 1.1, 0, 0.95, 0.34);
      createTruck(grp, -0.6, 0.04, 0.55, 0.9);
      createTruck(grp, 0.3, 0.04, 0.55, 0.9);
      for (let i = 0; i < 4; i++) {
        box(grp, `mfg crate ${i}`, -0.65 + i * 0.18, 0.13, 0.7, 0.12, 0.12, 0.12, mat('#8a6440', { roughness: .8 }));
      }
      return grp;
    }

    function createAppleStore(g, cx, cy, cz) {
      const grp = new THREE.Group();
      grp.position.set(cx, cy, cz);
      g.add(grp);
      box(grp, 'store cube', 0, 0.35, 0, 0.75, 0.65, 0.75, M.glass);
      const edges = [
        [-0.375, 0.025, -0.375], [0.375, 0.025, -0.375], [-0.375, 0.025, 0.375], [0.375, 0.025, 0.375],
        [-0.375, 0.675, -0.375], [0.375, 0.675, -0.375], [-0.375, 0.675, 0.375], [0.375, 0.675, 0.375]
      ];
      edges.slice(0, 4).forEach((p, i) => {
        cyl(grp, `store post ${i}`, p[0], 0.35, p[2], 0.015, 0.65, M.silver, 8);
      });
      box(grp, 'store top beam x1', 0, 0.675, -0.375, 0.78, 0.025, 0.025, M.silver);
      box(grp, 'store top beam x2', 0, 0.675, 0.375, 0.78, 0.025, 0.025, M.silver);
      box(grp, 'store top beam z1', -0.375, 0.675, 0, 0.025, 0.025, 0.78, M.silver);
      box(grp, 'store top beam z2', 0.375, 0.675, 0, 0.025, 0.025, 0.78, M.silver);
      box(grp, 'store base', 0, 0.025, 0, 0.9, 0.05, 0.9, M.platform);
      const logoTex = makeAppleLogoTexture('#0a0a0a', '#ffffff');
      const logoMat = new THREE.MeshStandardMaterial({
        map: logoTex, transparent: true,
        emissive: '#ffffff', emissiveMap: logoTex, emissiveIntensity: .35, roughness: .35
      });
      const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), logoMat);
      logo.position.set(0, 0.4, 0.376);
      grp.add(logo);
      box(grp, 'store table 1', -0.15, 0.13, 0, 0.18, 0.04, 0.55, M.appleWhite);
      box(grp, 'store table 2', 0.15, 0.13, 0, 0.18, 0.04, 0.55, M.appleWhite);
      [-0.2, -0.05, 0.1, 0.25].forEach((dz, i) => {
        const onLeft = i % 2 === 0;
        createIPhoneMini(grp, onLeft ? -0.15 : 0.15, 0.16, dz, 0.55);
      });
      const storeTex = makeFacadeTextTexture('Apple Store', '#ffffff', '#0a0a0a');
      texturedPlane(grp, storeTex, 0, 0.13, 0.39, 0.5, 0.05, 0, 0.2);
      rooftopPanel(grp, '4', '리테일·스토어', '전 세계 Apple Store를 통한\n고객 경험 제공', 0, 1.05, 0);
      const apTex = (() => {
        const c = document.createElement('canvas');
        c.width = 384; c.height = 512;
        const ctx = c.getContext('2d')!;
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, c.width, c.height);
        drawAppleLogo(ctx, c.width/2, 200, 220, '#ffffff');
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 56px "Helvetica Neue", Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Apple', c.width/2, 410);
        ctx.fillText('Store', c.width/2, 470);
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
      })();
      texturedPlane(grp, apTex, -0.65, 0.35, 0.15, 0.32, 0.5, Math.PI / 10, 0.4);
      cyl(grp, 'ap post', -0.65, 0.08, 0.15, 0.015, 0.18, M.silver, 8);
      return grp;
    }

    function createAppleServices(g, cx, cy, cz) {
      const grp = new THREE.Group();
      grp.position.set(cx, cy, cz);
      g.add(grp);
      box(grp, 'svc base', 0, 0.04, 0, 1.4, 0.08, 0.5, M.platform);
      cyl(grp, 'svc post L', -0.55, 0.3, -0.15, 0.025, 0.4, M.metalDark, 12);
      cyl(grp, 'svc post R', 0.55, 0.3, -0.15, 0.025, 0.4, M.metalDark, 12);
      const svcTex = makeAppleServicesTexture();
      texturedPlane(grp, svcTex, 0, 0.55, -0.13, 1.3, 0.6, 0, 0.45);
      const garden = new THREE.Mesh(
        new THREE.CircleGeometry(0.55, 32),
        M.grass
      );
      garden.rotation.x = -Math.PI / 2;
      garden.position.set(0, 0.085, 0.15);
      grp.add(garden);
      tree(grp, -0.4, 0.2, 0.32);
      tree(grp, 0.4, 0.2, 0.32);
      tree(grp, 0, 0.3, 0.32);
      rooftopPanel(grp, '5', '서비스·생태계', '하드웨어·소프트웨어·서비스의\n통합 경험 제공', 0, 1.05, -0.13, 0.95, 0.34);
      return grp;
    }

    function createEcosystem(g, cx, cy, cz) {
      const grp = new THREE.Group();
      grp.position.set(cx, cy, cz);
      g.add(grp);
      box(grp, 'eco base', 0, 0.06, 0, 1.4, 0.12, 0.85, mat('#181820', { roughness: .4 }));
      box(grp, 'eco screen base', 0, 0.13, 0, 1.36, 0.012, 0.82, mat('#0a0a0a', { roughness: .3, emissive: '#1a1a2a', emissiveIntensity: .25 }));
      const macbook = createMacBook(grp, -0.4, 0.135, 0.05, 1.0);
      const watchObj = createAppleWatch(grp, 0.0, 0.18, 0.1, 0.9);
      const airpods = createAirPodsCase(grp, 0.0, 0.18, -0.18, 1.2);
      const phoneObj = createIPhoneMini(grp, 0.25, 0.22, 0.05, 1.0);
      phoneObj.group.rotation.z = Math.PI / 10;
      const iCloud = createICloud(grp, 0.5, 0.3, 0.0, 1.0);
      const linkColor = mat('#4ab8e8', { emissive: '#4ab8e8', emissiveIntensity: 1.5 });
      [
        [-0.4, 0.16, 0.05, 0.0, 0.16, 0.1],
        [0.0, 0.16, 0.1, 0.25, 0.16, 0.05],
        [0.25, 0.16, 0.05, 0.5, 0.16, 0.0]
      ].forEach((seg) => {
        const [x1, y1, z1, x2, y2, z2] = seg;
        const dx = x2 - x1, dz = z2 - z1;
        const len = Math.sqrt(dx*dx + dz*dz);
        const link = new THREE.Mesh(new THREE.BoxGeometry(len, 0.005, 0.012), linkColor);
        link.position.set((x1+x2)/2, y1, (z1+z2)/2);
        link.rotation.y = -Math.atan2(dz, dx);
        grp.add(link);
      });
      const icloudTex = makeFacadeTextTexture('iCloud', '#0a0a0a', '#4ab8e8');
      texturedPlane(grp, icloudTex, 0.5, 0.16, 0.32, 0.22, 0.06, 0, 0.4);
      rooftopPanel(grp, '6', '고객 락인', '하드웨어·소프트웨어·서비스가\n연결된 강력한 생태계', 0, 0.92, 0, 0.95, 0.34);
      return { group: grp, macbook, watch: watchObj, iphone: phoneObj };
    }

    function buildAppleCampusDiorama() {
      const g = new THREE.Group();

      box(g, 'plinth', 0, -0.13, 0, gx(5.6), .26, gx(5.0), M.base);
      box(g, 'platform', 0, .02, 0, gx(5.1), .12, gx(4.5), M.platform);

      const roadRingOuter = 1.85;
      const roadRingInner = 1.6;
      const roadRing = new THREE.Mesh(
        new THREE.RingGeometry(roadRingInner, roadRingOuter, 64),
        M.road
      );
      roadRing.position.set(0, 0.084, 0);
      roadRing.rotation.x = -Math.PI / 2;
      g.add(roadRing);
      const laneRing = new THREE.Mesh(
        new THREE.RingGeometry((roadRingInner + roadRingOuter)/2 - 0.005, (roadRingInner + roadRingOuter)/2 + 0.005, 64),
        mat('#ffffff', { roughness: .5 })
      );
      laneRing.position.set(0, 0.086, 0);
      laneRing.rotation.x = -Math.PI / 2;
      g.add(laneRing);

      const accessRoads = [
        [0, 0, -2.5, 0.35, 0.7], // 북
        [0, 0, 2.5, 0.35, 0.7],  // 남
        [-2.7, 0, 0, 0.7, 0.35], // 서
        [2.7, 0, 0, 0.7, 0.35]   // 동
      ];
      accessRoads.forEach(([x, _, z, w, d]) => {
        box(g, 'access road', x, 0.084, z, w, 0.012, d, M.road);
      });

      const park = createAppleParkRing(g, 0, 0.13, 0);

      // ===== 위성 6동 배치 =====
      const studio = createDesignStudio(g, -2.45, 0.08, -1.7);
      const rd = createRDCenter(g, 2.45, 0.08, -1.7);
      const mfg = createManufacturing(g, 0, 0.08, -2.45);
      const store = createAppleStore(g, -2.3, 0.08, 1.7);
      const svc = createAppleServices(g, 0, 0.08, 2.35);
      const eco = createEcosystem(g, 2.4, 0.08, 1.85);

      const cars: { group: THREE.Group; baseAngle: number; radius: number }[] = [];
      const carColors = ['#e8e8e8', '#1c1c1e', '#aeb4bd', '#ffffff', '#2a2a30'];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const r = (roadRingInner + roadRingOuter) / 2;
        const car = createCar(g, Math.cos(a)*r, 0.1, Math.sin(a)*r, carColors[i % carColors.length], -a + Math.PI/2);
        cars.push({ group: car, baseAngle: a, radius: r });
      }
      createCar(g, 0, 0.1, -2.6, '#ffffff', 0);
      createCar(g, 2.7, 0.1, 0.4, '#1c1c1e', Math.PI/2);

      const treeSpots = [
        [-2.95, -2.7], [2.95, -2.7], [-2.95, 2.7], [2.95, 2.7],
        [-3.0, 0], [3.0, 0], [0, -3.0], [0, 3.0],
        [-1.5, -2.85], [1.5, -2.85], [-1.5, 2.85], [1.5, 2.85]
      ];
      treeSpots.forEach(([x, z]) => tree(g, x, z, 0.45));

      const dataPaths = [];
      const satellites = [
        { name: 'studio', x: -2.45, y: 0.7, z: -1.7 },
        { name: 'rd', x: 2.45, y: 0.7, z: -1.7 },
        { name: 'mfg', x: 0, y: 0.7, z: -2.45 },
        { name: 'store', x: -2.3, y: 0.7, z: 1.7 },
        { name: 'svc', x: 0, y: 0.7, z: 2.35 },
        { name: 'eco', x: 2.4, y: 0.4, z: 1.85 }
      ];
      const satSplashLights = [];
      satellites.forEach((sat, idx) => {
        const angle = Math.atan2(sat.z, sat.x);
        const start = new THREE.Vector3(Math.cos(angle) * 1.45, 0.6, Math.sin(angle) * 1.45);
        const mid = new THREE.Vector3((start.x + sat.x)/2, 1.4, (start.z + sat.z)/2);
        const end = new THREE.Vector3(sat.x, sat.y, sat.z);
        const curve = new THREE.CatmullRomCurve3([start, mid, end]);
        const beads = [];
        const beadMat = new THREE.MeshStandardMaterial({
          color: C.hotData, emissive: C.hotData, emissiveIntensity: 2.0, roughness: .25
        });
        for (let i = 0; i < 5; i++) {
          const b = new THREE.Mesh(new THREE.SphereGeometry(.055, 14, 10), beadMat);
          const bLight = new THREE.PointLight(C.hotData, 0.18, 0.6);
          b.add(bLight);
          g.add(b);
          beads.push({ mesh: b, light: bLight, offset: i / 5 });
        }
        const splash = new THREE.PointLight(C.hotData, 0, 1.4);
        splash.position.set(sat.x, sat.y + 0.1, sat.z);
        g.add(splash);
        satSplashLights.push(splash);
        dataPaths.push({ curve, beads, speed: 0.07 + idx * 0.008 });
      });

      const moneyPaths = [];
      satellites.forEach((sat, idx) => {
        const start = new THREE.Vector3(sat.x, sat.y + 0.3, sat.z);
        const mid = new THREE.Vector3(sat.x / 2, 2.0, sat.z / 2);
        const end = new THREE.Vector3(0, 1.4, 0); // 본사 중앙 위
        const curve = new THREE.CatmullRomCurve3([start, mid, end]);
        const coins = [];
        for (let i = 0; i < 3; i++) {
          const coin = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, 0.014, 16),
            M.goldCoin.clone()
          );
          g.add(coin);
          coins.push({ mesh: coin, offset: i / 3 });
        }
        moneyPaths.push({ curve, coins, speed: 0.05 + idx * 0.004 });
      });

      const goldGlow = new THREE.PointLight('#ffd700', 0.5, 2.5);
      goldGlow.position.set(0, 1.4, 0);
      g.add(goldGlow);

      const parkGlow = new THREE.PointLight('#fff2c8', .6, 4);
      parkGlow.position.set(0, 0.6, 0);
      g.add(parkGlow);

      g.userData = {
        parkWindowWaves: park.windowWaves,
        dataPaths, satSplashLights, moneyPaths, goldGlow,
        cars,
        eco
      };
      return g;
    }
export function createAppleCampus(): THREE.Group {
  const root = buildAppleCampusDiorama();
  const SPEED = 0.4;
  root.userData.tick = (time: number) => {
    const t = time * SPEED;
    const tRaw = time;
    const u = root.userData as AppleCampusRuntime;

    u.parkWindowWaves.forEach((w) => {
      const wave = 0.4 + 0.6 * Math.max(0, Math.sin(t * 1.2 + w.phase * Math.PI * 2));
      (w.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = wave;
    });

    u.dataPaths.forEach((path, pIdx) => {
      path.beads.forEach((b, idx) => {
        const progress = ((tRaw * path.speed) + b.offset) % 1;
        const pos = path.curve.getPoint(progress);
        b.mesh.position.copy(pos);
        const pulse = 1.2 + 0.5 * Math.sin(t * 3 + idx);
        (b.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
        b.light.intensity = 0.16 + 0.1 * Math.sin(t * 3.5 + idx);
        if (progress > 0.92) {
          u.satSplashLights[pIdx].intensity = 1.4 * (progress - 0.92) / 0.08;
        }
      });
      u.satSplashLights[pIdx].intensity *= 0.94;
    });

    u.moneyPaths.forEach((path) => {
      path.coins.forEach((c, idx) => {
        const progress = ((tRaw * path.speed) + c.offset) % 1;
        const pos = path.curve.getPoint(progress);
        c.mesh.position.copy(pos);
        c.mesh.rotation.x = Math.PI / 2;
        c.mesh.rotation.y = tRaw * 4 + idx;
        (c.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity =
          1.4 + 0.4 * Math.sin(t * 2.5 + idx);
      });
    });
    u.goldGlow.intensity = 0.4 + 0.25 * Math.sin(t * 1.5);

    u.cars.forEach((c) => {
      const a = c.baseAngle + tRaw * 0.1;
      c.group.position.x = Math.cos(a) * c.radius;
      c.group.position.z = Math.sin(a) * c.radius;
      c.group.rotation.y = -a + Math.PI / 2;
    });

    if (u.eco) {
      (u.eco.macbook.screen.material as THREE.MeshStandardMaterial).emissiveIntensity =
        1.0 + 0.4 * Math.sin(t * 1.4);
      (u.eco.watch.screen.material as THREE.MeshStandardMaterial).emissiveIntensity =
        1.1 + 0.4 * Math.sin(t * 1.6);
      (u.eco.iphone.screen.material as THREE.MeshStandardMaterial).emissiveIntensity =
        1.1 + 0.4 * Math.sin(t * 1.8);
    }

    root.rotation.y = Math.sin(t * 0.2) * 0.008;
  };
  return root;
}

interface AppleCampusRuntime {
  parkWindowWaves: { mesh: THREE.Mesh; phase: number }[];
  dataPaths: {
    curve: THREE.CatmullRomCurve3;
    beads: { mesh: THREE.Mesh; light: THREE.PointLight; offset: number }[];
    speed: number;
  }[];
  satSplashLights: THREE.PointLight[];
  moneyPaths: {
    curve: THREE.CatmullRomCurve3;
    coins: { mesh: THREE.Mesh; offset: number }[];
    speed: number;
  }[];
  goldGlow: THREE.PointLight;
  cars: { group: THREE.Group; baseAngle: number; radius: number }[];
  eco?: {
    macbook: { screen: THREE.Mesh };
    watch: { screen: THREE.Mesh };
    iphone: { screen: THREE.Mesh };
  };
}
