import { fetchKrStocks } from './crawl/krStockCrawler.js';
import fs from 'fs';
import path from 'path';
import type { StockRow } from './types.js';

console.log('KR 주식 재무 데이터 수집 중...');
const krStocks = await fetchKrStocks();
console.log(`\n${krStocks.length}개 종목 수집 완료`);

const jsonPath = path.resolve('public/polaris_nav_data.json');
const existing = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as { stocks: StockRow[]; generated_at: string };

const usStocks = existing.stocks.filter((s) => s.m === 'US');
existing.stocks = [...usStocks, ...krStocks];
existing.generated_at = new Date().toISOString();

fs.writeFileSync(jsonPath, JSON.stringify(existing, null, 2), 'utf-8');
console.log(`\n✅ public/polaris_nav_data.json 업데이트 완료`);
console.log(`   KR ${krStocks.length}개 + US ${usStocks.length}개 = 총 ${existing.stocks.length}개`);

console.log('\n=== KR 종목 주요 지표 검증 ===');
krStocks.forEach((s) => {
  console.log(`${s.n}: PER=${s.per} PBR=${s.pbr} ROE=${s.roe} netMargin=${s.netMargin} EPS=${s.eps}`);
});
