import { CATEGORIES } from './catalog';
import { selectMetrics, groupByCategory } from './select';
import type { CategoryId, MetricDef } from './types';
import type { MarketCode, SectorDef, StockRow } from '../../types';

// Module-level state: 종목이 바뀌어도 유지
// TODO: 영속화가 필요하면 백엔드 엔드포인트로 분리 (이번 작업 범위 밖)
let _beginnerMode = true;
const _favIds = new Set<string>();

// ── 포맷 헬퍼 (StockRow 데이터 기반) ────────────────────────────────────────

function fmtPrice(p: number, m: MarketCode): string {
  if (m === 'KR') return `₩${Math.round(p).toLocaleString('ko-KR')}`;
  return `$${p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtMcap(cap: number): string {
  if (cap >= 1000) return `$${(cap / 1000).toFixed(2)}T`;
  return `$${cap.toFixed(1)}B`;
}

function fmtPct(n: number | null | undefined, digits = 1): string {
  return n == null ? '—' : `${n.toFixed(digits)}%`;
}

function fmtRatio(n: number | null | undefined, digits = 1): string {
  return n == null ? '—' : n.toFixed(digits);
}

function fmtGrowth(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
}

/** StockRow에서 metric ID에 해당하는 표시값 반환. yfinancePath는 문서용 참조. */
function resolveDisplay(id: string, st: StockRow, sec: SectorDef): string {
  switch (id) {
    case 'company.price':      return st.price != null ? fmtPrice(st.price, st.m) : '—';
    case 'company.change':     return st.chg   != null ? `${st.chg >= 0 ? '+' : ''}${st.chg.toFixed(2)}%` : '—';
    case 'company.mcap':       return fmtMcap(st.cap);
    case 'company.volume':     return st.vol   != null ? `${st.vol.toFixed(1)}M` : '—';
    case 'company.high52':     return st.week52High != null ? fmtPrice(st.week52High, st.m) : '—';
    case 'company.low52':      return st.week52Low  != null ? fmtPrice(st.week52Low,  st.m) : '—';
    case 'company.sector':     return sec.ko;
    case 'company.industry':   return '—';

    case 'price.per':          return fmtRatio(st.per);
    case 'price.forwardPer':   return '—';
    case 'price.pbr':          return fmtRatio(st.pbr, 2);
    case 'price.psr':          return fmtRatio(st.psr);
    case 'price.evEbitda':     return fmtRatio(st.evEbitda);
    case 'price.peg':          return fmtRatio(st.peg, 2);

    case 'strength.netMargin':   return fmtPct(st.netMargin);
    case 'strength.debtEquity':  return st.debtRatio != null ? `${st.debtRatio.toFixed(0)}%` : '—';
    case 'strength.opMargin':    return fmtPct(st.operatingMargin);
    case 'strength.roe':         return fmtPct(st.roe);
    case 'strength.roa':         return fmtPct(st.roa);
    case 'strength.currentRatio':return fmtRatio(st.currentRatio, 2);
    case 'strength.quickRatio':  return '—';
    case 'strength.revGrowth':   return fmtGrowth(st.revenueGrowth);
    case 'strength.earnGrowth':  return fmtGrowth(st.epsGrowth);

    case 'shareholder.divYield': return fmtPct(st.div, 2);
    case 'shareholder.payout':   return fmtPct(st.payoutRatio);
    case 'shareholder.divRate':  return '—';
    case 'shareholder.exDate':   return '—';

    default: return '—';
  }
}

/** 값의 색상 수식어 (등락률만 컬러 처리) */
function colorClass(id: string, st: StockRow): string {
  if (id !== 'company.change') return '';
  return (st.chg ?? 0) >= 0 ? 'fmp-up' : 'fmp-down';
}

// ── MetricsPanel 클래스 ──────────────────────────────────────────────────────

export class MetricsPanel {
  private container: HTMLElement;
  private st: StockRow | null = null;
  private sec: SectorDef | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  open(st: StockRow, sec: SectorDef): void {
    this.st = st;
    this.sec = sec;
    this._render();
  }

  close(): void {
    this.st = null;
    this.container.innerHTML = '';
  }

  private _render(): void {
    if (!this.st || !this.sec) return;

    const metrics = selectMetrics(_beginnerMode);
    const grouped = groupByCategory(metrics);

    this.container.innerHTML = this._buildHtml(grouped);
    this._bindEvents();
  }

  private _buildHtml(grouped: Record<CategoryId, MetricDef[]>): string {
    const categorySections = CATEGORIES.map((cat) => {
      const items = grouped[cat.id];
      if (!items?.length) return '';
      const rows = items.map((m) => this._rowHtml(m)).join('');
      return `
        <div class="fmp-category">
          <div class="fmp-cat-label">${cat.label}</div>
          <div class="fmp-rows">${rows}</div>
        </div>`;
    }).join('');

    return `
      <div class="fmp-header">
        <span class="fmp-header-title">재무 핵심 지표</span>
        <label class="fmp-toggle-label">
          <span class="fmp-toggle-text">초심자 모드</span>
          <span class="fmp-switch" role="switch" aria-checked="${_beginnerMode}">
            <input class="fmp-switch-input" type="checkbox" ${_beginnerMode ? 'checked' : ''}>
            <span class="fmp-switch-track">
              <span class="fmp-switch-thumb"></span>
            </span>
          </span>
        </label>
      </div>
      <div class="fmp-body">${categorySections}</div>`;
  }

  private _rowHtml(m: MetricDef): string {
    const value = resolveDisplay(m.id, this.st!, this.sec!);
    const color = colorClass(m.id, this.st!);
    const isFav = _favIds.has(m.id);
    return `
      <div class="fmp-row">
        <span class="fmp-row-label">${m.label}</span>
        <span class="fmp-row-val ${color}">${value}</span>
        <button class="fmp-fav-btn${isFav ? ' on' : ''}" data-fav="${m.id}" title="관심 지표 고정">
          ${isFav ? '★' : '☆'}
        </button>
      </div>`;
  }

  private _bindEvents(): void {
    const toggle = this.container.querySelector<HTMLInputElement>('.fmp-switch-input');
    toggle?.addEventListener('change', () => {
      _beginnerMode = toggle.checked;
      this._render();
    });

    this.container.querySelectorAll<HTMLButtonElement>('.fmp-fav-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.fav!;
        if (_favIds.has(id)) _favIds.delete(id);
        else _favIds.add(id);
        btn.classList.toggle('on');
        btn.textContent = _favIds.has(id) ? '★' : '☆';
      });
    });
  }
}
