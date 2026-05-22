import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

export type BuildingTemplateLibrary = {
  variantCount: number;
  cloneVariant(index: number, options?: { preferFactory?: boolean }): THREE.Group;
};

type BuildingManifest = {
  models: string[];
};

const MANIFEST_URL = '/models/buildings/manifest.json';

/** Pivot glTF scene so horizontal center is origin and bottom sits on y=0 (before uniform scaling). */
function pivotSceneBottomCenter(scene: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(scene);
  if (box.isEmpty()) return;
  const cx = (box.min.x + box.max.x) / 2;
  const cz = (box.min.z + box.max.z) / 2;
  scene.position.x -= cx;
  scene.position.y -= box.min.y;
  scene.position.z -= cz;
}

/**
 * Fit a building into its treemap lot without squashing the mesh:
 * - uniform X/Z scale (preserves silhouette on the ground)
 * - Y scaled for return-based height, clamped so towers are not needle-thin
 */
export function fitBuildingModelToLot(
  root: THREE.Group,
  footW: number,
  footD: number,
  targetH: number,
  pad = 0.98,
): void {
  /** Max height : horizontal scale — stops extreme vertical stretch. */
  const MAX_SLENDER = 2.65;
  const MIN_STUB = 0.38;

  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3());

  const sx = (footW * pad) / Math.max(size.x, 1e-4);
  const sz = (footD * pad) / Math.max(size.z, 1e-4);
  const sFoot = Math.min(sx, sz);

  let sy = targetH / Math.max(size.y, 1e-4);
  sy = Math.min(sy, sFoot * MAX_SLENDER);
  sy = Math.max(sy, sFoot * MIN_STUB);

  root.scale.set(sFoot, sy, sFoot);
  root.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(root);
  root.position.x -= (b2.min.x + b2.max.x) / 2;
  root.position.z -= (b2.min.z + b2.max.z) / 2;
  root.position.y -= b2.min.y;
}

async function resolveModelUrls(explicit?: string[]): Promise<string[]> {
  if (explicit?.length) return explicit;
  try {
    const res = await fetch(MANIFEST_URL);
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as BuildingManifest;
    if (data.models?.length) return data.models;
  } catch (e) {
    console.warn('[Polaris] building manifest missing, using skyscraper set only', e);
  }
  return [
    '/models/buildings/building-skyscraper-a.glb',
    '/models/buildings/building-skyscraper-b.glb',
    '/models/buildings/building-skyscraper-c.glb',
    '/models/buildings/building-skyscraper-d.glb',
    '/models/buildings/building-skyscraper-e.glb',
  ];
}

/**
 * Loads Kenney City Kit (Commercial) glTF buildings from public/models/buildings/.
 * Add paths to manifest.json or drop more .glb files and list them there.
 */
export async function loadBuildingTemplates(urls?: string[]): Promise<BuildingTemplateLibrary | null> {
  const modelUrls = await resolveModelUrls(urls);
  const loader = new GLTFLoader();
  const bases: THREE.Group[] = [];
  const factoryBases: THREE.Group[] = [];
  const companyBases: THREE.Group[] = [];
  const extraBases: THREE.Group[] = [];

  for (const url of modelUrls) {
    try {
      const gltf = await loader.loadAsync(url);
      const wrap = new THREE.Group();
      wrap.name = `building_tpl_${bases.length}`;
      gltf.scene.rotation.set(0, 0, 0);
      wrap.add(gltf.scene);
      pivotSceneBottomCenter(gltf.scene);
      if (url.includes('industrial-building-')) {
        factoryBases.push(wrap);
      } else if (url.includes('office-block-') || url.includes('commercial-wide-') || url.includes('building-skyscraper-')) {
        companyBases.push(wrap);
      } else {
        extraBases.push(wrap);
      }
      bases.push(wrap);
    } catch (e) {
      console.warn(`[Polaris] building model failed: ${url}`, e);
    }
  }

  if (!bases.length) return null;

  const factoryPool = factoryBases.slice(0, 3);
  const companyPool = companyBases.slice(0, 3);
  const fallbackPool = companyPool.length ? companyPool : factoryPool.length ? factoryPool : bases.slice(0, 3);

  console.info(`[Polaris] ${bases.length} building templates loaded (company / factory pools selected, CC0)`);

  return {
    variantCount: bases.length,
    cloneVariant(index: number, options?: { preferFactory?: boolean }) {
      const normalized = ((index % fallbackPool.length) + fallbackPool.length) % fallbackPool.length;
      if (options?.preferFactory && factoryPool.length > 0) {
        const factoryIndex = normalized % factoryPool.length;
        return SkeletonUtils.clone(factoryPool[factoryIndex]) as THREE.Group;
      }
      return SkeletonUtils.clone(fallbackPool[normalized]) as THREE.Group;
    },
  };
}
