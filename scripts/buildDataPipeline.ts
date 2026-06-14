import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fetchDartReports } from './crawl/dartCrawler.js';
import { extractPdfDocuments } from './crawl/pdfExtract.js';
import { attachNewsToStocks } from './crawl/stockNewsCollector.js';
import { fetchKrStocks } from './crawl/krStockCrawler.js';
import { fetchUsStocks } from './crawl/usStockCrawler.js';
import { extractFinancialRisks } from './llm/extractor.js';
import type { PipelineOutput, RawDocument, SectorDef, StockRow } from './types.js';

const KR_COMPANIES = [
  '삼성전자', 'SK하이닉스', '현대자동차', '네이버', '카카오',
  '삼성바이오로직스', '셀트리온', 'KB금융', '에스오일',
  'LG에너지솔루션', '현대모비스', '삼성SDI', '포스코홀딩스', '기아',
];

async function loadExistingTreemapData() {
  const sourcePath = path.resolve('public', 'treemap_data.json');
  if (!fs.existsSync(sourcePath)) return null;
  try {
    const raw = fs.readFileSync(sourcePath, 'utf-8');
    return JSON.parse(raw) as { sectors?: SectorDef[]; stocks?: StockRow[]; generated_at?: string };
  } catch {
    return null;
  }
}

async function main() {
  console.log('1/6 US 주식 재무 데이터 수집 시작...');
  const usStocks = await fetchUsStocks();
  console.log(`  ✓ ${usStocks.length}개 종목`);

  console.log('2/6 DART 공시 크롤링 시작...');
  const dartDocs: RawDocument[] = [];
  for (const company of KR_COMPANIES) {
    const docs = await fetchDartReports(company, 1, 10);
    dartDocs.push(...docs);
    console.log(`  ✓ ${company}: ${docs.length}건`);
  }

  console.log('3/6 PDF 자료 추출 시작...');
  const pdfDocs = await extractPdfDocuments([]);

  console.log('4/6 KR 실시간 주가 수집 시작...');
  const krStocks = await fetchKrStocks();
  console.log(`  ✓ ${krStocks.length}개 종목 시세 수집`);

  const mergedStocks: StockRow[] = [
    ...usStocks,
    ...krStocks,
  ];

  console.log('5/6 종목별 뉴스 수집 시작...');
  await attachNewsToStocks(mergedStocks);

  const documents = [...dartDocs, ...pdfDocs];
  console.log(`총 ${documents.length}건 문서 확보 (DART·PDF, 뉴스는 종목별 news 필드)`);

  console.log('6/6 LLM 기반 리스크 추출 수행...');
  const extractedRisks = await extractFinancialRisks(documents.slice(0, 8));

  const existing = await loadExistingTreemapData();

  const output: PipelineOutput = {
    generatedAt: new Date().toISOString(),
    sectors: existing?.sectors,
    stocks: mergedStocks,
    documents,
    extractedRisks,
  };

  const outPath = path.resolve('public', 'polaris_nav_data.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n✅ 완료: ${outPath}`);
  console.log(`   종목 ${mergedStocks.length}개 (US ${usStocks.length}개 + KR ${krStocks.length}개) · 문서 ${documents.length}건 · 리스크 ${extractedRisks.length}건`);
}

main().catch((err) => {
  console.error('파이프라인 오류:', err);
  process.exit(1);
});
