import type { CategoryDef, MetricDef } from './types';

export const CATEGORIES: CategoryDef[] = [
  { id: 'company',     label: '어떤 회사인가' },
  { id: 'price',       label: '지금 사면 비싼가' },
  { id: 'strength',    label: '좋은 회사인가' },
  { id: 'shareholder', label: '나한테 돌아오는 건' },
];

// isBasic: true 인 지표가 초심자 모드 ON에서 노출 (정확히 6개)
// company.change는 패널 헤더에 이미 표시되므로 basic에서 제외
export const METRICS: MetricDef[] = [
  // ① 회사 소개 (company)
  { id: 'company.price',    category: 'company', subGroup: '시세', label: '현재가',    yfinancePath: 'price.regularMarketPrice',         format: 'currency', isBasic: true  },
  { id: 'company.change',   category: 'company', subGroup: '시세', label: '등락률',    yfinancePath: 'price.regularMarketChangePercent', format: 'percent',  isBasic: false },
  { id: 'company.mcap',     category: 'company', subGroup: '규모', label: '시가총액',  yfinancePath: 'summaryDetail.marketCap',          format: 'currency', isBasic: true  },
  { id: 'company.volume',   category: 'company', subGroup: '시세', label: '거래량',    yfinancePath: 'price.regularMarketVolume',        format: 'number',   isBasic: false },
  { id: 'company.high52',   category: 'company', subGroup: '시세', label: '52주 최고', yfinancePath: 'summaryDetail.fiftyTwoWeekHigh',  format: 'currency', isBasic: false },
  { id: 'company.low52',    category: 'company', subGroup: '시세', label: '52주 최저', yfinancePath: 'summaryDetail.fiftyTwoWeekLow',   format: 'currency', isBasic: false },
  { id: 'company.sector',   category: 'company', subGroup: '식별', label: '섹터',      yfinancePath: 'assetProfile.sector',             format: 'text',     isBasic: false },
  { id: 'company.industry', category: 'company', subGroup: '식별', label: '산업',      yfinancePath: 'assetProfile.industry',           format: 'text',     isBasic: false },

  // ② 가격 매력도 (price = 밸류에이션)
  { id: 'price.per',        category: 'price', subGroup: '이익기준', label: 'PER',         yfinancePath: 'summaryDetail.trailingPE',                    format: 'ratio', isBasic: true  },
  { id: 'price.forwardPer', category: 'price', subGroup: '이익기준', label: 'Forward PER', yfinancePath: 'summaryDetail.forwardPE',                     format: 'ratio', isBasic: false },
  { id: 'price.pbr',        category: 'price', subGroup: '자산기준', label: 'PBR',         yfinancePath: 'defaultKeyStatistics.priceToBook',            format: 'ratio', isBasic: false },
  { id: 'price.psr',        category: 'price', subGroup: '매출기준', label: 'PSR',         yfinancePath: 'summaryDetail.priceToSalesTrailing12Months',  format: 'ratio', isBasic: false },
  { id: 'price.evEbitda',   category: 'price', subGroup: '기업가치', label: 'EV/EBITDA',   yfinancePath: 'defaultKeyStatistics.enterpriseToEbitda',     format: 'ratio', isBasic: false },
  { id: 'price.peg',        category: 'price', subGroup: '이익기준', label: 'PEG',         yfinancePath: 'defaultKeyStatistics.pegRatio',               format: 'ratio', isBasic: false },

  // ③ 회사 체력 (strength = 수익성+건전성+성장성)
  { id: 'strength.netMargin',   category: 'strength', subGroup: '수익성', label: '순이익률',   yfinancePath: 'financialData.profitMargins',    format: 'percent', isBasic: true  },
  { id: 'strength.debtEquity',  category: 'strength', subGroup: '건전성', label: '부채비율',   yfinancePath: 'financialData.debtToEquity',     format: 'number',  isBasic: true  },
  { id: 'strength.opMargin',    category: 'strength', subGroup: '수익성', label: '영업이익률', yfinancePath: 'financialData.operatingMargins', format: 'percent', isBasic: false },
  { id: 'strength.roe',         category: 'strength', subGroup: '수익성', label: 'ROE',        yfinancePath: 'financialData.returnOnEquity',   format: 'percent', isBasic: false },
  { id: 'strength.roa',         category: 'strength', subGroup: '수익성', label: 'ROA',        yfinancePath: 'financialData.returnOnAssets',   format: 'percent', isBasic: false },
  { id: 'strength.currentRatio',category: 'strength', subGroup: '건전성', label: '유동비율',   yfinancePath: 'financialData.currentRatio',     format: 'ratio',   isBasic: false },
  { id: 'strength.quickRatio',  category: 'strength', subGroup: '건전성', label: '당좌비율',   yfinancePath: 'financialData.quickRatio',       format: 'ratio',   isBasic: false },
  { id: 'strength.revGrowth',   category: 'strength', subGroup: '성장성', label: '매출성장률', yfinancePath: 'financialData.revenueGrowth',    format: 'percent', isBasic: false },
  { id: 'strength.earnGrowth',  category: 'strength', subGroup: '성장성', label: '이익성장률', yfinancePath: 'financialData.earningsGrowth',   format: 'percent', isBasic: false },

  // ④ 주주 혜택 (shareholder = 배당)
  { id: 'shareholder.divYield', category: 'shareholder', subGroup: '수익률', label: '배당수익률', yfinancePath: 'summaryDetail.dividendYield',   format: 'percent',  isBasic: true  },
  { id: 'shareholder.payout',   category: 'shareholder', subGroup: '지속성', label: '배당성향',   yfinancePath: 'summaryDetail.payoutRatio',     format: 'percent',  isBasic: false },
  { id: 'shareholder.divRate',  category: 'shareholder', subGroup: '지속성', label: '주당배당',   yfinancePath: 'summaryDetail.dividendRate',    format: 'currency', isBasic: false },
  { id: 'shareholder.exDate',   category: 'shareholder', subGroup: '일정',   label: '배당락일',   yfinancePath: 'summaryDetail.exDividendDate',  format: 'text',     isBasic: false },
];

export const BASIC_METRIC_IDS = METRICS.filter((m) => m.isBasic).map((m) => m.id);

// 빌드 타임 검증 (6개가 아니면 에러)
if (BASIC_METRIC_IDS.length !== 6) {
  throw new Error(`BASIC_METRIC_IDS.length must be 6, got ${BASIC_METRIC_IDS.length}`);
}
