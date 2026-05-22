import * as THREE from 'three';

type CustomBuilder = (group: THREE.Group, height: number, fp: number) => void;

/** Brand accents only — main tower body stays 등락색 (TreemapScene). */
export const CUSTOM_DETAILS: Record<string, CustomBuilder> = {
  // Logo + ticker handled globally; optional sector accent 없음
  AAPL: (_group, _height, _fp) => {},

  MSFT: (group, height, fp) => {
    const colors = [0xf25022, 0x7fba00, 0x00a4ef, 0xffb900];
    const stripH = height * 0.12;
    colors.forEach((c, i) => {
      const angle = (i / 4) * Math.PI * 2;
      const geo = new THREE.PlaneGeometry(fp * 0.35, stripH);
      const mat = new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
      const strip = new THREE.Mesh(geo, mat);
      const offset = fp * 0.45;
      strip.position.set(Math.cos(angle) * offset, height * 0.65, Math.sin(angle) * offset);
      strip.lookAt(0, height * 0.65, 0);
      strip.rotateY(Math.PI);
      group.add(strip);
    });
  },

  TSLA: (group, _height, fp) => {
    const car = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.3, metalness: 0.6 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(fp * 0.5, fp * 0.08, fp * 0.2), bodyMat);
    body.position.y = fp * 0.08;
    car.add(body);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(fp * 0.3, fp * 0.06, fp * 0.18), bodyMat);
    roof.position.y = fp * 0.15;
    car.add(roof);

    const wGeo = new THREE.CylinderGeometry(fp * 0.04, fp * 0.04, fp * 0.04, 8);
    const wMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    const positions: [number, number][] = [[-fp * 0.18, -fp * 0.08], [fp * 0.18, -fp * 0.08], [-fp * 0.18, fp * 0.08], [fp * 0.18, fp * 0.08]];
    for (const [x, z] of positions) {
      const w = new THREE.Mesh(wGeo, wMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(x, fp * 0.04, z);
      car.add(w);
    }
    car.position.set(fp * 0.55, 0, 0);
    group.add(car);
  },

  UNH: (group, height, fp) => {
    const crossMat = new THREE.MeshBasicMaterial({ color: 0xc41e3a, side: THREE.DoubleSide });
    const vert = new THREE.Mesh(new THREE.PlaneGeometry(fp * 0.08, fp * 0.25), crossMat);
    const horz = new THREE.Mesh(new THREE.PlaneGeometry(fp * 0.25, fp * 0.08), crossMat);
    vert.position.set(0, height * 0.75, fp * 0.45);
    horz.position.set(0, height * 0.75, fp * 0.451);
    group.add(vert, horz);

    const shield = new THREE.Mesh(
      new THREE.BoxGeometry(fp * 0.18, fp * 0.22, fp * 0.03),
      new THREE.MeshStandardMaterial({ color: 0x0a4d8c, metalness: 0.5, roughness: 0.4 }),
    );
    shield.position.set(fp * 0.55, fp * 0.14, 0);
    group.add(shield);

    const miniV = new THREE.Mesh(
      new THREE.PlaneGeometry(fp * 0.04, fp * 0.1),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }),
    );
    miniV.position.set(fp * 0.55, fp * 0.14, fp * 0.02);
    group.add(miniV);
  },

  BA: (group, _height, fp) => {
    const rwMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.95 });
    const runway = new THREE.Mesh(new THREE.PlaneGeometry(fp * 1.5, fp * 0.3), rwMat);
    runway.rotation.x = -Math.PI / 2;
    runway.position.set(fp * 1.0, 0.02, fp * 0.5);
    group.add(runway);

    const dashMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let i = 0; i < 5; i++) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(fp * 0.12, fp * 0.02), dashMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(fp * (0.45 + i * 0.25), 0.03, fp * 0.5);
      group.add(dash);
    }

    const plane = new THREE.Group();
    const planeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.5 });
    const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(fp * 0.06, fp * 0.06, fp * 0.6, 8), planeMat);
    fuselage.rotation.z = Math.PI / 2;
    plane.add(fuselage);

    const wings = new THREE.Mesh(new THREE.BoxGeometry(fp * 0.14, fp * 0.02, fp * 0.6), planeMat);
    plane.add(wings);

    const tail = new THREE.Mesh(new THREE.BoxGeometry(fp * 0.02, fp * 0.18, fp * 0.12), planeMat);
    tail.position.set(-fp * 0.26, fp * 0.1, 0);
    plane.add(tail);

    plane.position.set(fp * 1.0, fp * 0.15, fp * 0.5);
    group.add(plane);
  },

  GE: (group, height, fp) => {
    const turbine = new THREE.Group();
    const tH = height * 1.2;
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.4 });
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(fp * 0.03, fp * 0.05, tH, 8), towerMat);
    tower.position.y = tH / 2;
    turbine.add(tower);

    const hub = new THREE.Mesh(new THREE.SphereGeometry(fp * 0.06, 8, 8), towerMat);
    hub.position.y = tH;
    turbine.add(hub);

    const bladeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    for (let i = 0; i < 3; i++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(fp * 0.02, fp * 0.4, fp * 0.04), bladeMat);
      const angle = (i / 3) * Math.PI * 2;
      blade.position.set(Math.cos(angle) * fp * 0.2, tH + Math.sin(angle) * fp * 0.2, 0);
      blade.rotation.z = angle - Math.PI / 2;
      turbine.add(blade);
    }

    turbine.position.set(fp * 0.65, 0, 0);
    group.add(turbine);
  },
};
