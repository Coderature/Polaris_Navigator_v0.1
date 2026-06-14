import { US_TICKER_TO_KR } from '../data/usTickerKr.js';
import type { StockNewsItem, StockRow } from '../types.js';
import { fetchDaumNews } from './daumNewsCrawler.js';
import { fetchGoogleNewsRss } from './googleNewsRssCrawler.js';
import { fetchNaverFinanceNews } from './naverNewsCrawler.js';

const TARGET_NEWS_COUNT = 10;
const NAVER_FETCH_LIMIT = 6;

/** KR ticker → KR_COMPANIES 한글명 (stock.n과 다른 경우만). */
const KR_TICKER_TO_QUERY: Record<string, string> = {
  '010950': '에스오일',
};

function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeNewsText(text: string): string {
  const cleaned = stripHtmlTags(text).replace(/\s+/g, ' ').trim();
  return cleaned.length > 200 ? cleaned.slice(0, 200) : cleaned;
}

function titleDedupeKey(title: string): string {
  return title.replace(/[\s\W_]+/g, '').toLowerCase();
}

function dedupeKey(url: string, title: string): string {
  const u = url.trim();
  if (u) return `url:${u}`;
  return `title:${titleDedupeKey(title)}`;
}

function tagIsGeneric(stockName: string, title: string, text: string): boolean {
  if (title.includes(stockName)) return false;
  if (text.includes(stockName)) return true;
  return true;
}

interface RawNewsLike {
  source: string;
  title: string;
  date: string;
  url: string;
  text: string;
}

function toStockNewsItem(stockName: string, raw: RawNewsLike): StockNewsItem {
  const title = stripHtmlTags(raw.title);
  const text = normalizeNewsText(raw.text);
  return {
    source: raw.source,
    title,
    date: raw.date,
    url: raw.url,
    text,
    isGeneric: tagIsGeneric(stockName, title, text),
  };
}

function mergeDeduped(
  stockName: string,
  accumulated: StockNewsItem[],
  seen: Set<string>,
  raws: RawNewsLike[],
): void {
  for (const raw of raws) {
    if (accumulated.length >= TARGET_NEWS_COUNT) break;
    const key = dedupeKey(raw.url, raw.title);
    if (seen.has(key)) continue;
    seen.add(key);
    accumulated.push(toStockNewsItem(stockName, raw));
  }
}

export function buildStockNewsSearchQuery(stock: StockRow): { stockName: string; searchQuery: string } {
  if (stock.m === 'KR') {
    const query = KR_TICKER_TO_QUERY[stock.t] ?? stock.n;
    return { stockName: query, searchQuery: query };
  }
  const krName = US_TICKER_TO_KR[stock.t];
  if (!krName) {
    return { stockName: stock.n, searchQuery: `${stock.n} 주가` };
  }
  return { stockName: krName, searchQuery: `${krName} 주가` };
}

export async function collectStockNews(stockName: string, searchQuery: string): Promise<StockNewsItem[]> {
  const accumulated: StockNewsItem[] = [];
  const seen = new Set<string>();

  try {
    const naverDocs = await fetchNaverFinanceNews(searchQuery, NAVER_FETCH_LIMIT);
    mergeDeduped(stockName, accumulated, seen, naverDocs);
  } catch (err) {
    console.warn(`  [news] 네이버 실패 (${searchQuery}):`, err instanceof Error ? err.message : err);
  }

  if (accumulated.length < TARGET_NEWS_COUNT) {
    try {
      const need = TARGET_NEWS_COUNT - accumulated.length;
      const googleDocs = await fetchGoogleNewsRss(searchQuery, need + 4);
      mergeDeduped(stockName, accumulated, seen, googleDocs);
    } catch (err) {
      console.warn(`  [news] 구글 RSS 실패 (${searchQuery}):`, err instanceof Error ? err.message : err);
    }
  }

  if (accumulated.length < TARGET_NEWS_COUNT) {
    try {
      const need = TARGET_NEWS_COUNT - accumulated.length;
      const daumDocs = await fetchDaumNews(searchQuery, need);
      mergeDeduped(stockName, accumulated, seen, daumDocs);
    } catch (err) {
      console.warn(`  [news] 다음 실패 (${searchQuery}):`, err instanceof Error ? err.message : err);
    }
  }

  return accumulated;
}

export async function attachNewsToStocks(stocks: StockRow[]): Promise<void> {
  for (const stock of stocks) {
    const { stockName, searchQuery } = buildStockNewsSearchQuery(stock);
    stock.news = await collectStockNews(stockName, searchQuery);
    console.log(`  ✓ ${stock.n} (${stock.t}): ${stock.news.length}건`);
  }
}
