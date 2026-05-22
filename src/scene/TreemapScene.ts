import type { SectorDef, StockRow } from '../types';
import { computeLayout, consolidateSingletons, type LayoutBalanceMode, type LayoutWeightMode, type StockRect } from '../layout/squarify';
import { TREE_MAP_HEIGHT, TREE_MAP_WIDTH } from '../layout/treemapLayoutConstants';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { fitBuildingModelToLot, loadBuildingTemplates, type BuildingTemplateLibrary } from './buildingTemplates';
import { attachBuildingTopLabel } from './buildingLabels';

export type NavigatorVisualMode = 'overview' | 'chg' | 'marketCap';
export type ViewMode = NavigatorVisualMode;

/** 시가총액 모드: 타일 면적이 이미 시총 비율이므로 빌딩은 구역을 그대로 채움. */
export function applyMarketCapFootprint(building: THREE.Group, _cap: number, _maxCap: number) {
  building.scale.set(1, 1, 1);
  building.userData.footprintRestXZ = 1;
}

function resetBuildingFootprintScale(building: THREE.Group) {
  building.scale.set(1, 1, 1);
  building.userData.footprintRestXZ = 1;
}

const DEFAULT_CAMERA_POS = [18, 24, 22] as const;
const DEFAULT_TARGET = [0, 0, 0] as const;

const CHANGE_COLORS = { up: '#D85A52', down: '#4F7FD8', flat: '#9A9A9A' } as const;

function getChangeColor(chg: number, halted: boolean): THREE.Color {
  if (halted) return new THREE.Color(CHANGE_COLORS.flat);
  if (chg > 0.1) return new THREE.Color(CHANGE_COLORS.up);
  if (chg < -0.1) return new THREE.Color(CHANGE_COLORS.down);
  return new THREE.Color(CHANGE_COLORS.flat);
}

/** Overview: 평탄한 스카이라인 (네온 구역 가독성). */
function overviewNeutralHeight(st: StockRow): number {
  const BASE = 3.05;
  const j = (tickerStyleSeed(st.t) % 19) / 19;
  return BASE + j * 0.38;
}

/** 등락: 높이로 등락 강도 (직육면체 스케일 기준, 범위는 과장 없이 약하게). */
function computeChgTowerHeight(st: StockRow): number {
  const BASE = 0.48;
  const UP_MAX = 4.85;
  const DOWN_MAX = 1.95;
  const SCALE = 5.2;
  if (st.halted) return 0.4;
  const chg = st.chg ?? 0;
  const norm = Math.min(1, Math.abs(chg) / SCALE);
  const curve = Math.sqrt(norm);
  if (chg >= 0) return BASE + curve * (UP_MAX - BASE);
  return BASE + curve * (DOWN_MAX - BASE);
}

export function getBuildingColor(stock: StockRow): THREE.Color {
  if (stock.halted) return new THREE.Color(0x555f70);
  const seed = tickerStyleSeed(stock.t);
  const l = 0.34 + ((seed % 13) / 13) * 0.12;
  return new THREE.Color().setHSL(0, 0, l);
}

function tickerStyleSeed(t: string): number {
  let h = 2166136261;
  for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619);
  return Math.abs(h);
}

const factorySectors = new Set(['Industrials', 'Energy', 'Materials']);

function tintSubtreeMeshesNeutral(root: THREE.Object3D, stock: StockRow) {
  const bodyColor = getBuildingColor(stock);
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const prev = child.material;
    let map: THREE.Texture | null = null;
    let normalMap: THREE.Texture | null = null;
    if (Array.isArray(prev)) {
      const pm = prev[0] as THREE.MeshStandardMaterial;
      map = pm?.map ?? null;
      normalMap = pm?.normalMap ?? null;
      prev.forEach((m) => m.dispose?.());
    } else {
      const pm = prev as THREE.MeshStandardMaterial;
      map = pm?.map ?? null;
      normalMap = pm?.normalMap ?? null;
      prev.dispose?.();
    }
    child.material = new THREE.MeshStandardMaterial({
      color: bodyColor.clone(),
      roughness: 0.52,
      metalness: 0.08,
      emissive: new THREE.Color(0x000000),
      map,
      normalMap,
    });
  });
}

const LOT_GUTTER = 0.02;

/** Overview 바닥: 분위기용 연한 초록 필드 (섹터 색으로 채우지 않음). */
const OVERVIEW_FLOOR_COLOR = 0x8fe6b8;
const OVERVIEW_FLOOR_OPACITY = 0.16;

/** 등락 모드 전용 — 함몰 박스가 비치도록 반투명 바닥. */
const CHG_FLOOR_COLOR = 0x0d1520;
const CHG_FLOOR_OPACITY = 0.35;

/** 시가총액 모드 바닥. */
const METRIC_FLOOR_COLOR = 0x05090d;
const METRIC_FLOOR_OPACITY = 0.11;

function lotFootprint(r: StockRect): { footW: number; footD: number } {
  return {
    footW: Math.max(0.4, r.w - LOT_GUTTER),
    footD: Math.max(0.4, r.h - LOT_GUTTER),
  };
}

/** 섹터 구역 외곽선 (바닥 면과 분리). layout (x,y) → THREE (x,z). */
function createSectorBoundaryLine(
  parent: THREE.Group,
  sx: number,
  sz: number,
  sw: number,
  sh: number,
  hex: string,
  sectorId: string,
): THREE.Line {
  const y = 0.15;
  const pts = [
    new THREE.Vector3(sx, y, sz),
    new THREE.Vector3(sx + sw, y, sz),
    new THREE.Vector3(sx + sw, y, sz + sh),
    new THREE.Vector3(sx, y, sz + sh),
    new THREE.Vector3(sx, y, sz),
  ];
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({
    color: new THREE.Color(hex),
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const line = new THREE.Line(geo, mat);
  line.userData.sectorBoundary = true;
  line.userData.sectorId = sectorId;
  parent.add(line);
  return line;
}

/** Overview 섹터만 보기 — 종목 타일 면 (섹터 색 + 밝기 변화). */
const STOCK_LOT_GAP = 0.05;

function stockLotFillColor(hex: string, ticker: string): THREE.Color {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  const bump = ((tickerStyleSeed(ticker) % 13) / 13 - 0.5) * 0.1;
  c.setHSL(hsl.h, hsl.s, THREE.MathUtils.clamp(hsl.l + bump, 0.2, 0.68));
  return c;
}

function createStockLotFillMesh(r: StockRect, hex: string, layoutSectorId: string): THREE.Mesh {
  const w = Math.max(0.12, r.w - STOCK_LOT_GAP * 2);
  const h = Math.max(0.12, r.h - STOCK_LOT_GAP * 2);
  const geo = new THREE.PlaneGeometry(w, h);
  const mat = new THREE.MeshBasicMaterial({
    color: stockLotFillColor(hex, r.ref.t),
    transparent: true,
    opacity: 0.52,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(r.x + r.w / 2, 0.07, r.y + r.h / 2);
  mesh.userData.stockLotFill = true;
  mesh.userData.stock = r.ref;
  mesh.userData.sectorId = layoutSectorId;
  mesh.visible = false;
  return mesh;
}

function createStockLotBoundaryLine(r: StockRect, hex: string, layoutSectorId: string): THREE.Line {
  const gap = STOCK_LOT_GAP;
  const x = r.x + gap;
  const z = r.y + gap;
  const w = Math.max(0.1, r.w - gap * 2);
  const h = Math.max(0.1, r.h - gap * 2);
  const y = 0.11;
  const pts = [
    new THREE.Vector3(x, y, z),
    new THREE.Vector3(x + w, y, z),
    new THREE.Vector3(x + w, y, z + h),
    new THREE.Vector3(x, y, z + h),
    new THREE.Vector3(x, y, z),
  ];
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const col = new THREE.Color(hex);
  const mat = new THREE.LineBasicMaterial({
    color: col,
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
  });
  const line = new THREE.Line(geo, mat);
  line.userData.stockLotBoundary = true;
  line.userData.stock = r.ref;
  line.userData.sectorId = layoutSectorId;
  line.visible = false;
  return line;
}

export class TreemapScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;
  readonly stockGroup = new THREE.Group();
  /** Overview · 섹터만 보기 — 종목 타일 면/경계. */
  readonly stockLotFillGroup = new THREE.Group();
  private readonly stockLotBoundaryRoot = new THREE.Group();
  /** 바닥 메시 — raycast·히트 영역 유지용 (`visible`로 끄지 않고 opacity로 조절). */
  readonly floorMesh: THREE.Mesh;
  readonly meshByStock = new Map<StockRow, THREE.Group>();
  private readonly sectorBoundsRoot: THREE.Group;
  private readonly disposables: THREE.Object3D[] = [];
  private readonly secById: Record<string, SectorDef>;
  /** 스냅샷 시점 최대 시총(십억 USD); footprint 스케일 기준. */
  private maxStockCap: number;
  private readonly sectorBoundaryLines: THREE.Line[] = [];
  private readonly stockLotBoundaryLines: THREE.Line[] = [];
  private sectorLayoutRects: { ref: string; x: number; y: number; w: number; h: number }[] = [];
  private readonly layoutSectorByTicker = new Map<string, string>();
  private overviewSectorOnly = false;
  private hoveredStockLot: StockRow | null = null;
  private hoveredSectorId: string | null = null;
  private camAnim = 0;
  private ro: ResizeObserver;
  private lastTick = performance.now();
  visualMode: NavigatorVisualMode = 'overview';

  /** 모드 전환 페이드 (0~1). */
  private buildingFadeMult = 1;
  private fadeRaf = 0;
  private modeTransitionGen = 0;

  private footprintLerpActive = false;
  private footprintGlobalLerpStart = 0;
  private footprintGlobalLerpEnd = 0;

  private layoutWeightMode: LayoutWeightMode = 'linear';
  private layoutBalanceMode: LayoutBalanceMode = 'balanced';
  private savedCameraBeforeChg: { pos: THREE.Vector3; target: THREE.Vector3 } | null = null;

  static async create(
    canvas: HTMLCanvasElement,
    stocks: StockRow[],
    sectors: SectorDef[],
    wrap: HTMLElement,
  ): Promise<TreemapScene> {
    const buildingLib = await loadBuildingTemplates();
    return new TreemapScene(canvas, stocks, sectors, wrap, buildingLib);
  }

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly stocks: StockRow[],
    sectors: SectorDef[],
    private readonly wrap: HTMLElement,
    private readonly buildingLib: BuildingTemplateLibrary | null = null,
  ) {
    this.secById = Object.fromEntries(sectors.map((s) => [s.id, s]));

    this.maxStockCap = Math.max(...stocks.map((s) => s.cap), 1e-9);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene.background = new THREE.Color(0x030508);
    this.scene.fog = new THREE.Fog(0x030508, 85, 270);

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 500);
    this.camera.position.set(DEFAULT_CAMERA_POS[0], DEFAULT_CAMERA_POS[1], DEFAULT_CAMERA_POS[2]);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
    this.controls.minDistance = 25;
    this.controls.maxDistance = 180;
    this.controls.target.set(DEFAULT_TARGET[0], DEFAULT_TARGET[1], DEFAULT_TARGET[2]);

    const amb = new THREE.AmbientLight(0xffffff, 0.42);
    this.scene.add(amb);
    const dir = new THREE.DirectionalLight(0xffffff, 1.08);
    dir.position.set(12, 22, 14);
    this.scene.add(dir);

    const TREE_W = TREE_MAP_WIDTH;
    const TREE_H = TREE_MAP_HEIGHT;
    const { sectorRects, stockRects } = computeLayout(stocks, TREE_W, TREE_H);
    this.sectorLayoutRects = sectorRects;
    const normalized = consolidateSingletons(stocks);
    for (const s of normalized) this.layoutSectorByTicker.set(s.t, s.s);

    const floorGeo = new THREE.PlaneGeometry(TREE_W + 12, TREE_H + 12);
    /** 조명에 하이라이트되어 하얗게 날아가지 않도록 Basic 유지 */
    const floorMat = new THREE.MeshBasicMaterial({
      color: OVERVIEW_FLOOR_COLOR,
      transparent: true,
      opacity: OVERVIEW_FLOOR_OPACITY,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.floorMesh = new THREE.Mesh(floorGeo, floorMat);
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.position.set(0, 0.018, 0);
    this.floorMesh.renderOrder = -25;
    this.floorMesh.userData.floorHitPlane = true;
    this.scene.add(this.track(this.floorMesh));

    const boundsRoot = new THREE.Group();
    boundsRoot.name = 'sectorBounds';
    this.sectorBoundsRoot = boundsRoot;
    this.scene.add(this.track(boundsRoot));
    this.stockLotFillGroup.name = 'stockLotFills';
    this.stockLotBoundaryRoot.name = 'stockLotBounds';
    this.scene.add(this.track(this.stockLotFillGroup));
    this.scene.add(this.track(this.stockLotBoundaryRoot));
    this.syncSectorBoundariesAndFills(sectorRects);
    this.applyFloorAndBoundaryStyleForVisualMode();

    this.scene.add(this.stockGroup);
    for (const r of stockRects) {
      this.addStockBuilding(r);
    }
    this.syncStockLotOverlays();

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(wrap);
    window.addEventListener('beforeunload', this.disposeAll);

    this.intro();
  }

  setVisualMode(mode: NavigatorVisualMode) {
    const prev = this.visualMode;
    if (prev === mode) return;

    const hadRunningFade = this.fadeRaf !== 0;
    if (hadRunningFade) {
      cancelAnimationFrame(this.fadeRaf);
      this.fadeRaf = 0;
      this.buildingFadeMult = 1;
      this.applyStockBuildingFadeMultiplier(1);
    }

    const gen = ++this.modeTransitionGen;
    this.footprintLerpActive = false;

    const fadeMs = 200;
    const fadeFrom = this.buildingFadeMult;

    const applyMidTransition = () => {
      if (gen !== this.modeTransitionGen) return;
      this.visualMode = mode;
      this.hoveredSectorId = null;
      if (mode !== 'overview' && this.overviewSectorOnly) {
        this.overviewSectorOnly = false;
        this.stockGroup.visible = true;
        this.setStockLotOverlayVisible(false);
      }
      if (mode !== 'chg') {
        for (const [, group] of this.meshByStock) this.removeChangeRoof(group);
      }

      if (mode === 'marketCap') {
        this.applyLayout('linear', 'cap');
      } else if (mode === 'chg') {
        if (prev !== 'chg') {
          this.savedCameraBeforeChg = {
            pos: this.camera.position.clone(),
            target: this.controls.target.clone(),
          };
          this.camera.position.y *= 0.75;
          this.controls.target.y = -0.5;
          this.controls.update();
        }
        this.applyLayout('log', 'balanced');
      } else if (prev === 'chg' || prev === 'marketCap') {
        this.applyLayout('linear', 'balanced');
        if (prev === 'chg' && this.savedCameraBeforeChg) {
          this.camera.position.copy(this.savedCameraBeforeChg.pos);
          this.controls.target.copy(this.savedCameraBeforeChg.target);
          this.controls.update();
          this.savedCameraBeforeChg = null;
        }
      }

      for (const [, group] of this.meshByStock) {
        const r = group.userData.rect as StockRect;
        const st = group.userData.stock as StockRow;
        this.buildStockBuildingContent(group, r, st);
      }
      if (mode === 'marketCap') {
        this.maxStockCap = Math.max(...this.stocks.map((s) => s.cap), 1e-9);
        for (const [st, g] of this.meshByStock) {
          applyMarketCapFootprint(g, st.cap, this.maxStockCap);
        }
      } else {
        for (const [, g] of this.meshByStock) resetBuildingFootprintScale(g);
      }
      this.applyFloorAndBoundaryStyleForVisualMode();

      this.runBuildingFade(0, 1, fadeMs, gen, () => {
        if (gen !== this.modeTransitionGen) return;
        this.buildingFadeMult = 1;
        this.applyStockBuildingFadeMultiplier(1);
      });
    };

    this.runBuildingFade(fadeFrom, 0, fadeMs, gen, applyMidTransition);
  }

  private runBuildingFade(from: number, to: number, ms: number, gen: number, done: () => void) {
    if (this.fadeRaf) cancelAnimationFrame(this.fadeRaf);
    const t0 = performance.now();
    const step = (now: number) => {
      if (gen !== this.modeTransitionGen) return;
      const k = Math.min(1, (now - t0) / ms);
      const v = from + (to - from) * k;
      this.buildingFadeMult = v;
      this.applyStockBuildingFadeMultiplier(v);
      if (k < 1) this.fadeRaf = requestAnimationFrame(step);
      else {
        this.fadeRaf = 0;
        done();
      }
    };
    this.fadeRaf = requestAnimationFrame(step);
  }

  private applyStockBuildingFadeMultiplier(multiplier: number) {
    const m = THREE.MathUtils.clamp(multiplier, 0, 1);
    for (const [, group] of this.meshByStock) {
      group.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh) && !(obj instanceof THREE.Sprite)) return;
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const raw of mats) {
          if (!raw || !('opacity' in raw)) continue;
          const mat = raw as THREE.MeshStandardMaterial & { userData: { fadeOpacityBase?: number } };
          if (mat.userData.fadeOpacityBase === undefined) {
            mat.userData.fadeOpacityBase = mat.opacity ?? 1;
            mat.transparent = true;
          }
          mat.opacity = Math.max(0, Math.min(1, mat.userData.fadeOpacityBase * m));
        }
      });
    }
  }

  /** 동일 모드에서 시총 값만 바뀐 경우 footprint를 300ms에 걸쳐 보간. */
  private startFootprintCapLerpIfNeeded() {
    if (this.visualMode !== 'marketCap') return;
    for (const [, g] of this.meshByStock) applyMarketCapFootprint(g, 0, 1);
  }

  private updateFootprintCapLerp(now: number) {
    if (!this.footprintLerpActive || this.visualMode !== 'marketCap') return;
    if (now >= this.footprintGlobalLerpEnd) {
      this.footprintLerpActive = false;
      for (const [st, g] of this.meshByStock) {
        applyMarketCapFootprint(g, st.cap, this.maxStockCap);
      }
      return;
    }
    const e = Math.min(1, (now - this.footprintGlobalLerpStart) / (this.footprintGlobalLerpEnd - this.footprintGlobalLerpStart));
    for (const [, g] of this.meshByStock) {
      const from = g.userData.fpLerpFrom as number;
      const to = g.userData.fpLerpTo as number;
      const s = THREE.MathUtils.lerp(from, to, e);
      g.scale.set(s, 1, s);
      g.userData.footprintRestXZ = s;
    }
  }

  /** Overview: 건물 숨기고 종목 타일(섹터 색)만 표시. */
  setOverviewSectorOnly(enabled: boolean) {
    if (this.visualMode !== 'overview') enabled = false;
    if (this.overviewSectorOnly === enabled) return;
    this.overviewSectorOnly = enabled;
    this.stockGroup.visible = !enabled;
    this.setStockLotOverlayVisible(enabled);
    if (!enabled) this.setHoveredStockLot(null);
    this.updateSectorBoundaryHighlight();
    this.updateStockLotHighlight();
  }

  private setStockLotOverlayVisible(visible: boolean) {
    for (const child of this.stockLotFillGroup.children) child.visible = visible;
    for (const line of this.stockLotBoundaryLines) line.visible = visible;
  }

  get isOverviewSectorOnly(): boolean {
    return this.overviewSectorOnly;
  }

  getStocksInLayoutSector(sectorId: string): StockRow[] {
    return this.stocks.filter((st) => (this.layoutSectorByTicker.get(st.t) ?? st.s) === sectorId);
  }

  pickStockLotFromRaycaster(raycaster: THREE.Raycaster): StockRow | null {
    const hits = raycaster.intersectObjects(this.stockLotFillGroup.children, false);
    if (hits.length > 0) {
      return (hits[0].object.userData.stock as StockRow) ?? null;
    }
    const floorHits = raycaster.intersectObject(this.floorMesh, false);
    if (floorHits.length === 0) return null;
    const p = floorHits[0].point;
    for (const [, group] of this.meshByStock) {
      const r = group.userData.rect as StockRect;
      if (p.x >= r.x && p.x <= r.x + r.w && p.z >= r.y && p.z <= r.y + r.h) {
        return group.userData.stock as StockRow;
      }
    }
    return null;
  }

  setHoveredStockLot(st: StockRow | null) {
    if (this.hoveredStockLot === st) return;
    this.hoveredStockLot = st;
    this.updateStockLotHighlight();
  }

  private updateStockLotHighlight() {
    const hi = this.hoveredStockLot;
    for (const child of this.stockLotFillGroup.children) {
      if (!(child instanceof THREE.Mesh)) continue;
      const mat = child.material as THREE.MeshBasicMaterial;
      const stock = child.userData.stock as StockRow;
      mat.opacity = hi && stock === hi ? 0.78 : 0.52;
    }
    for (const line of this.stockLotBoundaryLines) {
      const mat = line.material as THREE.LineBasicMaterial;
      const stock = line.userData.stock as StockRow;
      mat.opacity = hi && stock === hi ? 0.95 : 0.62;
    }
  }

  getLayoutSectorId(st: StockRow): string {
    return this.layoutSectorByTicker.get(st.t) ?? st.s;
  }

  pickSectorFromRaycaster(raycaster: THREE.Raycaster): string | null {
    const st = this.pickStockLotFromRaycaster(raycaster);
    if (st) return this.layoutSectorByTicker.get(st.t) ?? st.s;
    const floorHits = raycaster.intersectObject(this.floorMesh, false);
    if (floorHits.length === 0) return null;
    const p = floorHits[0].point;
    return this.pickSectorAtWorld(p.x, p.z);
  }

  pickSectorAtWorld(x: number, z: number): string | null {
    for (const sr of this.sectorLayoutRects) {
      if (x >= sr.x && x <= sr.x + sr.w && z >= sr.y && z <= sr.y + sr.h) return sr.ref;
    }
    return null;
  }

  /** 호버 중인 종목의 섹터 경계선만 살짝 강조 (Overview에서 특히 보조). */
  setHoveredSector(sectorId: string | null) {
    if (this.hoveredSectorId === sectorId) return;
    this.hoveredSectorId = sectorId;
    this.updateSectorBoundaryHighlight();
  }

  private boundaryBaseOpacity(): number {
    if (this.overviewSectorOnly) return 0.72;
    return this.visualMode === 'overview' ? 0.52 : 0.68;
  }

  private boundaryHoverOpacity(): number {
    if (this.overviewSectorOnly) return 0.95;
    return this.visualMode === 'overview' ? 0.78 : 0.88;
  }

  private updateSectorBoundaryHighlight() {
    const base = this.boundaryBaseOpacity();
    const hi = this.boundaryHoverOpacity();
    const id = this.hoveredSectorId;
    for (const line of this.sectorBoundaryLines) {
      const mat = line.material as THREE.LineBasicMaterial;
      const sid = line.userData.sectorId as string;
      mat.opacity = id != null && sid === id ? hi : base;
    }
  }

  private applyFloorAndBoundaryStyleForVisualMode() {
    const mat = this.floorMesh.material as THREE.MeshBasicMaterial;
    if (this.visualMode === 'overview') {
      mat.color.set(OVERVIEW_FLOOR_COLOR);
      mat.opacity = OVERVIEW_FLOOR_OPACITY;
      mat.depthWrite = false;
      this.floorMesh.renderOrder = -25;
    } else if (this.visualMode === 'chg') {
      mat.color.set(CHG_FLOOR_COLOR);
      mat.opacity = CHG_FLOOR_OPACITY;
      mat.transparent = true;
      mat.depthWrite = false;
      this.floorMesh.renderOrder = 1;
    } else {
      mat.color.set(METRIC_FLOOR_COLOR);
      mat.opacity = METRIC_FLOOR_OPACITY;
      mat.depthWrite = false;
      this.floorMesh.renderOrder = -25;
    }
    this.updateSectorBoundaryHighlight();
  }

  private syncSectorBoundariesAndFills(
    sectorRects: { ref: string; x: number; y: number; w: number; h: number }[],
  ) {
    this.sectorLayoutRects = sectorRects;
    while (this.sectorBoundsRoot.children.length > 0) {
      const child = this.sectorBoundsRoot.children[0];
      this.sectorBoundsRoot.remove(child);
      if (child instanceof THREE.Line) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    }
    this.sectorBoundaryLines.length = 0;

    for (const sr of sectorRects) {
      const sec = this.secById[sr.ref];
      const color = sec?.color ?? '#888888';
      const line = createSectorBoundaryLine(
        this.sectorBoundsRoot,
        sr.x,
        sr.y,
        sr.w,
        sr.h,
        color,
        sr.ref,
      );
      this.sectorBoundaryLines.push(line);
    }
  }

  private syncStockLotOverlays() {
    while (this.stockLotFillGroup.children.length > 0) {
      const child = this.stockLotFillGroup.children[0];
      this.stockLotFillGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    }
    while (this.stockLotBoundaryRoot.children.length > 0) {
      const child = this.stockLotBoundaryRoot.children[0];
      this.stockLotBoundaryRoot.remove(child);
      if (child instanceof THREE.Line) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    }
    this.stockLotBoundaryLines.length = 0;

    for (const [, group] of this.meshByStock) {
      const r = group.userData.rect as StockRect;
      const st = group.userData.stock as StockRow;
      const layoutSec = this.layoutSectorByTicker.get(st.t) ?? st.s;
      const sec = this.secById[layoutSec];
      const color = sec?.color ?? '#888888';
      const fill = createStockLotFillMesh(r, color, layoutSec);
      fill.visible = this.overviewSectorOnly;
      this.stockLotFillGroup.add(fill);
      const border = createStockLotBoundaryLine(r, color, layoutSec);
      border.visible = this.overviewSectorOnly;
      this.stockLotBoundaryRoot.add(border);
      this.stockLotBoundaryLines.push(border);
    }
    this.updateStockLotHighlight();
  }

  private rebuildSectorBoundaries(sectorRects: { ref: string; x: number; y: number; w: number; h: number }[]) {
    this.syncSectorBoundariesAndFills(sectorRects);
  }

  private applyLayout(weightMode: LayoutWeightMode, balanceMode: LayoutBalanceMode = 'balanced') {
    if (this.layoutWeightMode === weightMode && this.layoutBalanceMode === balanceMode) return;
    this.layoutWeightMode = weightMode;
    this.layoutBalanceMode = balanceMode;
    const { sectorRects, stockRects } = computeLayout(this.stocks, TREE_MAP_WIDTH, TREE_MAP_HEIGHT, {
      weightMode,
      balanceMode,
    });
    this.rebuildSectorBoundaries(sectorRects);
    for (const r of stockRects) {
      const group = this.meshByStock.get(r.ref);
      if (!group) continue;
      group.userData.rect = r;
      group.position.set(r.x + r.w / 2, 0, r.y + r.h / 2);
    }
    this.syncStockLotOverlays();
  }

  resetOrbitCamera() {
    if (this.camAnim) cancelAnimationFrame(this.camAnim);
    this.savedCameraBeforeChg = null;
    const start = this.camera.position.clone();
    const targetPos = new THREE.Vector3(DEFAULT_CAMERA_POS[0], DEFAULT_CAMERA_POS[1], DEFAULT_CAMERA_POS[2]);
    const startLook = this.controls.target.clone();
    const endLook = new THREE.Vector3(DEFAULT_TARGET[0], DEFAULT_TARGET[1], DEFAULT_TARGET[2]);
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 900);
      const e = 1 - Math.pow(1 - k, 3);
      this.camera.position.lerpVectors(start, targetPos, e);
      this.controls.target.lerpVectors(startLook, endLook, e);
      if (k < 1) this.camAnim = requestAnimationFrame(step);
    };
    this.camAnim = requestAnimationFrame(step);
  }

  private track(obj: THREE.Object3D) {
    this.disposables.push(obj);
    return obj;
  }

  private disposeAll = () => {
    for (const o of this.disposables) {
      if (o instanceof THREE.Sprite) {
        const sm = o.material as THREE.SpriteMaterial;
        sm.map?.dispose();
        sm.dispose();
        continue;
      }
      if (o instanceof THREE.Group) {
        o.traverse((child) => {
          if (
            child instanceof THREE.Mesh ||
            child instanceof THREE.Line ||
            child instanceof THREE.LineSegments ||
            child instanceof THREE.Sprite
          ) {
            child.geometry?.dispose();
            const mat = child.material;
            if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
            else mat?.dispose();
          }
        });
        continue;
      }
      if (o instanceof THREE.Mesh || o instanceof THREE.Line || o instanceof THREE.LineSegments) {
        o.geometry?.dispose();
        const mat = o.material;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose();
      }
    }
  };

  dispose() {
    window.removeEventListener('beforeunload', this.disposeAll);
    this.ro.disconnect();
    this.controls.dispose();
    this.renderer.dispose();
    this.disposeAll();
  }

  private clearBuildingGroup(group: THREE.Group) {
    this.removeChangeRoof(group);
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      child.traverse((o) => {
        if (
          o instanceof THREE.Mesh ||
          o instanceof THREE.Line ||
          o instanceof THREE.LineSegments ||
          o instanceof THREE.Sprite
        ) {
          o.geometry?.dispose();
          const mat = o.material;
          if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
          else mat?.dispose();
        }
      });
    }
  }

  private targetHeightForStock(st: StockRow): number {
    switch (this.visualMode) {
      case 'overview':
      case 'marketCap':
        return overviewNeutralHeight(st);
      case 'chg':
        return computeChgTowerHeight(st);
      default:
        return overviewNeutralHeight(st);
    }
  }

  private removeChangeRoof(group: THREE.Group) {
    const roof = group.userData.changeRoof as THREE.Mesh | undefined;
    if (roof) {
      group.remove(roof);
      roof.geometry.dispose();
      (roof.material as THREE.Material).dispose();
      delete group.userData.changeRoof;
    }
  }

  private buildStockBuildingContent(group: THREE.Group, r: StockRect, st: StockRow) {
    if (this.visualMode === 'chg') {
      this.buildChgBoxStockBuildingContent(group, r, st);
      return;
    }
    if (this.buildingLib) {
      this.buildGltfStockBuildingContent(group, r, st);
      return;
    }
    this.buildProceduralStockBuildingContent(group, r, st);
  }

  /** 등락: GLTF·층 없이 단일 직육면체, 색은 등락 방향. */
  private buildChgBoxStockBuildingContent(group: THREE.Group, r: StockRect, st: StockRow) {
    this.clearBuildingGroup(group);
    const { footW, footD } = lotFootprint(r);
    const H0 = computeChgTowerHeight(st);
    const inset = 0.96;
    const bw = Math.max(0.25, footW * inset);
    const bd = Math.max(0.25, footD * inset);

    const pivot = new THREE.Group();
    group.add(pivot);

    const col = getChangeColor(st.chg ?? 0, !!st.halted);
    const intensity = THREE.MathUtils.clamp(Math.abs(st.chg ?? 0) / 6, 0.06, 0.38);
    const chg = st.chg ?? 0;
    const dir = st.halted || Math.abs(chg) <= 0.1 ? 1 : chg > 0 ? 1 : -1;
    const mat = new THREE.MeshStandardMaterial({
      color: col.clone(),
      emissive: col.clone(),
      emissiveIntensity: intensity,
      roughness: 0.44,
      metalness: 0.1,
    });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(bw, H0, bd), mat);
    mesh.position.y = dir * (H0 / 2);
    mesh.name = 'chgBox';
    pivot.add(mesh);

    group.userData.stock = st;
    group.userData.rect = r;
    group.userData.baseColor = col.clone();
    group.userData.heightPivot = pivot;
    group.userData.referenceFitHeight = H0;
    group.userData.pivotRoofLocalY = dir > 0 ? H0 : 0;
    group.userData.chgDir = dir;
    group.userData.footW = footW;
    group.userData.footD = footD;
    pivot.scale.y = 1;
  }

  private buildGltfStockBuildingContent(group: THREE.Group, r: StockRect, st: StockRow) {
    this.clearBuildingGroup(group);
    const sec = this.secById[st.s];
    const { footW, footD } = lotFootprint(r);
    const H0 = overviewNeutralHeight(st);
    const seed = tickerStyleSeed(st.t);
    const bodyColor = getBuildingColor(st);

    const pivot = new THREE.Group();
    pivot.position.y = 0;
    group.add(pivot);

    const model = this.buildingLib!.cloneVariant(seed, { preferFactory: factorySectors.has(sec.name) });
    model.rotation.set(0, 0, 0);
    model.scale.set(1, 1, 1);
    model.position.set(0, 0, 0);
    fitBuildingModelToLot(model, footW, footD, H0);
    pivot.add(model);
    tintSubtreeMeshesNeutral(model, st);

    pivot.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(pivot);
    const pivotRoofY = box.max.y;

    group.userData.stock = st;
    group.userData.rect = r;
    group.userData.baseColor = bodyColor;
    group.userData.heightPivot = pivot;
    group.userData.referenceFitHeight = H0;
    group.userData.pivotRoofLocalY = pivotRoofY;
    group.userData.footW = footW;
    group.userData.footD = footD;
    pivot.scale.y = 1;
    attachBuildingTopLabel(pivot, st, pivotRoofY, footW, footD);
  }

  private buildProceduralStockBuildingContent(group: THREE.Group, r: StockRect, st: StockRow) {
    this.clearBuildingGroup(group);
    const { footW, footD } = lotFootprint(r);
    const H0 = overviewNeutralHeight(st);
    const bodyColor = getBuildingColor(st);
    const capNeutral = new THREE.Color(0x252b38);

    const pivot = new THREE.Group();
    pivot.position.y = 0;
    group.add(pivot);

    let yTop = 0;
    const bodyInset = 0.9;
    const bodyW = footW * bodyInset;
    const bodyD = footD * bodyInset;
    const bodyH = Math.max(0.25, H0 * 0.75);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.52,
      metalness: 0.08,
      emissive: new THREE.Color(0x000000),
    });
    const bodyGeo = new THREE.BoxGeometry(bodyW, bodyH, bodyD);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = yTop + bodyH / 2;
    pivot.add(body);
    yTop += bodyH;

    const capH = Math.max(0.06, H0 * 0.04);
    const capMat = new THREE.MeshStandardMaterial({
      color: capNeutral,
      roughness: 0.35,
      metalness: 0.2,
      emissive: new THREE.Color(0x000000),
    });
    const cap = new THREE.Mesh(new THREE.BoxGeometry(bodyW + 0.06, capH, bodyD + 0.06), capMat);
    cap.position.y = yTop + capH / 2;
    pivot.add(cap);

    const pivotRoofY = yTop + capH;

    group.userData.stock = st;
    group.userData.rect = r;
    group.userData.baseColor = bodyColor;
    group.userData.heightPivot = pivot;
    group.userData.referenceFitHeight = H0;
    group.userData.pivotRoofLocalY = pivotRoofY;
    group.userData.footW = footW;
    group.userData.footD = footD;
    pivot.scale.y = 1;
    attachBuildingTopLabel(pivot, st, pivotRoofY, footW, footD);
  }

  private addStockBuilding(r: StockRect) {
    const st = r.ref;
    const group = new THREE.Group();
    group.position.set(r.x + r.w / 2, 0, r.y + r.h / 2);
    group.userData.footprintRestXZ = 1;
    this.buildStockBuildingContent(group, r, st);
    this.stockGroup.add(group);
    this.track(group);
    this.meshByStock.set(st, group);
  }

  updateAllVisuals() {
    for (const [, group] of this.meshByStock) {
      const r = group.userData.rect as StockRect;
      const st = group.userData.stock as StockRow;
      group.position.set(r.x + r.w / 2, 0, r.y + r.h / 2);
      if (this.visualMode === 'marketCap') {
        this.startFootprintCapLerpIfNeeded();
      } else {
        this.buildStockBuildingContent(group, r, st);
      }
    }
  }

  private updateBuildingAnimations(dt: number) {
    for (const [st, group] of this.meshByStock) {
      const pivot = group.userData.heightPivot as THREE.Group | undefined;
      const ref = group.userData.referenceFitHeight as number | undefined;
      if (!pivot || ref == null || ref < 1e-6) continue;

      let targetH = this.targetHeightForStock(st);

      const maxMul = this.visualMode === 'chg' ? 2.25 : 3.4;
      const mul = THREE.MathUtils.clamp(targetH / ref, 0.32, maxMul);
      const k = Math.min(1, dt * 5.5);
      pivot.scale.y += (mul - pivot.scale.y) * k;
    }
  }

  resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (this.canvas.width !== w * this.renderer.getPixelRatio() || this.canvas.height !== h * this.renderer.getPixelRatio()) {
      this.renderer.setSize(w, h, false);
    }
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  tick() {
    const now = performance.now();
    const dt = Math.min(0.08, (now - this.lastTick) / 1000);
    this.lastTick = now;

    this.controls.update();
    this.updateBuildingAnimations(dt);
    this.updateFootprintCapLerp(performance.now());
    this.resize();
    this.renderer.render(this.scene, this.camera);
  }

  flyToStock(mesh: THREE.Object3D) {
    const p = mesh.position;
    if (this.camAnim) cancelAnimationFrame(this.camAnim);
    const start = this.camera.position.clone();
    const target = new THREE.Vector3(p.x, 30, p.z + 25);
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 700);
      const e = 1 - Math.pow(1 - k, 3);
      this.camera.position.lerpVectors(start, target, e);
      this.controls.target.set(p.x, 0, p.z);
      if (k < 1) this.camAnim = requestAnimationFrame(step);
    };
    this.camAnim = requestAnimationFrame(step);
  }

  private intro() {
    const end = DEFAULT_CAMERA_POS;
    const t0 = performance.now();
    const start = { x: end[0], y: 130, z: end[2] + 45 };
    this.camera.position.set(start.x, start.y, start.z);
    this.controls.target.set(DEFAULT_TARGET[0], DEFAULT_TARGET[1], DEFAULT_TARGET[2]);
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 1200);
      const e = 1 - Math.pow(1 - k, 3);
      this.camera.position.set(
        start.x + (end[0] - start.x) * e,
        start.y + (end[1] - start.y) * e,
        start.z + (end[2] - start.z) * e,
      );
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  getSector(id: string) {
    return this.secById[id];
  }
}
