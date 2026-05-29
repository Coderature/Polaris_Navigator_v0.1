import axios from 'axios';
import type { RawDocument } from '../types.js';

const DART_API_KEY = process.env.DART_API_KEY?.trim();
if (!DART_API_KEY) throw new Error('DART_API_KEY is required in environment variables');

const DART_LIST_URL = 'https://opendart.fss.or.kr/api/list.json';

// DART 고유번호 (corp_code) — 종목 코드(stock_code)와 다름
const KR_CORP_CODES: Record<string, string> = {
  삼성전자:       '00126380',
  'SK하이닉스':  '00164779',
  현대자동차:     '00164742',
  네이버:         '00768461',
  카카오:         '00918444',
  삼성바이오로직스: '00877059',
  셀트리온:       '00421045',
  KB금융:        '00399449',
  에스오일:       '00138282',
  LG에너지솔루션:  '01426955',
  현대모비스:     '00164876',
  삼성SDI:       '00126362',
  포스코홀딩스:   '00164520',
  기아:           '00164736',
};

// 공시 유형 분류 — 보고서명 패턴으로 우선순위/색상/뱃지 결정
const DISCLOSURE_CATEGORIES: Array<{
  pattern: RegExp;
  type: string;
  badge: string;
  color: string;
  priority: number;
}> = [
  {
    pattern: /합병|분할|영업양도|영업양수|중요한 영업|임시주주총회|전환사채|신주인수권|유상증자|무상증자|자본감소|주식교환|포괄적 주식교환|조건부자본증권/,
    type: '주요사항', badge: '주요', color: '#6d28d9', priority: 1,
  },
  {
    pattern: /사업보고서|반기보고서|분기보고서/,
    type: '정기공시', badge: '정기', color: '#1d4ed8', priority: 2,
  },
  {
    pattern: /주식등의대량보유|임원·주요주주|소유상황보고|주요주주특정증권/,
    type: '지분공시', badge: '지분', color: '#0f766e', priority: 3,
  },
  {
    pattern: /증권신고서|투자설명서|증권발행실적|소액공모/,
    type: '발행공시', badge: '발행', color: '#b45309', priority: 4,
  },
  {
    pattern: /감사보고서|내부회계관리제도|재무제표재작성/,
    type: '외부감사', badge: '감사', color: '#374151', priority: 5,
  },
  {
    pattern: /동일인등출자계열|계열회사와의.*거래|내부거래|관계회사.*거래/,
    type: '내부거래', badge: '내부', color: '#064e3b', priority: 6,
  },
  {
    pattern: /공정거래위원회|대규모기업집단/,
    type: '공정위공시', badge: '공정위', color: '#9f1239', priority: 7,
  },
  {
    pattern: /최대주주.*변경|주요경영사항|기타.*경영사항/,
    type: '경영공시', badge: '경영', color: '#78350f', priority: 8,
  },
];

function classifyDisclosure(reportNm: string): {
  type: string; badge: string; color: string; priority: number;
} {
  for (const cat of DISCLOSURE_CATEGORIES) {
    if (cat.pattern.test(reportNm)) {
      return { type: cat.type, badge: cat.badge, color: cat.color, priority: cat.priority };
    }
  }
  return { type: '기타공시', badge: '공시', color: '#4b5563', priority: 99 };
}

interface DartListItem {
  corp_name: string;
  report_nm: string;
  rcept_no: string;
  rcept_dt: string;
  stock_code?: string;
  flr_nm?: string;
  corp_cls?: string;
}

function dateStr(offsetDays = 0): string {
  const d = new Date(Date.now() - offsetDays * 86400_000);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

async function fetchDartReportList(corpCode: string, pageCount = 10): Promise<DartListItem[]> {
  const params = new URLSearchParams({
    crtfc_key: DART_API_KEY!,
    corp_code:  corpCode,
    bgn_de:     dateStr(90),
    end_de:     dateStr(0),
    page_no:    '1',
    page_count: String(pageCount),
  });

  const response = await axios.get(DART_LIST_URL, { params, timeout: 20_000 });
  const status = response.data?.status;
  if (!['000', '013'].includes(status)) {
    throw new Error(`DART API 오류 (status=${status}): ${JSON.stringify(response.data)}`);
  }
  if (status === '013' || !Array.isArray(response.data?.list)) return [];
  return response.data.list as DartListItem[];
}

function buildDartUrl(rceptNo: string) {
  return `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${encodeURIComponent(rceptNo)}`;
}

function makeRawDoc(item: DartListItem): RawDocument {
  const { type, badge, color, priority } = classifyDisclosure(item.report_nm);
  const fmtDate = item.rcept_dt.length === 8
    ? `${item.rcept_dt.slice(0, 4)}.${item.rcept_dt.slice(4, 6)}.${item.rcept_dt.slice(6, 8)}`
    : item.rcept_dt;
  return {
    source: 'dart',
    title: item.report_nm,
    date: item.rcept_dt,
    url: buildDartUrl(item.rcept_no),
    text: `[${type}] ${item.corp_name} 공시: ${item.report_nm} (접수일: ${fmtDate}). 제출인: ${item.flr_nm ?? item.corp_name}. 원문: ${buildDartUrl(item.rcept_no)}`,
    metadata: {
      corpName:       item.corp_name,
      receiptNo:      item.rcept_no,
      stockCode:      item.stock_code,
      filerName:      item.flr_nm,
      corpCls:        item.corp_cls,
      disclosureType: type,
      badge,
      badgeColor:     color,
      priority,
      formattedDate:  fmtDate,
    },
  };
}

export async function fetchDartReports(companyName: string, _page = 1, pageCount = 10): Promise<RawDocument[]> {
  const corpCode = KR_CORP_CODES[companyName];
  if (!corpCode) {
    console.warn(`  DART: '${companyName}' 고유번호 없음 — 건너뜀`);
    return [];
  }
  const items = await fetchDartReportList(corpCode, pageCount);
  return items.map(makeRawDoc);
}

if (import.meta.main) {
  (async () => {
    const docs = await fetchDartReports('삼성전자', 1, 10);
    console.log(JSON.stringify(docs, null, 2));
  })().catch((err) => { console.error(err); process.exit(1); });
}
