export type MarketCode = 'US' | 'KR';

export interface RawDocument {
  source: 'dart' | 'naver' | 'pdf' | string;
  title: string;
  date: string;
  url: string;
  text: string;
  metadata?: Record<string, unknown>;
}

export type RiskSeverity = 'low' | 'medium' | 'high';

export interface RiskExtraction {
  source: string;
  sourceUrl: string;
  company: string;
  ticker?: string;
  sector?: string;
  riskType: string;
  riskSeverity: RiskSeverity;
  summary: string;
  keywords: string[];
  upstream: string[];
  downstream: string[];
  asOf: string;
}

/** Sprint 2+ provider wiring; Sprint 1 stays on `mock`. */
export type DataSourceType = 'live' | 'delayed' | 'cached' | 'mock';

export interface SectorDef {
  id: string;
  name: string;
  ko: string;
  color: string;
}

export interface StockNewsItem {
  source: string;
  title: string;
  date: string;
  url: string;
  text: string;
  isGeneric: boolean;
}

export interface StockRow {
  t: string;
  n: string;
  m: MarketCode;
  s: string;
  /** Market cap in billions USD */
  cap: number;
  /** Portfolio holding weight, 0–1 (sums to ~1 across holdings). Falls back to cap if absent. */
  weight?: number;
  per: number | null;
  pbr: number | null;
  /** Volume in millions */
  vol: number;
  div: number;
  news?: StockNewsItem[];
  roe?: number | null;
  operatingMargin?: number | null;
  debtRatio?: number | null;
  week52High?: number | null;
  week52Low?: number | null;
  psr?: number | null;
  evEbitda?: number | null;
  peg?: number | null;
  pcr?: number | null;
  roa?: number | null;
  netMargin?: number | null;
  grossMargin?: number | null;
  revenueGrowth?: number | null;
  epsGrowth?: number | null;
  currentRatio?: number | null;
  /** Free cash flow in billions USD */
  fcf?: number | null;
  fcfYield?: number | null;
  /** EPS in local currency */
  eps?: number | null;
  payoutRatio?: number | null;
  beta?: number | null;
  /** Return on Invested Capital (%) */
  roic?: number | null;
  /** Operating margin change over ~3 years (percentage points) */
  opmTrend3y?: number | null;
  /** Gross margin change over ~3 years (percentage points) */
  gpmTrend3y?: number | null;
  /** Total shareholder return = (dividends + buybacks) / net income (%) */
  shareholderReturn?: number | null;
  halted?: boolean;
  /** Runtime: daily change % */
  chg?: number;
  /** Runtime: simulated price */
  price?: number;
  /** Data honesty layer — optional until real feeds land */
  source?: DataSourceType;
  sourceLabel?: string;
  /** ISO snapshot time for this row (defaults to dataset `generated_at`) */
  asOf?: string;
}

export interface TreemapDataFile {
  schema_version: string;
  /** ISO timestamp of the market snapshot in this file (chg / price). */
  generated_at: string;
  sectors: SectorDef[];
  /** Static fields + optional same-day `chg` (%) and `price` loaded on entry. */
  stocks: (Omit<StockRow, 'chg' | 'price'> & Partial<Pick<StockRow, 'chg' | 'price'>>)[];
}

export function dataSourceDetailLabel(source?: DataSourceType): string {
  switch (source) {
    case 'live':
      return '실시간 데이터';
    case 'delayed':
      return '지연 데이터';
    case 'cached':
      return '캐시 데이터';
    case 'mock':
    default:
      return '데모 데이터';
  }
}

/** Status bar baseline phrase */
export function dataSnapshotBaselineLabel(source?: DataSourceType): string {
  switch (source) {
    case 'live':
      return '실시간 데이터 기준';
    case 'delayed':
      return '지연 데이터 기준';
    case 'cached':
      return '캐시 데이터 기준';
    case 'mock':
    default:
      return '데모 스냅샷 기준';
  }
}
