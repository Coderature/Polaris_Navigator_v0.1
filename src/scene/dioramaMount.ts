import * as THREE from 'three';
import { DIORAMA_BY_TICKER } from './dioramaRegistry';

/** DESIGN villageScale VILLAGE_MODEL_SCALE_XZ — applied on child wrapper, not stock root. */
const DIORAMA_SCALE_XZ = 2.2;
/** Slight vertical boost so models read taller on treemap tiles (re-grounded after). */
const DIORAMA_HEIGHT_MUL = 1.15;

/** After lot fit — buildingTemplates extract (010950) sits high vs other builders. */
const DIORAMA_Y_AFTER_FIT: Record<string, number> = {
  '010950': -0.18,
};

/**
 * Wrap DESIGN diorama on a child group so MAIN root hover scale (footprintRestXZ) stays separate.
 * Returns null when no builder → caller falls back to cube.
 */
export function buildDioramaContent(ticker: string): THREE.Group | null {
  const build = DIORAMA_BY_TICKER[ticker];
  if (!build) return null;

  try {
    const wrapper = new THREE.Group();
    wrapper.name = `diorama:${ticker}`;
    wrapper.scale.set(DIORAMA_SCALE_XZ, 1, DIORAMA_SCALE_XZ);
    const scene = build();
    groundObjectBottom(scene);
    wrapper.add(scene);
    return wrapper;
  } catch (err) {
    console.error(`[dioramaMount] build failed for ${ticker}:`, err);
    return null;
  }
}

function groundObjectBottom(root: THREE.Object3D): void {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) return;
  root.position.y -= box.min.y;
}

function alignWrapperToLotFloor(wrapper: THREE.Group): void {
  wrapper.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(wrapper);
  if (box.isEmpty()) return;
  wrapper.position.x -= (box.min.x + box.max.x) / 2;
  wrapper.position.z -= (box.min.z + box.max.z) / 2;
  wrapper.position.y -= box.min.y;
}

/** Lot footprint fit applied on wrapper (after DESIGN 2.2). */
export function fitDioramaWrapperToLot(wrapper: THREE.Group, footW: number, footD: number, pad = 0.92): void {
  wrapper.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(wrapper);
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3());
  const s = Math.min((footW * pad) / Math.max(size.x, 1e-4), (footD * pad) / Math.max(size.z, 1e-4));
  if (s < 1) {
    wrapper.scale.multiplyScalar(s);
    wrapper.updateMatrixWorld(true);
  }
  alignWrapperToLotFloor(wrapper);

  wrapper.scale.y *= DIORAMA_HEIGHT_MUL;
  wrapper.updateMatrixWorld(true);
  alignWrapperToLotFloor(wrapper);

  const ticker = wrapper.name.startsWith('diorama:') ? wrapper.name.slice(8) : '';
  const yFix = DIORAMA_Y_AFTER_FIT[ticker];
  if (yFix != null) wrapper.position.y += yFix;
}
