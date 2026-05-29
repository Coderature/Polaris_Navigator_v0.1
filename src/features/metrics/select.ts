import { METRICS } from './catalog';
import type { CategoryId, MetricDef } from './types';

/** 초심자 모드면 isBasic만, 아니면 전체. 기초 지표가 카테고리 내 맨 위. */
export function selectMetrics(beginnerMode: boolean): MetricDef[] {
  const list = beginnerMode ? METRICS.filter((m) => m.isBasic) : METRICS;
  return [...list].sort((a, b) => Number(b.isBasic) - Number(a.isBasic));
}

export function groupByCategory(metrics: MetricDef[]): Record<CategoryId, MetricDef[]> {
  return metrics.reduce(
    (acc, m) => {
      (acc[m.category] ??= []).push(m);
      return acc;
    },
    {} as Record<CategoryId, MetricDef[]>,
  );
}

/** quoteSummary 객체에서 'a.b.c' 경로로 값 추출. { raw, fmt } 객체면 .raw 우선. */
export function readPath(data: unknown, path: string): unknown {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cur: any = data;
  for (const key of path.split('.')) {
    if (cur == null) return null;
    cur = cur[key];
  }
  if (cur != null && typeof cur === 'object' && 'raw' in cur) return cur.raw;
  return cur ?? null;
}

export function formatValue(value: unknown, format: string): string {
  if (value == null) return '—';
  const n = typeof value === 'number' ? value : Number(value);
  switch (format) {
    case 'currency': return isNaN(n) ? String(value) : n.toLocaleString();
    case 'percent':  return isNaN(n) ? String(value) : `${(n * 100).toFixed(1)}%`;
    case 'ratio':    return isNaN(n) ? String(value) : n.toFixed(1);
    case 'number':   return isNaN(n) ? String(value) : n.toLocaleString();
    default:         return String(value);
  }
}
