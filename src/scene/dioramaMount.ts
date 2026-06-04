import * as THREE from 'three';
import { DIORAMA_BY_TICKER } from './dioramaRegistry';

/** DESIGN villageScale VILLAGE_MODEL_SCALE_XZ — applied on child wrapper, not stock root. */
const DIORAMA_SCALE_XZ = 2.2;
/** Slight vertical boost so models read taller on treemap tiles (re-grounded after). */
const DIORAMA_HEIGHT_MUL = 1.15;

/** Per-ticker fine-tune after fit (only if geometry fix is insufficient). */
const DIORAMA_Y_AFTER_FIT: Record<string, number> = {};

/** Per-ticker scale after lot fit (1 = default). Kakao campus reads small on tile. */
const DIORAMA_FIT_SCALE_MUL: Record<string, number> = {
  '035720': 1.3,
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

/** Animated / VFX meshes must not pull the ground plane (S-Oil smoke, oil beads, etc.). */
function expandGroundBounds(box: THREE.Box3, root: THREE.Object3D): void {
  root.updateMatrixWorld(true);
  root.traverse((obj) => {
    if (obj.userData?.excludeFromGroundBounds) return;
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;
    const geom = mesh.geometry;
    if (!geom.boundingBox) geom.computeBoundingBox();
    if (!geom.boundingBox) return;
    const lb = geom.boundingBox.clone().applyMatrix4(mesh.matrixWorld);
    box.union(lb);
  });
}

function groundObjectBottom(root: THREE.Object3D): void {
  const box = new THREE.Box3();
  expandGroundBounds(box, root);
  if (box.isEmpty()) return;
  root.position.y -= box.min.y;
}

function alignWrapperToLotFloor(wrapper: THREE.Group): void {
  const box = new THREE.Box3();
  expandGroundBounds(box, wrapper);
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
  const fitMul = DIORAMA_FIT_SCALE_MUL[ticker] ?? 1;
  if (fitMul !== 1) {
    wrapper.scale.multiplyScalar(fitMul);
    wrapper.updateMatrixWorld(true);
    alignWrapperToLotFloor(wrapper);
  }

  const yFix = DIORAMA_Y_AFTER_FIT[ticker];
  if (yFix != null) wrapper.position.y += yFix;
}
