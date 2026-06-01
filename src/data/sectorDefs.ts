import type { SectorDef } from '../types';

/**
 * GICS 11 + OTHERS canonical registry.
 * 기존 11개: public/treemap_data.json 과 동일 (id · name · ko · color 변경 금지).
 * 누락분: OTHERS 만 추가.
 */
export const SECTOR_DEFS: SectorDef[] = [
  { id: 'IT', name: 'Information Tech', ko: '정보기술', color: '#39FF6B' },
  { id: 'COMMS', name: 'Communication Svc.', ko: '커뮤니케이션 서비스', color: '#F1F5F9' },
  { id: 'CONS_DISC', name: 'Consumer Discr.', ko: '임의소비재', color: '#FB923C' },
  { id: 'HEALTH', name: 'Health Care', ko: '헬스케어', color: '#10E5B5' },
  { id: 'FINANCIALS', name: 'Financials', ko: '금융', color: '#FFD93D' },
  { id: 'INDUST', name: 'Industrials', ko: '산업재', color: '#475569' },
  { id: 'ENERGY', name: 'Energy', ko: '에너지', color: '#FF3D5A' },
  { id: 'CONS_STAP', name: 'Consumer Staples', ko: '필수소비재', color: '#CBD5E1' },
  { id: 'UTIL', name: 'Utilities', ko: '유틸리티', color: '#0EA5E9' },
  { id: 'RE', name: 'Real Estate', ko: '부동산', color: '#F472B6' },
  { id: 'MATERIALS', name: 'Materials', ko: '소재', color: '#C2410C' },
  { id: 'OTHERS', name: 'Others', ko: '기타', color: '#64748B' },
];

/** 데이터 파일 sectors 배열에 registry 기준 누락 id만 보강 (기존 항목은 덮어쓰지 않음). */
export function mergeMissingSectorDefs(sectors: SectorDef[]): SectorDef[] {
  const out = [...sectors];
  for (const def of SECTOR_DEFS) {
    if (!out.some((s) => s.id === def.id)) out.push(def);
  }
  return out;
}
