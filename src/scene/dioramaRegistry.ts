import * as THREE from 'three';
import { createAlbemarle } from './dioramas/albemarleCampus';
import { createAmazonWarehouse } from './dioramas/amazonCampus';
import { createAppleCampus } from './dioramas/appleCampus';
import { createCelltrion, createSamsungBiologics } from './dioramas/bioPharma';
import { createBoeing } from './dioramas/boeingAssembly';
import { createCocaCola } from './dioramas/cocaColaCampus';
import { createGoogleCampus } from './dioramas/googleCampus';
import { createHyundaiMotor } from './dioramas/hyundaiMotor';
import { createNvidiaFab } from './dioramas/nvidia';
import { createKbFinancial } from './dioramas/kbFinancial';
import { createKakao } from './dioramas/kakaoCampus';
import { createMicrosoftCampus } from './dioramas/microsoftCampus';
import { createNaver } from './dioramas/naverCampus';
import { createNextEra } from './dioramas/nextEraCampus';
import { createRealtyIncome } from './dioramas/realtyIncomeCampus';
import { createSamsungFab } from './dioramas/samsungFab';
import { createSKHynixFab } from './dioramas/skHynixCampus';
import { createSOilRefinery } from './dioramas/soilRefinery';
import { createTesla } from './dioramas/teslaCampus';

export const DIORAMA_BY_TICKER: Record<string, () => THREE.Group> = {
  TSLA: createTesla,
  AMZN: createAmazonWarehouse,
  AAPL: createAppleCampus,
  GOOGL: createGoogleCampus,
  MSFT: createMicrosoftCampus,
  BA: createBoeing,
  NVDA: createNvidiaFab,
  NEE: createNextEra,
  O: createRealtyIncome,
  ALB: createAlbemarle,
  KO: createCocaCola,
  '005930': createSamsungFab,
  '000660': createSKHynixFab,
  '005380': createHyundaiMotor,
  '068270': createCelltrion,
  '207940': createSamsungBiologics,
  '010950': createSOilRefinery,
  '105560': createKbFinancial,
  '035420': createNaver,
  '035720': createKakao,
};
