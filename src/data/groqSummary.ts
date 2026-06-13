import type { RawDocument, RiskExtraction } from '../types';
import { findViolations } from './summaryGuards';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string | undefined;

const SUMMARY_SYSTEM_PROMPT = `[역할]
당신은 기업 실사(due diligence) 자료를 정리하는 요약 담당자입니다.
투자자가 스스로 판단할 수 있도록 재료를 구조화해 한국어로 제공하며,
평가·전망·조언은 하지 않습니다.

[절대 규칙]
1. 매수·매도·보유 추천, 목표 주가, 주가 전망(상승·하락 예상) 표현을 절대 쓰지 않습니다.
2. '높다/낮다/고평가/저평가/긍정적/부정적/양호/우려' 같은 평가어는 입력 peers에 비교 기준이 있을 때만, 그 기준 수치를 같은 문장에 인용하면서 쓸 수 있습니다. 기준이 없으면 수치만 제시하고 "동종업계 대비 위치는 별도 확인 필요"라고 적습니다.
3. '회사 개요'를 제외한 모든 내용은 입력 데이터에 있는 사실만 사용합니다. 추측하거나 일반 지식으로 채우지 않습니다.
4. 재료가 부족한 섹션에는 "입력 데이터에 관련 정보 없음"이라고 씁니다. 빈자리를 일반론으로 채우지 않습니다.
5. 한국어로만 작성합니다. 한자 혼용을 금지합니다(영문 티커·고유명사는 예외).
6. 면책 문구·인사말·맺음말을 덧붙이지 않습니다.

[입력 데이터 설명]
- 기본 지표: 기업명, 섹터, 시가총액, 거래량, 등락률, PER, PBR, 배당수익률. 값이 '정보없음'이면 그 지표는 언급하지 않습니다.
- risk_signals: 사전 분석된 리스크 목록 {유형, 심각도(low/medium/high), 관련 공급망}. '최근 핵심 이슈'의 1차 재료입니다.
- disclosures: DART 공시의 제목·날짜만 포함하며 본문이 없습니다. 제목만으로 공시의 내용·목적·효과를 해석하지 마세요. 제출 사실과 제목만 전달할 수 있습니다. 정기·의무성 공시는 사전에 제외되어 있습니다.
- news: 최근 시장 뉴스 제목·요약이며 이 종목과 무관할 수 있습니다. 종목과 직접 관련된 것만 사용하고 나머지는 무시합니다.
- peers: 동일 섹터 경쟁사 지표. 평가어 사용이 허용되는 유일한 비교 기준입니다.

[출력 형식 — 아래 4개 섹션을 이 순서·제목 그대로]

**회사 개요**
사업 내용·주요 수익원·경쟁 우위를 2문장 이내로 씁니다. (이 섹션만 일반 지식 사용을 허용하되, 확신 없는 세부 수치·시장 점유율은 쓰지 않습니다)

**최근 핵심 이슈**
2~3개 항목. 각 항목 형식: **제목** — (출처, 날짜) 한 줄 요약 [low/medium/high]
- 심각도는 low / medium / high 영문 그대로 표기합니다. 번역하지 않습니다.
- risk_signals를 우선 사용하고 disclosures·news로 보강합니다.
- 본문이 없는 공시는 "내용은 원문 확인 필요"를 명시합니다.

**종합 정리**
2~3문장. 시가총액·등락률·거래량처럼 화면에 이미 표시된 수치는 반복하지 않습니다.
'최근 핵심 이슈'에 올린 항목을 모두 언급하면서 밸류에이션 수치와 연결해 맥락을 서술합니다. 이슈를 하나만 골라 쓰지 않습니다.
예) "PBR X 수준에서 자기주식 처분 결정이 나온 것은 경영진의 주가 인식에 대한 시그널일 수 있으며, 특수관계인 내부거래 기재정정은 거버넌스 측면에서 추가 확인이 필요한 항목입니다."
전망을 쓰지 않으며, 절대 규칙 2를 따릅니다.

**판단 전 확인 질문**
아래 세 항목을 순서대로 씁니다.

[기회 요인] 입력에서 긍정적으로 해석될 수 있는 항목 1개를 지목하는 질문문("…인가요?")
[위험 요인] 입력에서 리스크가 될 수 있는 항목 1개를 지목하는 질문문("…인가요?")
  좋은 예: "자기주식 처분(2026-05-13) 공시의 처분 목적이 주주환원인지 DART 원문에서 확인했나요?"
  나쁜 예: "DART에서 추가 정보를 확인할 수 있을까요?" — 특정 항목 미지목이므로 금지.
[모니터링] 무엇을 / 어디서(DART·분기보고서·시세 등) / 언제(다음 분기 공시 등) 형태로 1개 씁니다.`;

const FALLBACK_SUMMARY = `**회사 개요**
입력 데이터에 관련 정보 없음

**최근 핵심 이슈**
입력 데이터에 관련 정보 없음

**종합 정리**
입력 데이터에 관련 정보 없음

**판단 전 확인 질문**
입력 데이터에 관련 정보 없음`;

// 공백 정규화 후 비교 — DART 실제 제목이 무공백인 경우 매칭 실패 방지
const normalize = (s: string) => s.replace(/\s+/g, '');

const ROUTINE_DART_PATTERNS = [
  '소유상황보고서', '분기보고서', '반기보고서', '사업보고서',
  '주식등의대량보유상황보고서', '임원·주요주주특정증권', '임원및주요주주',
  '정기주주총회', '증권발행실적보고서', '기업설명회', 'IR개최',
  '기업지배구조보고서', '대규모기업집단현황',
];

const isRoutineDart = (d: RawDocument) =>
  d.source === 'dart' && ROUTINE_DART_PATTERNS.some((p) => normalize(d.title).includes(p));

// 정기·의무공시 집계 줄을 LLM 출력에 결정론적으로 삽입 (**종합 정리** 직전)
function appendRoutineLine(summary: string, routine: RawDocument[]): string {
  if (!routine.length) return summary;
  const titles = routine.slice(0, 3).map((d) => d.title).join(', ');
  const line = `그 외 정기·의무공시 ${routine.length}건 제출(${titles}${routine.length > 3 ? ' 외' : ''})`;
  const anchor = summary.indexOf('**종합 정리**');
  return anchor === -1
    ? `${summary}\n\n${line}`
    : `${summary.slice(0, anchor)}${line}\n\n${summary.slice(anchor)}`;
}

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

async function callGroq(messages: ChatMessage[]): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    signal: AbortSignal.timeout(20000),
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.2,
      max_tokens: 900,
    }),
  });
  if (!res.ok) throw new Error(`Groq API ${res.status}: ${await res.text()}`);
  const data = await res.json() as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content?.trim() ?? '';
}

export async function generateStockSummary(params: {
  name: string;
  sector: string;
  market: string;
  cap: string;
  chg: number;
  per: number | null;
  pbr: number | null;
  div: number;
  vol: number;
  risks: RiskExtraction[];
  documents: RawDocument[];
  sectorPeers: Array<{ name: string; cap: number; chg: number }>;
}): Promise<string> {
  if (!GROQ_API_KEY) throw new Error('VITE_GROQ_API_KEY가 설정되지 않았습니다.');

  const { name, sector, market, cap, chg, per, pbr, div, vol, risks, documents, sectorPeers } = params;

  const riskBlock = risks.length > 0
    ? risks.slice(0, 4).map((r) => {
        const chain = [
          r.upstream.length ? `상류(upstream): ${r.upstream.join(', ')}` : '',
          r.downstream.length ? `하류(downstream): ${r.downstream.join(', ')}` : '',
        ].filter(Boolean).join(' / ');
        return `• [${r.riskSeverity.toUpperCase()}] ${r.riskType} — ${r.summary}${chain ? `\n  공급망: ${chain}` : ''}`;
      }).join('\n')
    : '• 수집된 리스크 신호 없음';

  const routineDocs = documents.filter(isRoutineDart);
  const dartDocs = documents.filter((d) => d.source === 'dart' && !isRoutineDart(d)).slice(0, 4);

  // 종목명이 제목 또는 본문 앞부분에 포함된 뉴스만 통과 — 시장 전반 뉴스 배제
  const nameKey = name.split(/\s+/)[0].toLowerCase();
  const newsDocs = documents
    .filter((d) => d.source !== 'dart')
    .filter((d) => {
      const hay = (d.title + ' ' + d.text.slice(0, 300)).toLowerCase();
      return hay.includes(nameKey);
    })
    .slice(0, 4);

  const dartBlock = dartDocs.length
    ? dartDocs.map((d) => `• [DART · ${d.date}] ${d.title}`).join('\n')
    : '• 수집된 공시 없음';

  const newsBlock = newsDocs.length
    ? newsDocs.map((d) =>
        `• [${d.source.toUpperCase()} · ${d.date}] ${d.title} — ${d.text.slice(0, 200).replace(/\s+/g, ' ')}…`
      ).join('\n')
    : '• 수집된 뉴스 없음';

  const peerBlock = sectorPeers.length > 0
    ? sectorPeers.map((p) =>
        `• ${p.name}: 시총 $${p.cap}B, 등락 ${p.chg >= 0 ? '+' : ''}${p.chg.toFixed(2)}%`
      ).join('\n')
    : '• 비교 대상 없음';

  const dataPrompt = `[기본 지표]
기업명: ${name} (${market})
섹터: ${sector}
시가총액: ${cap} / 거래량: ${vol.toFixed(1)}M
오늘 등락: ${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%
PER: ${per ?? '정보없음'} / PBR: ${pbr ?? '정보없음'} / 배당수익률: ${div.toFixed(2)}%

[risk_signals]
${riskBlock}

[disclosures]
${dartBlock}

[news]
${newsBlock}

[peers]
${peerBlock}`;

  const baseMessages: ChatMessage[] = [
    { role: 'system', content: SUMMARY_SYSTEM_PROMPT },
    { role: 'user', content: dataPrompt },
  ];

  let result = await callGroq(baseMessages);
  const violations = findViolations(result);

  if (violations.length > 0) {
    const retryMessages: ChatMessage[] = [
      ...baseMessages,
      { role: 'assistant', content: result },
      {
        role: 'user',
        content: `이전 응답이 다음 규칙을 위반했습니다: ${violations.join(', ')}. 해당 표현 없이 다시 작성해 주세요.`,
      },
    ];
    result = await callGroq(retryMessages);
    if (findViolations(result).length > 0) {
      return `AI 요약이 안전 기준을 통과하지 못해 기본 요약으로 대체되었습니다.\n\n${FALLBACK_SUMMARY}`;
    }
  }

  return appendRoutineLine(result, routineDocs);
}
