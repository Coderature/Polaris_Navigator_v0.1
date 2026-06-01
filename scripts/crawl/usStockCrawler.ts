import YahooFinance from 'yahoo-finance2';
import type { StockRow } from '../types.js';

const yf = new YahooFinance();

const US_STOCKS = [
  'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'TSLA', 'AMZN',
  'BA', 'KO', 'NEE', 'O', 'ALB',
];

interface YahooQuoteSummary {
  price?: {
    regularMarketPrice?: number;
    regularMarketChange?: number;
    regularMarketChangePercent?: number;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
  };
  summaryDetail?: {
    marketCap?: number;
    trailingPE?: number;
    forwardPE?: number;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
    dividendYield?: number;
    payoutRatio?: number;
  };
  defaultKeyStatistics?: {
    priceToBook?: number;
    pegRatio?: number;
    enterpriseToEbitda?: number;
  };
  financialData?: {
    profitMargins?: number;
    returnOnEquity?: number;
    returnOnAssets?: number;
    debtToEquity?: number;
    operatingMargins?: number;
    currentRatio?: number;
    quickRatio?: number;
    revenueGrowth?: number;
    earningsGrowth?: number;
  };
  summaryProfile?: {
    sector?: string;
  };
}

function mapSectorId(sector: string | undefined): string {
  if (!sector) return 'OTHERS';
  const sectorMap: Record<string, string> = {
    'Technology': 'IT',
    'Information Technology': 'IT',
    'Communication Services': 'COMMS',
    'Consumer Cyclical': 'CONS_DISC',
    'Consumer Defensive': 'CONS_STAP',
    'Healthcare': 'HEALTH',
    'Financials': 'FINANCIALS',
    'Industrials': 'INDUST',
    'Energy': 'ENERGY',
    'Utilities': 'UTIL',
    'Real Estate': 'RE',
    'Basic Materials': 'MATERIALS',
  };
  return sectorMap[sector] || 'OTHERS';
}

export async function fetchUsStocks(): Promise<StockRow[]> {
  const stocks: StockRow[] = [];

  for (const ticker of US_STOCKS) {
    try {
      console.log(`  → ${ticker} 수집 중...`);

      const quote = await yf.quote(ticker);
      const summary = await yf.quoteSummary(ticker, {
        modules: ['price', 'summaryDetail', 'defaultKeyStatistics', 'financialData', 'summaryProfile'],
      });

      const s = summary as YahooQuoteSummary;
      const p = quote;

      const stock: StockRow = {
        t: ticker,
        n: (summary as any)?.longName || (quote as any)?.longName || ticker,
        m: 'US',
        s: mapSectorId((s.summaryProfile as any)?.sector),
        cap: ((s.summaryDetail?.marketCap ?? 0) / 1e9) || 0,
        vol: ((p.regularMarketVolume ?? 0) / 1e6) || 0,
        div: (s.summaryDetail?.dividendYield ?? 0) * 100,

        // 밸류에이션
        per: s.summaryDetail?.trailingPE ?? null,
        pbr: s.defaultKeyStatistics?.priceToBook ?? null,
        psr: null, // Yahoo Finance에서 직접 제공하지 않음
        evEbitda: s.defaultKeyStatistics?.enterpriseToEbitda ?? null,
        peg: s.defaultKeyStatistics?.pegRatio ?? null,

        // 수익성 & 건전성
        netMargin: s.financialData?.profitMargins ? (s.financialData.profitMargins * 100) : null,
        operatingMargin: s.financialData?.operatingMargins ? (s.financialData.operatingMargins * 100) : null,
        roe: s.financialData?.returnOnEquity ? (s.financialData.returnOnEquity * 100) : null,
        roa: s.financialData?.returnOnAssets ? (s.financialData.returnOnAssets * 100) : null,
        debtRatio: s.financialData?.debtToEquity ? (s.financialData.debtToEquity * 100) : null,
        currentRatio: s.financialData?.currentRatio ?? null,
        quickRatio: s.financialData?.quickRatio ?? null,

        // 성장성
        revenueGrowth: s.financialData?.revenueGrowth ? (s.financialData.revenueGrowth * 100) : null,
        epsGrowth: s.financialData?.earningsGrowth ? (s.financialData.earningsGrowth * 100) : null,

        // 배당
        payoutRatio: s.summaryDetail?.payoutRatio ? (s.summaryDetail.payoutRatio * 100) : null,

        // 52주 범위
        week52High: s.summaryDetail?.fiftyTwoWeekHigh ?? null,
        week52Low: s.summaryDetail?.fiftyTwoWeekLow ?? null,
      };

      stocks.push(stock);

    } catch (err) {
      console.error(`    ✗ ${ticker} 실패:`, err instanceof Error ? err.message : String(err));
    }
  }

  return stocks;
}
