import './styles.css';
import * as THREE from 'three';
import { loadTreemapData } from './data/loadTreemapData';
import { initQuotesClient } from './data/quotesClient';
import {
  type MarketCode,
  type SectorDef,
  type StockRow,
  dataSnapshotBaselineLabel,
} from './types';
import { TreemapScene, type TreemapBuildProgress } from './scene/TreemapScene';
import { MetricsPanel } from './features/metrics/MetricsPanel';

const GURU_QUOTES: { text: string; author: string }[] = [
  
  { text: '다른 사람이 탐욕스러울 때 두려워하고, 다른 사람이 두려워할 때 탐욕스러워라.', author: 'Warren Buffett' },
  { text: '가격은 당신이 지불하는 것이고, 가치는 당신이 얻는 것이다.', author: 'Warren Buffett' },
  { text: '큰 돈은 사는 것도, 파는 것도 아닌 — 기다리는 데서 번다.', author: 'Charlie Munger' },
  
  { text: '시장은 인내심 없는 자의 돈을 인내심 있는 자에게 옮기는 장치이다.', author: 'Warren Buffett' },
  { text: '주식 시장은 적극적인 자에게서 인내하는 자에게로 돈을 이전하는 도구다.', author: 'Benjamin Graham' },
  { text: '자신이 이해하지 못하는 사업에는 절대 투자하지 마라.', author: 'Warren Buffett' },
  { text: '위험은 자신이 무엇을 하는지 모르는 데서 온다.', author: 'Warren Buffett' },
  { text: '10년간 보유할 주식이 아니라면, 10분도 보유하지 마라.', author: 'Warren Buffett' },
  { text: '좋은 기업을 적정한 가격에 사는 것이 적정한 기업을 좋은 가격에 사는 것보다 훨씬 낫다.', author: 'Warren Buffett' },
  { text: '손실 종목을 팔고 승자 종목을 보유하는 대신, 승자를 팔고 패자를 붙드는 것은 — 꽃을 꺾고 잡초에 물을 주는 것과 같다.', author: 'Peter Lynch' },
  { text: '당신이 어디로 가는지 모른다면, 결국 다른 곳에 도착하게 된다.', author: 'Peter Lynch' },
  { text: '주식 투자에서 위장(stomach)이 두뇌보다 더 중요한 기관이다.', author: 'Peter Lynch' },
  { text: '져도 감당할 수 있는 만큼만 걸어라. 그래야 다음 판이 들어왔을 때 잡을 수 있다.', author: 'Paul Tudor Jones' },
  { text: '훌륭한 트레이더의 가장 중요한 규칙: 공격이 아니라 방어가 먼저다.', author: 'Paul Tudor Jones' },
  { text: '시장에서 영웅이 되려 하지 마라. 자존심을 버려라. 틀렸다고 생각되면 인정하고 빠져나와라.', author: 'Paul Tudor Jones' },
  { text: '맞고 틀리고가 중요한 것이 아니다. 맞았을 때 얼마를 벌고, 틀렸을 때 얼마를 잃느냐가 중요하다.', author: 'George Soros' },
  { text: '시장은 항상 틀린다. 시장의 편향이 곧 기회다.', author: 'George Soros' },
  { text: '내가 부자가 된 것은 내가 틀렸다는 사실을 인정할 줄 알았기 때문이다.', author: 'George Soros' },
];

function pickRandomQuote() {
  return GURU_QUOTES[Math.floor(Math.random() * GURU_QUOTES.length)];
}

/** Splash와 동일: show → 3.5s → fade-out → 1.2s 후 숨김 */
function runGuruQuoteOverlaySequence(
  quoteWrap: HTMLElement,
  quoteText: HTMLElement,
  quoteAuthor: HTMLElement,
): Promise<void> {
  const q = pickRandomQuote();
  quoteText.textContent = q.text;
  quoteAuthor.textContent = q.author;
  quoteWrap.hidden = false;
  quoteWrap.classList.remove('show', 'fade-out');

  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      quoteWrap.classList.add('show');
      setTimeout(() => {
        quoteWrap.classList.add('fade-out');
        setTimeout(() => {
          quoteWrap.classList.remove('show', 'fade-out');
          quoteWrap.hidden = true;
          resolve();
        }, 1200);
      }, 3500);
    });
  });
}

function resetVillageGuruQuote() {
  const wrap = document.getElementById('village-guru-quote');
  if (!wrap) return;
  wrap.hidden = true;
  wrap.classList.remove('show', 'fade-out');
}

function runSplashSequence(): Promise<void> {
  return new Promise((resolve) => {
    const splash = document.getElementById('splash')!;
    splash.style.display = '';
    const loading = document.getElementById('splash-loading')!;
    const quoteWrap = document.getElementById('splash-quote')!;
    const quoteText = document.getElementById('quote-text')!;
    const quoteAuthor = document.getElementById('quote-author')!;

    setTimeout(() => {
      loading.classList.add('fade-out');

      setTimeout(() => {
        void runGuruQuoteOverlaySequence(quoteWrap, quoteText, quoteAuthor).then(() => {
          splash.classList.add('fade-out');
          setTimeout(() => {
            splash.style.display = 'none';
            resolve();
          }, 800);
        });
      }, 600);
    }, 3000);
  });
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitFrames(count: number): Promise<void> {
  return new Promise((resolve) => {
    let left = count;
    const step = () => {
      if (left <= 0) resolve();
      else {
        left -= 1;
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  });
}

/** Village entry loader — single source for % label and bar width. */
const villageLoadingProgress = {
  percent: 0,
  phase: 'Navigator 마을을 여는 중…',
  indeterminate: true,
};

function applyVillageLoadingProgressUI() {
  const root = document.getElementById('village-loading')!;
  const sub = document.getElementById('village-loading-sub')!;
  const pctEl = document.getElementById('village-loading-pct')!;
  const fill = document.getElementById('village-loading-bar-fill') as HTMLElement | null;
  const { percent, phase, indeterminate } = villageLoadingProgress;

  sub.textContent = phase;
  root.classList.toggle('is-indeterminate', indeterminate);

  if (indeterminate) {
    pctEl.textContent = '';
    if (fill) fill.style.width = '';
    return;
  }

  const clamped = Math.min(100, Math.max(0, Math.round(percent)));
  pctEl.textContent = `${clamped}%`;
  if (fill) fill.style.width = `${clamped}%`;
}

function setVillageLoadingProgress(percent: number, phase: string) {
  villageLoadingProgress.indeterminate = false;
  villageLoadingProgress.percent = percent;
  villageLoadingProgress.phase = phase;
  applyVillageLoadingProgressUI();
}

function showVillageLoading(message = 'Navigator 마을을 여는 중…', indeterminate = true) {
  villageLoadingProgress.percent = 0;
  villageLoadingProgress.phase = message;
  villageLoadingProgress.indeterminate = indeterminate;
  applyVillageLoadingProgressUI();

  const root = document.getElementById('village-loading')!;
  root.classList.remove('fade-out');
  root.hidden = false;
}

function updateVillageLoadingProgress(done: number, total: number, phase: string) {
  const percent = total > 0 ? (done / total) * 100 : 0;
  setVillageLoadingProgress(percent, phase);
}

async function yieldToPaint(): Promise<void> {
  await waitFrames(2);
}

async function hideVillageLoading() {
  const root = document.getElementById('village-loading')!;
  root.classList.add('fade-out');
  await waitMs(520);
  root.hidden = true;
  root.classList.remove('fade-out');
}

function fmtBn(cap: number): string {
  if (cap >= 1000) return `${(cap / 1000).toFixed(2)}T`;
  return `${cap.toFixed(1)}B`;
}

function fmtPrice(p: number, market: MarketCode): string {
  if (market === 'KR') return `₩${Math.round(p).toLocaleString('ko-KR')}`;
  return `$${p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}


function restingFootprintXZ(g: THREE.Group): number {
  const xz = g.userData.footprintRestXZ as number | undefined;
  return xz != null && xz > 0 ? xz : 1;
}

function setBuildingInteractionScale(mesh: THREE.Group, xzFactor: number) {
  const xz = restingFootprintXZ(mesh) * xzFactor;
  mesh.scale.set(xz, 1, xz);
}

function resetBuildingInteractionScale(mesh: THREE.Group) {
  const xz = restingFootprintXZ(mesh);
  mesh.scale.set(xz, 1, xz);
}


function waitForConsent(): Promise<void> {
  return new Promise((resolve) => {
    const modal = document.getElementById('modal')!;
    const inlineWarn = document.getElementById('m-warn')!;

    modal.classList.add('show');
    document.body.classList.add('pre-consent');

    document.getElementById('m-agree')!.addEventListener('click', () => {
      localStorage.setItem('consent_given', JSON.stringify({ consent: true, timestamp: new Date().toISOString() }));
      modal.classList.remove('show');
      document.body.classList.remove('pre-consent');
      inlineWarn.classList.remove('show');
      resolve();
    }, { once: true });

    document.getElementById('m-cancel')!.addEventListener('click', () => {
      inlineWarn.classList.add('show');
    });
  });
}

async function main() {
  await waitForConsent();
  const dataPromise = loadTreemapData();
  await runSplashSequence();
  const { sectors, stocks, extractedRisks, documents } = await dataPromise;
  const secById = Object.fromEntries(sectors.map((s) => [s.id, s])) as Record<string, SectorDef>;

  const canvas = document.getElementById('scene') as HTMLCanvasElement;
  const wrap = document.getElementById('scene-wrap') as HTMLElement;
  let treemap: TreemapScene | null = null;
  let treemapBoot: Promise<TreemapScene> | null = null;

  async function ensureTreemap(onProgress?: TreemapBuildProgress): Promise<TreemapScene> {
    if (treemap) return treemap;
    if (!treemapBoot) {
      treemapBoot = (async () => {
        await yieldToPaint();
        const t = await TreemapScene.create(canvas, stocks, sectors, wrap, (done, total, phase) => {
          onProgress?.(done, total, phase);
        });
        treemap = t;
        return t;
      })();
    }
    return treemapBoot;
  }

  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const tooltipEl = document.getElementById('tooltip')!;
  const ttName = document.getElementById('tt-name')!;
  const ttTicker = document.getElementById('tt-ticker')!;
  const ttChg = document.getElementById('tt-chg')!;
  const ttChgRow = document.getElementById('tt-chg-row')!;
  const ttSector = document.getElementById('tt-sector')!;
  const ttCap = document.getElementById('tt-cap')!;

  const panel = document.getElementById('panel')!;
  const metricsPanel = new MetricsPanel(document.getElementById('fav-metrics-panel')!);
  const pTicker = document.getElementById('p-ticker')!;
  const pMarket = document.getElementById('p-market')!;
  const pName = document.getElementById('p-name')!;
  const pSecDot = document.getElementById('p-sec-dot')!;
  const pSecName = document.getElementById('p-sec-name')!;
  const pPrice = document.getElementById('p-price')!;
  const pChg = document.getElementById('p-chg')!;
  const pWatch = document.getElementById('p-watch')!;
  const hintEl = document.getElementById('hint')!;


  let hovered: THREE.Group | null = null;
  let highlighted: THREE.Group | null = null;
  let downX = 0;
  let downY = 0;
  let dragDist = 0;
  let isDown = false;
  let currentStock: StockRow | null = null;

  const appDataSource = stocks.every((s) => s.source === 'live')
    ? 'live'
    : stocks.some((s) => s.source === 'live')
      ? 'cached'
      : 'mock';


  function buildingFromIntersect(obj: THREE.Object3D | null): THREE.Group | null {
    if (!treemap) return null;
    let o: THREE.Object3D | null = obj;
    const active = treemap.stockGroup;
    while (o && o.parent !== active) o = o.parent;
    return o && o.parent === active && o.userData?.stock ? (o as THREE.Group) : null;
  }

  function showTooltip(st: StockRow, x: number, y: number) {
    const sec = secById[st.s];
    ttName.textContent = st.n;
    ttTicker.textContent = `${st.t} · ${st.m}`;
    ttChgRow.classList.remove('up', 'down', 'hidden');
    if (st.halted) {
      ttChg.textContent = '⊘ halted';
    } else {
      const sign = (st.chg ?? 0) >= 0 ? '+' : '';
      ttChg.textContent = `${sign}${(st.chg ?? 0).toFixed(2)}%`;
      ttChgRow.classList.add((st.chg ?? 0) >= 0 ? 'up' : 'down');
    }
    ttSector.textContent = sec.ko;
    ttCap.textContent = `$${fmtBn(st.cap)}`;
    tooltipEl.classList.add('show');
    const px = Math.min(window.innerWidth - 220, x + 14);
    const py = Math.min(window.innerHeight - 140, y + 14);
    tooltipEl.style.left = `${px}px`;
    tooltipEl.style.top = `${py}px`;
  }

  function showSectorTooltip(sectorId: string, x: number, y: number) {
    if (!treemap) return;
    const sec = secById[sectorId];
    if (!sec) return;
    const members = treemap.getStocksInLayoutSector(sectorId);
    const totalCap = members.reduce((a, s) => a + s.cap, 0);
    ttName.textContent = sec.ko;
    ttTicker.textContent = sec.name;
    ttChgRow.classList.add('hidden');
    ttSector.textContent = `종목 ${members.length}개`;
    ttCap.textContent = `$${fmtBn(totalCap)}`;
    tooltipEl.classList.add('show');
    const px = Math.min(window.innerWidth - 220, x + 14);
    const py = Math.min(window.innerHeight - 140, y + 14);
    tooltipEl.style.left = `${px}px`;
    tooltipEl.style.top = `${py}px`;
  }

  function hideTooltip() {
    tooltipEl.classList.remove('show');
  }

  function updatePointer(e: PointerEvent) {
    if (!treemap) return;
    const rect = canvas.getBoundingClientRect();
    ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    ray.setFromCamera(ndc, treemap.camera);

    if (navigatorView === 'overview' && treemap.isOverviewSectorOnly) {
      const st = treemap.pickStockLotFromRaycaster(ray);
      if (st) {
        showTooltip(st, e.clientX, e.clientY);
        treemap.setHoveredSector(treemap.getLayoutSectorId(st));
        treemap.setHoveredStockLot(st);
        if (hovered) resetBuildingInteractionScale(hovered);
        hovered = null;
        canvas.style.cursor = 'pointer';
      } else {
        treemap.setHoveredStockLot(null);
        if (hovered) resetBuildingInteractionScale(hovered);
        hovered = null;
        canvas.style.cursor = 'grab';
        hideTooltip();
        treemap.setHoveredSector(null);
      }
      return;
    }

    const hits = ray.intersectObjects(treemap.stockGroup.children, true);
    const building = hits.length ? buildingFromIntersect(hits[0].object) : null;
    if (building) {
      const st = building.userData.stock as StockRow;
      showTooltip(st, e.clientX, e.clientY);
      treemap.setHoveredSector(st.s);
      if (hovered !== building) {
        if (hovered) resetBuildingInteractionScale(hovered);
        hovered = building;
        setBuildingInteractionScale(hovered, 1.05);
        canvas.style.cursor = 'pointer';
      }
    } else {
      if (hovered) resetBuildingInteractionScale(hovered);
      hovered = null;
      canvas.style.cursor = 'grab';
      hideTooltip();
      treemap.setHoveredSector(
        panel.classList.contains('open') && currentStock ? currentStock.s : null,
      );
    }
  }

  function handleClick(e: PointerEvent) {
    if (!treemap) return;
    updatePointer(e);
    if (navigatorView === 'overview' && treemap.isOverviewSectorOnly) {
      const st = treemap.pickStockLotFromRaycaster(ray);
      if (st) openPanel(st, null);
      else closePanel();
      return;
    }
    ray.setFromCamera(ndc, treemap.camera);
    const hits = ray.intersectObjects(treemap.stockGroup.children, true);
    const building = hits.length ? buildingFromIntersect(hits[0].object) : null;
    if (building) {
      openPanel(building.userData.stock as StockRow, building);
    } else {
      closePanel();
    }
  }

  function renderRisksForStock(st: StockRow) {
    const newsList = document.getElementById('news-list')!;
    const dartList = document.getElementById('dart-list')!;

    const matchRisk = (r: { company: string; ticker?: string }) =>
      r.company.includes(st.n) || st.n.includes(r.company) || r.ticker === st.t;

    const risks = extractedRisks.filter(matchRisk);
    const dartDocs = documents.filter(
      (d) => d.source === 'dart' && matchRisk({ company: String(d.metadata?.corpName ?? ''), ticker: String(d.metadata?.stockCode ?? '') }),
    );
    const naverDocs = documents.filter(
      (d) => d.source === 'naver' && (d.title.includes(st.n) || (d.metadata?.query as string ?? '').length > 0),
    );

    const severityBg: Record<string, string> = {
      high:   'linear-gradient(135deg,#7f1d1d,#ef4444)',
      medium: 'linear-gradient(135deg,#78350f,#f59e0b)',
      low:    'linear-gradient(135deg,#064e3b,#10b981)',
    };
    const severityText: Record<string, string> = { high: '고위험', medium: '중위험', low: '저위험' };

    if (risks.length > 0) {
      newsList.innerHTML = risks.slice(0, 4).map((r) => `
        <div class="news-item">
          <div class="news-icon" style="background:${severityBg[r.riskSeverity] ?? 'linear-gradient(135deg,#374151,#6b7280)'}">!</div>
          <div class="news-content">
            <div class="news-title">[${severityText[r.riskSeverity] ?? r.riskSeverity}] ${r.riskType}</div>
            <div class="news-summary">${r.summary}</div>
            ${r.keywords.length ? `<div class="news-meta">${r.keywords.slice(0, 4).join(' · ')}</div>` : ''}
          </div>
          <a class="news-action" href="${r.sourceUrl}" target="_blank" rel="noopener">›</a>
        </div>`).join('');
    } else if (naverDocs.length > 0) {
      newsList.innerHTML = naverDocs.slice(0, 3).map((d) => `
        <div class="news-item">
          <div class="news-icon" style="background:linear-gradient(135deg,#1e3a8a,#3b82f6)">N</div>
          <div class="news-content">
            <div class="news-title">${d.title}</div>
            <div class="news-meta">${d.date}</div>
          </div>
          <a class="news-action" href="${d.url}" target="_blank" rel="noopener">›</a>
        </div>`).join('');
    } else {
      newsList.innerHTML = '<div class="news-item news-empty"><div class="news-meta">이 종목의 리스크 데이터가 없습니다.</div></div>';
    }

    if (dartDocs.length > 0) {
      // 우선순위(중요 공시 먼저) → 날짜 내림차순 정렬
      const sortedDart = [...dartDocs].sort((a, b) => {
        const pa = (a.metadata?.priority as number ?? 99);
        const pb = (b.metadata?.priority as number ?? 99);
        if (pa !== pb) return pa - pb;
        return String(b.date).localeCompare(String(a.date));
      });
      dartList.innerHTML = sortedDart.slice(0, 8).map((d) => {
        const badge      = String(d.metadata?.badge      ?? 'D');
        const badgeColor = String(d.metadata?.badgeColor ?? '#064e3b');
        const fmtDate    = String(d.metadata?.formattedDate ?? d.date);
        const dtype      = String(d.metadata?.disclosureType ?? '');
        return `
        <div class="news-item">
          <div class="news-icon" style="background:${badgeColor};font-size:10px">${badge}</div>
          <div class="news-content">
            <div class="news-title">${d.title}</div>
            <div class="news-meta"><span style="color:${badgeColor};font-weight:600">${dtype}</span> · ${fmtDate}</div>
          </div>
          <a class="news-action" href="${d.url}" target="_blank" rel="noopener">›</a>
        </div>`;
      }).join('');
    } else {
      dartList.innerHTML = '<div class="news-item news-empty"><div class="news-meta">공시 데이터가 없습니다.</div></div>';
    }
  }

  // ── Sparkline helpers ──────────────────────────────────────────────────────

  function yahooSymbol(t: string, m: MarketCode): string {
    return m === 'US' ? t : `${t}.KS`;
  }

  async function fetchSparklinePrices(symbol: string): Promise<number[]> {
    const url = `/yahoo-chart/v8/finance/chart/${symbol}?interval=5m&range=1d&includePrePost=false`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`Yahoo chart ${res.status}`);
    const json = await res.json();
    const closes: (number | null)[] =
      json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
    return closes.filter((v): v is number => v != null && isFinite(v));
  }

  function drawSparkline(canvas: HTMLCanvasElement, prices: number[], isUp: boolean) {
    const ctx = canvas.getContext('2d');
    if (!ctx || prices.length < 2) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const pad = 5;

    const color = isUp ? '#D85A52' : '#4F7FD8';
    const colorFill = isUp ? 'rgba(216,90,82,0.18)' : 'rgba(79,127,216,0.18)';

    const pts = prices.map((p, i) => ({
      x: (i / (prices.length - 1)) * w,
      y: h - pad - ((p - min) / range) * (h - pad * 2),
    }));

    ctx.beginPath();
    ctx.moveTo(pts[0].x, h);
    pts.forEach((pt) => ctx.lineTo(pt.x, pt.y));
    ctx.lineTo(pts[pts.length - 1].x, h);
    ctx.closePath();
    ctx.fillStyle = colorFill;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.forEach((pt) => ctx.lineTo(pt.x, pt.y));
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    const last = pts[pts.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  // ──────────────────────────────────────────────────────────────────────────

  function openPanel(st: StockRow, mesh: THREE.Group | null) {
    if (!treemap) return;
    currentStock = st;
    treemap.setHoveredSector(st.s);
    const sec = secById[st.s];

    // ── MetricsPanel 업데이트 ──
    metricsPanel.open(st, sec);

    // ── 기본 텍스트 채우기 ──
    pTicker.textContent = st.t;
    pMarket.textContent = st.m;
    pName.textContent = st.n;
    pSecDot.style.background = sec.color;
    pSecName.textContent = sec.ko;

    // ── Accent Bar: 섹터 색 ──
    const accentBar = document.getElementById('p-accent-bar')!;
    accentBar.style.background = sec.color;

    // ── 가격 및 등락 ──
    pPrice.textContent = st.halted ? '—' : fmtPrice(st.price ?? 0, st.m);
    pChg.classList.remove('up', 'down');
    const priceBlock = document.getElementById('p-price-block')!;
    priceBlock.classList.remove('up', 'down');
    if (st.halted) {
      pChg.textContent = '⊘ halted';
    } else {
      const sign = (st.chg ?? 0) >= 0 ? '+' : '';
      pChg.textContent = `${sign}${(st.chg ?? 0).toFixed(2)}%`;
      const dir = (st.chg ?? 0) >= 0 ? 'up' : 'down';
      pChg.classList.add(dir);
      priceBlock.classList.add(dir);
    }

    // ── 지표 ──
    document.getElementById('m-cap')!.textContent = `$${fmtBn(st.cap)}`;
    document.getElementById('m-vol')!.textContent = `${st.vol.toFixed(1)}M`;
    document.getElementById('m-per')!.textContent = st.per == null ? '—' : st.per.toFixed(1);
    document.getElementById('m-pbr')!.textContent = st.pbr == null ? '—' : st.pbr.toFixed(2);
    document.getElementById('m-div')!.textContent = `${st.div.toFixed(2)}%`;
    document.getElementById('m-roe')!.textContent    = st.roe            == null ? '—' : `${st.roe.toFixed(1)}%`;
    document.getElementById('m-opm')!.textContent    = st.operatingMargin== null ? '—' : `${st.operatingMargin.toFixed(1)}%`;
    document.getElementById('m-debt')!.textContent   = st.debtRatio      == null ? '—' : `${st.debtRatio.toFixed(0)}%`;
    const m52El = document.getElementById('m-52w')!;
    if (st.week52High == null || st.week52Low == null) {
      m52El.textContent = '—';
    } else {
      m52El.innerHTML =
        `<span class="m-52w-high">↑ ${fmtPrice(st.week52High, st.m)}</span>` +
        `<span class="m-52w-low">↓ ${fmtPrice(st.week52Low, st.m)}</span>`;
    }

    const fmtX   = (v: number | null | undefined, d = 1) => v == null ? '—' : `${v.toFixed(d)}x`;
    const fmtPct = (v: number | null | undefined, d = 1) => v == null ? '—' : `${v.toFixed(d)}%`;
    const fmtGrowth = (v: number | null | undefined) =>
      v == null ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
    const fmtFcf = (v: number | null | undefined) => {
      if (v == null) return '—';
      return v < 0 ? `-$${fmtBn(-v)}` : `$${fmtBn(v)}`;
    };

    document.getElementById('m-psr')!.textContent    = fmtX(st.psr);
    document.getElementById('m-ev')!.textContent     = fmtX(st.evEbitda);
    document.getElementById('m-peg')!.textContent    = st.peg    == null ? '—' : st.peg.toFixed(2);
    document.getElementById('m-pcr')!.textContent    = fmtX(st.pcr);
    document.getElementById('m-roa')!.textContent    = fmtPct(st.roa);
    document.getElementById('m-net')!.textContent    = fmtPct(st.netMargin);
    document.getElementById('m-gp')!.textContent     = fmtPct(st.grossMargin);
    document.getElementById('m-revg')!.textContent   = fmtGrowth(st.revenueGrowth);
    document.getElementById('m-epsg')!.textContent   = fmtGrowth(st.epsGrowth);
    document.getElementById('m-cr')!.textContent     = st.currentRatio == null ? '—' : st.currentRatio.toFixed(2);
    document.getElementById('m-fcf')!.textContent    = fmtFcf(st.fcf);
    document.getElementById('m-fcfy')!.textContent   = fmtPct(st.fcfYield, 2);
    document.getElementById('m-eps')!.textContent    = st.eps == null ? '—' : fmtPrice(st.eps, st.m);
    document.getElementById('m-beta')!.textContent   = st.beta   == null ? '—' : st.beta.toFixed(2);
    document.getElementById('m-roic')!.textContent      = fmtPct(st.roic);
    document.getElementById('m-opm-trend')!.textContent = st.opmTrend3y == null ? '—' : `${st.opmTrend3y >= 0 ? '+' : ''}${st.opmTrend3y.toFixed(1)}pp`;
    document.getElementById('m-gpm-trend')!.textContent = st.gpmTrend3y == null ? '—' : `${st.gpmTrend3y >= 0 ? '+' : ''}${st.gpmTrend3y.toFixed(1)}pp`;
    document.getElementById('m-sr')!.textContent        = fmtPct(st.shareholderReturn);

    // ── Sparkline ──
    const sparkCanvas = document.getElementById('p-sparkline') as HTMLCanvasElement | null;
    if (sparkCanvas) {
      const ctx = sparkCanvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, sparkCanvas.width, sparkCanvas.height);
      const isUp = (st.chg ?? 0) >= 0;
      fetchSparklinePrices(yahooSymbol(st.t, st.m))
        .then((prices) => { if (prices.length >= 2) drawSparkline(sparkCanvas, prices, isUp); })
        .catch(() => {});
    }

    // ── 건물 하이라이트 ──
    if (highlighted && highlighted !== mesh) resetBuildingInteractionScale(highlighted);
    if (mesh) {
      setBuildingInteractionScale(mesh, 1.08);
      highlighted = mesh;
    } else {
      if (highlighted) resetBuildingInteractionScale(highlighted);
      highlighted = null;
    }

    // ── 패널 열기 + 섹션 fade-in 애니메이션 재트리거 ──
    panel.classList.add('open');
    hintEl.classList.add('hide');

    const sections = panel.querySelectorAll('.panel-body .section');
    sections.forEach((s) => s.classList.remove('animate-in'));
    void (panel.querySelector('.panel-body') as HTMLElement).offsetWidth; // reflow
    sections.forEach((s) => s.classList.add('animate-in'));

    // ── 뉴스/공시 ──
    renderRisksForStock(st);

    // ── 워치리스트 버튼 ──
    pWatch.classList.toggle('on', isWatched(st.t));
    pWatch.textContent = isWatched(st.t) ? '★ Saved' : '☆ Save';

  }

  function closePanel() {
    panel.classList.remove('open');
    treemap?.setHoveredSector(null);
    if (highlighted) {
      resetBuildingInteractionScale(highlighted);
      highlighted = null;
    }
    currentStock = null;
  }

  const navViewToggle = document.getElementById('navViewToggle')!;
  const overviewSceneControls = document.getElementById('overviewSceneControls')!;
  const overviewSectorInput = document.getElementById('overviewSectorOnlyInput') as HTMLInputElement;
  const legendModeNote = document.getElementById('legend-mode-note')!;
  const legendStaticRows = document.getElementById('legend-static-rows')!;

  let navigatorView: 'overview' | 'chg' | 'marketCap' = 'overview';
  let overviewSectorOnly = false;

  function syncOverviewSectorToggleUi() {
    const show = navigatorView === 'overview' && !navViewToggle.classList.contains('hidden');
    overviewSceneControls.classList.toggle('hidden', !show);
    overviewSectorInput.checked = overviewSectorOnly;
  }

  function setOverviewSectorOnly(on: boolean) {
    if (!treemap) return;
    overviewSectorOnly = on;
    treemap.setOverviewSectorOnly(on);
    syncOverviewSectorToggleUi();
    if (on) {
      if (hovered) resetBuildingInteractionScale(hovered);
      hovered = null;
      hideTooltip();
      treemap.setHoveredSector(null);
      treemap.setHoveredStockLot(null);
    } else {
      closePanel();
    }
    updateLegendAndHintForView();
  }

  function updateLegendAndHintForView() {
    hintEl.innerHTML =
      '<span class="kbd">드래그</span> 회전 · <span class="kbd">스크롤</span> 확대 · <span class="kbd">클릭</span> 상세 패널';
    if (navigatorView === 'overview') {
      legendStaticRows.innerHTML = overviewSectorOnly
        ? '<div class="row"><span class="swatch" style="background:#888888"></span>섹터·종목 타일 · GICS 색 · 건물 숨김</div>'
        : '<div class="row"><span class="swatch" style="background:#4b5563"></span>빌딩 본체 · 중립 톤 · 균일 높이</div>';
      legendModeNote.textContent = overviewSectorOnly
        ? '섹터만 보기: 섹터 경계 안에 종목 타일이 나뉘어 표시됩니다. 호버·클릭으로 종목 확인.'
        : '바닥은 연한 초록 반투명 필드(분위기). 타일 면적·바닥 % = 시가총액 비중. 구역 경계는 얇은 라인.';
    } else if (navigatorView === 'chg') {
      legendStaticRows.innerHTML = `
        <div class="row"><span class="swatch" style="background:var(--change-up)"></span>상승 · 높이·색</div>
        <div class="row"><span class="swatch" style="background:var(--change-down)"></span>하락 · 높이·색</div>
        <div class="row"><span class="swatch" style="background:#8a8f98"></span>보합·정지</div>`;
      legendModeNote.textContent =
        '3D: 직육면체 높이는 등락 강도, 본체 색은 등락 방향입니다. 바닥은 어둡게 두고 구역 라인을 조금 더 진하게. 타일 면적은 시총 비중.';
    } else if (navigatorView === 'marketCap') {
      legendStaticRows.innerHTML =
        '<div class="row"><span class="swatch" style="background:#4b5563"></span>높이 · Overview와 동일 · 면적 = 시총</div>';
      legendModeNote.textContent =
        '3D: 타일 면적 = 실제 시가총액(십억 USD) 비율. 빌딩은 구역을 채웁니다. 포트폴리오 비중과 무관.';
    }
  }

  function setNavigatorView(mode: 'overview' | 'chg' | 'marketCap') {
    if (!treemap) return;
    navigatorView = mode;
    if (mode !== 'overview' && overviewSectorOnly) {
      overviewSectorOnly = false;
      treemap.setOverviewSectorOnly(false);
    }
    navViewToggle.querySelectorAll('.nv-btn[data-view]').forEach((b) => {
      const btn = b as HTMLButtonElement;
      btn.classList.toggle('active', btn.dataset.view === mode);
    });

    treemap.setVisualMode(mode);
    syncOverviewSectorToggleUi();
    updateLegendAndHintForView();
    treemap.resize();
  }

  overviewSectorInput.addEventListener('change', () => {
    if (navigatorView !== 'overview') return;
    setOverviewSectorOnly(overviewSectorInput.checked);
  });

  navViewToggle.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-view]') as HTMLButtonElement | null;
    if (!btn?.dataset.view) return;
    setNavigatorView(btn.dataset.view as 'overview' | 'chg' | 'marketCap');
  });

  canvas.addEventListener('pointerdown', (e) => {
    isDown = true;
    dragDist = 0;
    downX = e.clientX;
    downY = e.clientY;
  });
  canvas.addEventListener('pointermove', (e) => {
    if (isDown) dragDist = Math.max(dragDist, Math.hypot(e.clientX - downX, e.clientY - downY));
    updatePointer(e);
  });
  canvas.addEventListener('pointerup', (e) => {
    if (dragDist < 5) handleClick(e);
    isDown = false;
  });
  canvas.addEventListener('pointerleave', () => {
    hideTooltip();
    treemap?.setHoveredSector(null);
    if (hovered) resetBuildingInteractionScale(hovered);
    hovered = null;
    canvas.style.cursor = 'grab';
    isDown = false;
  });

  document.getElementById('p-close')!.addEventListener('click', closePanel);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePanel();
  });

  panel.addEventListener('pointerdown', (e) => e.stopPropagation());
  panel.addEventListener('pointermove', (e) => e.stopPropagation());
  panel.addEventListener('wheel', (e) => e.stopPropagation(), { passive: false });

  function watchKey() {
    return 'polaris_watchlist';
  }
  function getWatchlist(): string[] {
    try {
      return JSON.parse(localStorage.getItem(watchKey()) || '[]') as string[];
    } catch {
      return [];
    }
  }
  function isWatched(t: string) {
    return getWatchlist().includes(t);
  }
  function toggleWatch(t: string) {
    const wl = getWatchlist();
    const i = wl.indexOf(t);
    if (i >= 0) wl.splice(i, 1);
    else wl.push(t);
    localStorage.setItem(watchKey(), JSON.stringify(wl));
  }

  pWatch.addEventListener('click', () => {
    if (!currentStock) return;
    toggleWatch(currentStock.t);
    const on = isWatched(currentStock.t);
    pWatch.classList.toggle('on', on);
    pWatch.textContent = on ? '★ Saved' : '☆ Save';
  });

  document.getElementById('resetCam')!.addEventListener('click', () => {
    treemap?.resetOrbitCamera();
  });

  const searchInput = document.getElementById('search') as HTMLInputElement;
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = searchInput.value.trim().toUpperCase();
      if (!q) return;
      const found = stocks.find((s) => s.t.toUpperCase() === q || s.n.toUpperCase().includes(q));
      if (found && treemap) {
        const mesh = treemap.meshByStock.get(found);
        openPanel(found, mesh ?? null);
        if (mesh) treemap.flyToStock(mesh);
      }
    }
  });

  const simBtn = document.getElementById('simBtn')!;
  simBtn.addEventListener('click', () => {
    simBtn.textContent = '갱신 중…';
    simBtn.setAttribute('disabled', 'true');
    refreshQuotes().finally(() => {
      simBtn.textContent = '새로고침';
      simBtn.removeAttribute('disabled');
      if (currentStock) {
        const sign = (currentStock.chg ?? 0) >= 0 ? '+' : '';
        pChg.textContent = `${sign}${(currentStock.chg ?? 0).toFixed(2)}%`;
        pChg.classList.remove('up', 'down');
        pChg.classList.add((currentStock.chg ?? 0) >= 0 ? 'up' : 'down');
        pPrice.textContent = fmtPrice(currentStock.price ?? 0, currentStock.m);
      }
    });
  });

  const legendList = document.getElementById('legend-list')!;
  for (const s of sectors) {
    const div = document.createElement('div');
    div.className = 'row';
    div.innerHTML = `<span class="swatch" style="background:${s.color}"></span><span class="legend-ko">${s.ko}</span>`;
    legendList.appendChild(div);
  }
  updateLegendAndHintForView();

  function formatSyncTime(iso: string) {
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
      ? '—'
      : d.toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
  }

  function refreshStatus(quotesAt?: string) {
    const up = stocks.filter((s) => !s.halted && (s.chg ?? 0) > 0).length;
    const dn = stocks.filter((s) => !s.halted && (s.chg ?? 0) < 0).length;
    const ht = stocks.filter((s) => s.halted).length;
    document.getElementById('s-stocks')!.textContent = String(stocks.length);
    const secCount = document.getElementById('s-sectors');
    if (secCount) secCount.textContent = String(treemap?.layoutSectorCount ?? sectors.length);
    document.getElementById('s-up')!.textContent = String(up);
    document.getElementById('s-down')!.textContent = String(dn);
    document.getElementById('s-halt')!.textContent = String(ht);
    document.getElementById('s-time')!.textContent = quotesAt ? formatSyncTime(quotesAt) : '갱신 중…';
    const srcEl = document.getElementById('s-source-line');
    if (srcEl) srcEl.textContent = dataSnapshotBaselineLabel(appDataSource);
  }
  refreshStatus();

  const refreshQuotes = initQuotesClient(stocks, (updatedAt) => {
    treemap?.updateAllVisuals();
    refreshStatus(updatedAt);
  });


  const homeHub = document.getElementById('home-hub')!;
  const positionView = document.getElementById('position-view')!;

  function showHome() {
    positionView.classList.remove('active');
    homeHub.classList.remove('hidden');
    resetVillageGuruQuote();
  }
  function hideHome() {
    homeHub.classList.add('hidden');
  }

  let enteringVillage = false;

  async function enterVillage() {
    if (enteringVillage) return;
    enteringVillage = true;
    const revisiting = !!treemap;
    showVillageLoading(
      revisiting ? 'Navigator 마을로 이동 중…' : '3D 마을 지도를 불러오는 중…',
      !revisiting,
    );
    await yieldToPaint();
    try {
      const t = await ensureTreemap((done, total, phase) => {
        updateVillageLoadingProgress(done, total, phase);
      });
      if (revisiting) {
        updateVillageLoadingProgress(1, 1, '마을로 이동 중…');
        await waitMs(280);
      }
      t.resize();
      await waitFrames(1);
      document.body.classList.add('village-active');
      await hideVillageLoading();
      const villageQuote = document.getElementById('village-guru-quote')!;
      const villageQuoteText = document.getElementById('village-quote-text')!;
      const villageQuoteAuthor = document.getElementById('village-quote-author')!;
      await runGuruQuoteOverlaySequence(villageQuote, villageQuoteText, villageQuoteAuthor);
      refreshStatus();
    } catch (err) {
      console.error('[enterVillage]', err);
      showVillageLoading('마을을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.', true);
      await waitMs(1600);
      throw err;
    } finally {
      if (document.getElementById('village-loading')?.hidden === false) {
        await hideVillageLoading();
      }
      enteringVillage = false;
    }
    hideHome();
    navViewToggle.classList.remove('hidden');
    setNavigatorView('overview');
    syncOverviewSectorToggleUi();
  }

  document.querySelectorAll<HTMLAnchorElement>('.nav-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const route = card.dataset.route;
      if (route === 'treemap') {
        void enterVillage().catch(() => {
          /* error surfaced in overlay; keep home visible */
        });
      } else if (route === 'guru') {
        hideHome();
        navViewToggle.classList.add('hidden');
        positionView.classList.add('active');
      }
    });
  });

  document.getElementById('position-back')!.addEventListener('click', showHome);

  document.getElementById('homeBtn')!.addEventListener('click', () => {
    showHome();
    navViewToggle.classList.add('hidden');
    setOverviewSectorOnly(false);
    setNavigatorView('overview');
    closePanel();
  });

  function tick() {
    treemap?.tick();
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  console.log('Polaris Navigator — ready');
}

main().catch((err) => {
  console.error(err);
  document.body.innerHTML = `<pre style="padding:24px;color:var(--accent-warn);background:var(--bg-base);height:100vh">${String(err)}</pre>`;
});
