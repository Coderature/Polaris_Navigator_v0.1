import express from 'express';
import YahooFinance from 'yahoo-finance2';
import axios from 'axios';
import { load } from 'cheerio';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const app = express();
const PORT = 3001;
const CACHE_TTL = 5 * 60 * 1000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let krwPerUsd = 1400;
async function refreshFxRate() {
  try {
    const fx = await yahooFinance.quote('KRW=X');
    if (fx.regularMarketPrice && fx.regularMarketPrice > 500) {
      krwPerUsd = fx.regularMarketPrice;
      console.log(`[quotes] USD/KRW 환율: ${krwPerUsd}`);
    }
  } catch {
    console.warn('[quotes] 환율 갱신 실패, 기존값 유지:', krwPerUsd);
  }
}

const US_DEFS = [
  { t: 'AAPL',  n: 'Apple',     s: 'IT',        m: 'US' },
  { t: 'MSFT',  n: 'Microsoft', s: 'IT',        m: 'US' },
  { t: 'GOOGL', n: 'Alphabet',  s: 'COMMS',     m: 'US' },
  { t: 'NVDA',  n: 'NVIDIA',    s: 'IT',        m: 'US' },
  { t: 'TSLA',  n: 'Tesla',     s: 'CONS_DISC', m: 'US' },
  { t: 'AMZN',  n: 'Amazon',    s: 'CONS_DISC', m: 'US' },
  { t: 'BA',    n: 'Boeing',           s: 'INDUST',    m: 'US' },
  { t: 'KO',    n: 'Coca-Cola',        s: 'CONS_STAP', m: 'US' },
  { t: 'NEE',   n: 'NextEra Energy',   s: 'UTIL',      m: 'US' },
  { t: 'O',     n: 'Realty Income',    s: 'RE',        m: 'US' },
  { t: 'ALB',   n: 'Albemarle',        s: 'MATERIALS', m: 'US' },
] as const;

const KR_DEFS = [
  { t: '005930', n: '삼성전자',       s: 'IT',         m: 'KR' },
  { t: '000660', n: 'SK하이닉스',     s: 'IT',         m: 'KR' },
  { t: '005380', n: '현대자동차',     s: 'CONS_DISC',  m: 'KR' },
  { t: '035420', n: '네이버',         s: 'COMMS',      m: 'KR' },
  { t: '035720', n: '카카오',         s: 'COMMS',      m: 'KR' },
  { t: '207940', n: '삼성바이오로직스', s: 'HEALTH',     m: 'KR' },
  { t: '068270', n: '셀트리온',       s: 'HEALTH',     m: 'KR' },
  { t: '105560', n: 'KB금융',         s: 'FINANCIALS', m: 'KR' },
  { t: '010950', n: 'S-Oil',          s: 'ENERGY',     m: 'KR' },
] as const;

interface QuoteRow {
  t: string; n: string; s: string; m: string;
  price: number; chg: number;
  cap: number; per: number | null; pbr: number | null;
  div: number; vol: number;
  source: string; sourceLabel: string; asOf: string;
}

const NAVER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept-Language': 'ko-KR,ko;q=0.9',
  'Referer': 'https://finance.naver.com/',
};

function parseNaverNum(s: string): number | null {
  const m = s.match(/[\d,]+\.?\d*/);
  return m ? parseFloat(m[0].replace(/,/g, '')) : null;
}

async function fetchNaverPerPbr(code: string): Promise<{ per: number | null; pbr: number | null; div: number | null }> {
  const url = `https://finance.naver.com/item/main.naver?code=${code}`;
  const r = await axios.get<string>(url, { headers: NAVER_HEADERS, timeout: 8000 });
  const $ = load(r.data);
  const rows = $('table.per_table tr').toArray();
  const tdText = (idx: number) => $(rows[idx])?.find('td').text() ?? '';
  const row0Parts = tdText(0).split('l');
  const row2Parts = tdText(2).split('l');
  return {
    per: parseNaverNum(row0Parts[0] ?? ''),
    pbr: parseNaverNum(row2Parts[0] ?? ''),
    div: parseNaverNum(tdText(3)),
  };
}

async function fetchQuote(ticker: string, isKR: boolean): Promise<Partial<QuoteRow> | null> {
  try {
    const symbol = isKR ? `${ticker}.KS` : ticker;
    const q = await yahooFinance.quote(symbol);
    const price = isKR
      ? Math.round(q.regularMarketPrice ?? 0)
      : +(q.regularMarketPrice ?? 0).toFixed(2);
    const cap = isKR
      ? +((q.marketCap ?? 0) / krwPerUsd / 1e9).toFixed(1)
      : +((q.marketCap ?? 0) / 1e9).toFixed(1);
    let per: number | null = q.trailingPE != null ? +q.trailingPE.toFixed(1) : null;
    let pbr: number | null = q.priceToBook != null ? +q.priceToBook.toFixed(2) : null;
    let div = +((q.trailingAnnualDividendYield ?? 0) * 100).toFixed(2);

    // Yahoo Finance doesn't provide per/pbr for KR stocks — fetch from Naver Finance
    if (isKR) {
      try {
        const naver = await fetchNaverPerPbr(ticker);
        if (naver.per != null) per = naver.per;
        if (naver.pbr != null) pbr = naver.pbr;
        if (naver.div != null) div = naver.div;
      } catch {
        // Naver 실패 시 Yahoo 값 유지
      }
    }

    return {
      price,
      chg: +((q.regularMarketChangePercent ?? 0)).toFixed(2),
      cap,
      per,
      pbr,
      div,
      vol:  +((q.regularMarketVolume ?? 0) / 1e6).toFixed(1),
      source: 'live',
      sourceLabel: isKR ? 'Yahoo Finance + Naver Finance' : 'Yahoo Finance 실시간',
      asOf: new Date().toISOString(),
    };
  } catch (err) {
    console.warn(`[quotes] ${ticker} 실패:`, err instanceof Error ? err.message : err);
    return null;
  }
}

async function fetchAllQuotes(): Promise<QuoteRow[]> {
  const results: QuoteRow[] = [];

  for (const def of US_DEFS) {
    const q = await fetchQuote(def.t, false);
    if (q) results.push({ ...def, ...q } as QuoteRow);
    await sleep(300);
  }

  for (const def of KR_DEFS) {
    const q = await fetchQuote(def.t, true);
    if (q) results.push({ ...def, ...q } as QuoteRow);
    await sleep(300);
  }

  console.log(`[quotes] ${results.length}개 종목 갱신 완료 (${new Date().toLocaleTimeString('ko-KR')})`);
  return results;
}

let cache: { data: QuoteRow[]; fetchedAt: number } | null = null;
const logoCache = new Map<string, { buf: Buffer; contentType: string; fetchedAt: number }>();
const LOGO_CACHE_TTL = 24 * 60 * 60 * 1000;

app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

/** FMP stock logo proxy — avoids Clearbit outage + canvas CORS issues. */
app.get('/api/logo/:symbol', async (req, res) => {
  const symbol = `${req.params.symbol ?? ''}`.trim().toUpperCase();
  if (!/^[A-Z0-9.]{1,12}$/.test(symbol)) {
    return res.status(400).json({ error: 'invalid symbol' });
  }

  const cached = logoCache.get(symbol);
  if (cached && Date.now() - cached.fetchedAt < LOGO_CACHE_TTL) {
    res.setHeader('Content-Type', cached.contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(cached.buf);
  }

  const url = `https://financialmodelingprep.com/image-stock/${encodeURIComponent(symbol)}.png`;
  try {
    const upstream = await fetch(url);
    if (!upstream.ok) return res.status(404).end();
    const buf = Buffer.from(await upstream.arrayBuffer());
    const contentType = upstream.headers.get('content-type') || 'image/png';
    logoCache.set(symbol, { buf, contentType, fetchedAt: Date.now() });
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buf);
  } catch (err) {
    res.status(502).json({ error: String(err) });
  }
});

app.get('/api/quotes', async (_req, res) => {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return res.json({ quotes: cache.data, fetchedAt: new Date(cache.fetchedAt).toISOString(), cached: true });
  }
  try {
    const data = await fetchAllQuotes();
    cache = { data, fetchedAt: Date.now() };
    res.json({ quotes: data, fetchedAt: new Date(cache.fetchedAt).toISOString(), cached: false });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.listen(PORT, async () => {
  console.log(`[quotes] 서버 시작 — http://localhost:${PORT}/api/quotes`);
  await refreshFxRate();
  fetchAllQuotes().then((data) => {
    if (data.length > 0) cache = { data, fetchedAt: Date.now() };
  });
});
