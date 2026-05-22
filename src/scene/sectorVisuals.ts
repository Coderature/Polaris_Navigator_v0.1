export type BuildingBaseType = 'skyscraper' | 'factory' | 'shop';

export type SectorVisual = {
  base: BuildingBaseType;
  color: string;
  emissive?: string;
  roughness: number;
  metalness?: number;
};

export const DEFAULT_SECTOR_VISUAL: SectorVisual = {
  base: 'skyscraper',
  color: '#8b93a7',
  roughness: 0.65,
  metalness: 0.1,
};

const normalizeKey = (value?: string) =>
  `${value ?? ''}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ');

export const SECTOR_VISUALS: Record<string, SectorVisual> = {
  'information technology': {
    base: 'skyscraper',
    color: '#e8eef5',
    emissive: '#1d3557',
    roughness: 0.25,
    metalness: 0.25,
  },
  'information tech': {
    base: 'skyscraper',
    color: '#e8eef5',
    emissive: '#1d3557',
    roughness: 0.25,
    metalness: 0.25,
  },
  it: {
    base: 'skyscraper',
    color: '#e8eef5',
    emissive: '#1d3557',
    roughness: 0.25,
    metalness: 0.25,
  },
  financials: {
    base: 'skyscraper',
    color: '#1a2845',
    emissive: '#0d1326',
    roughness: 0.35,
    metalness: 0.2,
  },
  fin: {
    base: 'skyscraper',
    color: '#1a2845',
    emissive: '#0d1326',
    roughness: 0.35,
    metalness: 0.2,
  },
  'communication services': {
    base: 'skyscraper',
    color: '#5b3a8e',
    emissive: '#24113f',
    roughness: 0.4,
    metalness: 0.15,
  },
  'communication svc': {
    base: 'skyscraper',
    color: '#5b3a8e',
    emissive: '#24113f',
    roughness: 0.4,
    metalness: 0.15,
  },
  comms: {
    base: 'skyscraper',
    color: '#5b3a8e',
    emissive: '#24113f',
    roughness: 0.4,
    metalness: 0.15,
  },
  'health care': {
    base: 'skyscraper',
    color: '#f2f4f7',
    emissive: '#7a1d2b',
    roughness: 0.35,
    metalness: 0.05,
  },
  health: {
    base: 'skyscraper',
    color: '#f2f4f7',
    emissive: '#7a1d2b',
    roughness: 0.35,
    metalness: 0.05,
  },
  utilities: {
    base: 'skyscraper',
    color: '#9eb0c0',
    emissive: '#1c3f5c',
    roughness: 0.7,
    metalness: 0.05,
  },
  util: {
    base: 'skyscraper',
    color: '#9eb0c0',
    emissive: '#1c3f5c',
    roughness: 0.7,
    metalness: 0.05,
  },
  industrials: {
    base: 'factory',
    color: '#6b6b6b',
    emissive: '#2e2e2e',
    roughness: 0.9,
    metalness: 0.05,
  },
  indust: {
    base: 'factory',
    color: '#6b6b6b',
    emissive: '#2e2e2e',
    roughness: 0.9,
    metalness: 0.05,
  },
  energy: {
    base: 'factory',
    color: '#a85a2a',
    emissive: '#3a1c0d',
    roughness: 0.85,
    metalness: 0.05,
  },
  materials: {
    base: 'factory',
    color: '#7a5c3e',
    emissive: '#2c1d12',
    roughness: 0.9,
    metalness: 0.05,
  },
  'consumer staples': {
    base: 'shop',
    color: '#d4c5a0',
    emissive: '#3a3120',
    roughness: 0.6,
    metalness: 0.05,
  },
  'consumer discr.': {
    base: 'shop',
    color: '#c44a3a',
    emissive: '#3a1110',
    roughness: 0.55,
    metalness: 0.05,
  },
  'consumer discretionary': {
    base: 'shop',
    color: '#c44a3a',
    emissive: '#3a1110',
    roughness: 0.55,
    metalness: 0.05,
  },
  cons_disc: {
    base: 'shop',
    color: '#c44a3a',
    emissive: '#3a1110',
    roughness: 0.55,
    metalness: 0.05,
  },
  'real estate': {
    base: 'shop',
    color: '#b8a888',
    emissive: '#2f281d',
    roughness: 0.7,
    metalness: 0.05,
  },
  re: {
    base: 'shop',
    color: '#b8a888',
    emissive: '#2f281d',
    roughness: 0.7,
    metalness: 0.05,
  },
};

export function getSectorVisual(sector?: string): SectorVisual {
  const key = normalizeKey(sector);
  return SECTOR_VISUALS[key] ?? DEFAULT_SECTOR_VISUAL;
}
