import * as THREE from 'three';
import { createAmazonWarehouse } from './dioramas/amazonCampus';
import { createAppleCampus } from './dioramas/appleCampus';
import { createBoeing } from './dioramas/boeingAssembly';
import { createNvidiaFab } from './dioramas/nvidia';
import { createSamsungFab } from './dioramas/samsungFab';
import { createTesla } from './dioramas/teslaCampus';

export const DIORAMA_BY_TICKER: Record<string, () => THREE.Group> = {
  TSLA: createTesla,
  AMZN: createAmazonWarehouse,
  AAPL: createAppleCampus,
  BA: createBoeing,
  NVDA: createNvidiaFab,
  '005930': createSamsungFab,
};
