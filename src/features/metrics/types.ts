export type CategoryId = 'company' | 'price' | 'strength' | 'shareholder';

export type MetricFormat = 'currency' | 'percent' | 'ratio' | 'number' | 'text';

export interface MetricDef {
  id: string;
  category: CategoryId;
  subGroup: string;
  label: string;
  yfinancePath: string;
  format: MetricFormat;
  isBasic: boolean;
}

export interface CategoryDef {
  id: CategoryId;
  label: string;
}

export interface UserFav {
  metricIds: string[];
}
