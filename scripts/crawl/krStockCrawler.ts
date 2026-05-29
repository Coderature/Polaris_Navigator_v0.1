import YahooFinance from 'yahoo-finance2';
import type { StockRow } from '../types.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const yf = new (YahooFinance as any)();

const KR_STOCK_DEFS = [
  { t: '005930', n: '삼성전자', s: 'IT' },
  { t: '000660', n: 'SK하이닉스', s: 'IT' },
  { t: '005380', n: '현대자동차', s: 'CONS_DISC' },
  { t: '035420', n: '네이버', s: 'COMMS' },
  { t: '035720', n: '카카오', s: 'COMMS' },
  { t: '207940', n: '삼성바이오로직스', s: 'HEALTH' },
  { t: '068270', n: '셀트리온', s: 'HEALTH' },
  { t: '105560', n: 'KB금융', s: 'FINANCIALS' },
  { t: '010950', n: 'S-Oil', s: 'ENERGY' },
];

const KRW_PER_USD = 1300;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchKrStocks(): Promise<StockRow[]> {
  const results: StockRow[] = [];
  for (const def of KR_STOCK_DEFS) {
    try {
      const sym = `${def.t}.KS`;
      const q = await yf.quote(sym);

      let roe: number | null = null;
      let operatingMargin: number | null = null;
      let debtRatio: number | null = null;
      let roa: number | null = null;
      let netMargin: number | null = null;
      let grossMargin: number | null = null;
      let revenueGrowth: number | null = null;
      let epsGrowth: number | null = null;
      let currentRatio: number | null = null;
      let fcf: number | null = null;
      let fcfYield: number | null = null;
      let pcr: number | null = null;
      let psr: number | null = null;
      let evEbitda: number | null = null;
      let peg: number | null = null;
      let eps: number | null = null;
      let payoutRatio: number | null = null;
      let beta: number | null = null;
      let roic: number | null = null;
      let opmTrend3y: number | null = null;
      let gpmTrend3y: number | null = null;
      let shareholderReturn: number | null = null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const summary = await (yf as any).quoteSummary(sym, {
          modules: [
            'financialData', 'defaultKeyStatistics', 'summaryDetail',
            'incomeStatementHistory', 'cashflowStatementHistory',
          ],
        });
        const fd = summary?.financialData;
        const ks = summary?.defaultKeyStatistics;
        const sd = summary?.summaryDetail;
        const mcKrw = q.marketCap ?? 0;

        if (fd?.returnOnEquity != null)   roe            = +(fd.returnOnEquity   * 100).toFixed(1);
        if (fd?.operatingMargins != null) operatingMargin= +(fd.operatingMargins * 100).toFixed(1);
        if (fd?.debtToEquity != null)     debtRatio      = +fd.debtToEquity.toFixed(0);
        if (fd?.returnOnAssets != null)   roa            = +(fd.returnOnAssets   * 100).toFixed(1);
        if (fd?.profitMargins != null)    netMargin      = +(fd.profitMargins    * 100).toFixed(1);
        if (fd?.grossMargins != null)     grossMargin    = +(fd.grossMargins     * 100).toFixed(1);
        if (fd?.revenueGrowth != null)    revenueGrowth  = +(fd.revenueGrowth   * 100).toFixed(1);
        if (fd?.earningsGrowth != null)   epsGrowth      = +(fd.earningsGrowth  * 100).toFixed(1);
        if (fd?.currentRatio != null)     currentRatio   = +fd.currentRatio.toFixed(2);
        if (fd?.freeCashflow != null) {
          fcf     = +(fd.freeCashflow / KRW_PER_USD / 1e9).toFixed(2);
          if (mcKrw > 0) fcfYield = +(fd.freeCashflow / mcKrw * 100).toFixed(2);
        }
        if (fd?.operatingCashflow != null && fd.operatingCashflow > 0 && mcKrw > 0)
          pcr = +(mcKrw / fd.operatingCashflow).toFixed(1);

        if (ks?.enterpriseToEbitda != null) evEbitda   = +ks.enterpriseToEbitda.toFixed(1);
        if (ks?.pegRatio != null)           peg        = +ks.pegRatio.toFixed(2);
        if (ks?.trailingEps != null)        eps        = +ks.trailingEps.toFixed(0);
        if (ks?.payoutRatio != null)        payoutRatio= +(ks.payoutRatio * 100).toFixed(1);
        if (ks?.beta != null)               beta       = +ks.beta.toFixed(2);

        if (sd?.priceToSalesTrailing12Months != null)
          psr = +sd.priceToSalesTrailing12Months.toFixed(1);

        // ROIC ≈ ROE / (1 + D/E)  (D/E stored as %)
        if (fd?.returnOnEquity != null && fd?.debtToEquity != null && fd.debtToEquity >= 0) {
          const de = fd.debtToEquity / 100;
          roic = +(fd.returnOnEquity / (1 + de) * 100).toFixed(1);
        }

        // 영업이익률·매출총이익률 3년 추세 (pp 변화)
        const incStmts: any[] = summary?.incomeStatementHistory?.incomeStatementHistory ?? [];
        if (incStmts.length >= 3) {
          const newest = incStmts[0];
          const oldest = incStmts[Math.min(incStmts.length - 1, 3)];
          const safeOpm = (s: any) => {
            const rev = s?.totalRevenue;
            const op  = s?.operatingIncome ?? s?.ebit;
            return rev && rev !== 0 ? op / rev * 100 : null;
          };
          const safeGpm = (s: any) => {
            const rev = s?.totalRevenue;
            const gp  = s?.grossProfit;
            return rev && rev !== 0 ? gp / rev * 100 : null;
          };
          const opm0 = safeOpm(newest); const opmN = safeOpm(oldest);
          const gpm0 = safeGpm(newest); const gpmN = safeGpm(oldest);
          if (opm0 != null && opmN != null) opmTrend3y = +(opm0 - opmN).toFixed(1);
          if (gpm0 != null && gpmN != null) gpmTrend3y = +(gpm0 - gpmN).toFixed(1);
        }

        // 주주환원율 = (배당 + 자사주매입) / 순이익
        const cfStmts: any[] = summary?.cashflowStatementHistory?.cashflowStatements ?? [];
        if (cfStmts.length > 0 && incStmts.length > 0) {
          const cf = cfStmts[0];
          const divPaid  = Math.abs(cf?.dividendsPaid   ?? 0);
          const buyback  = Math.abs(cf?.repurchaseOfStock ?? 0);
          const netInc   = Math.abs(incStmts[0]?.netIncome ?? 0);
          if (netInc > 0) shareholderReturn = +((divPaid + buyback) / netInc * 100).toFixed(1);
        }
      } catch {
        // quoteSummary 실패 시 null 유지
      }

      results.push({
        t: def.t,
        n: def.n,
        m: 'KR',
        s: def.s,
        cap: +((q.marketCap ?? 0) / KRW_PER_USD / 1e9).toFixed(1),
        per: q.trailingPE != null ? +q.trailingPE.toFixed(1) : null,
        pbr: q.priceToBook != null ? +q.priceToBook.toFixed(2) : null,
        vol: +((q.regularMarketVolume ?? 0) / 1e6).toFixed(1),
        div: +((q.trailingAnnualDividendYield ?? 0) * 100).toFixed(2),
        roe, operatingMargin, debtRatio,
        week52High: q.fiftyTwoWeekHigh != null ? Math.round(q.fiftyTwoWeekHigh) : null,
        week52Low: q.fiftyTwoWeekLow != null ? Math.round(q.fiftyTwoWeekLow) : null,
        psr, evEbitda, peg, pcr,
        roa, netMargin, grossMargin,
        revenueGrowth, epsGrowth,
        currentRatio, fcf, fcfYield,
        eps, payoutRatio, beta,
        roic, opmTrend3y, gpmTrend3y, shareholderReturn,
        price: Math.round(q.regularMarketPrice ?? 0),
        chg: +((q.regularMarketChangePercent ?? 0)).toFixed(2),
        source: 'live',
        sourceLabel: 'Yahoo Finance 실시간',
        asOf: new Date().toISOString(),
      });
      console.log(`  ✓ ${def.n} (${def.t}): ₩${q.regularMarketPrice?.toLocaleString()}`);
    } catch (err) {
      console.warn(`  ✗ ${def.n} (${def.t}) 실패:`, err instanceof Error ? err.message : err);
    }
    await sleep(300);
  }
  return results;
}

if (import.meta.main) {
  (async () => {
    const stocks = await fetchKrStocks();
    console.log(JSON.stringify(stocks, null, 2));
  })().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
