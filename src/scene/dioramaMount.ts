import * as THREE from 'three';
import { DIORAMA_BY_TICKER } from './dioramaRegistry';

/** DESIGN villageScale VILLAGE_MODEL_SCALE_XZ — applied on child wrapper, not stock root. */
const DIORAMA_SCALE_XZ = 2.2;

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
    wrapper.add(build());
    return wrapper;
  } catch (err) {
    console.error(`[dioramaMount] build failed for ${ticker}:`, err);
    return null;
  }
}

/** Lot footprint fit applied on wrapper (after DESIGN 2.2). */
export function fitDioramaWrapperToLot(wrapper: THREE.Group, footW: number, footD: number, pad = 0.92): void {
  wrapper.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(wrapper);
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3());
  const s = Math.min((footW * pad) / Math.max(size.x, 1e-4), (footD * pad) / Math.max(size.z, 1e-4));
  if (s >= 1) return;
  wrapper.scale.multiplyScalar(s);
  wrapper.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(wrapper);
  wrapper.position.x -= (b2.min.x + b2.max.x) / 2;
  wrapper.position.z -= (b2.min.z + b2.max.z) / 2;
  wrapper.position.y -= b2.min.y;
}
