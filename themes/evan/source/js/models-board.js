/* Interactive Models Leaderboard controller:
 * - 3 views: Leaderboard (Composite / 5 Domains / Single Benchmark), Pricing & Context, Value Frontier (Pareto SVG)
 * - 1-click ¥ RMB / $ USD currency toggle (persisted in localStorage)
 * - Filters: All / Open Weights / Closed API, Domestic (CN), Reasoning, Provider, Search
 * - Column sorting (asc/desc), collapsible Unranked table, clickable model detail links
 * - Bilingual EN/ZH sync via xdlkc:lang-change
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ModelsBoard = factory();
    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => root.ModelsBoard.initModelsBoard());
      } else {
        root.ModelsBoard.initModelsBoard();
      }
    }
  }
})(typeof self !== 'undefined' ? self : this, function () {
  const CURRENCY_STORAGE_KEY = 'xdlkc_models_currency';

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getLangMode(doc) {
    const mode = doc?.documentElement?.dataset?.langMode;
    return mode === 'zh' ? 'zh' : 'en';
  }

  function translate(key, mode, fallback) {
    if (typeof window !== 'undefined' && window.LangToggle && typeof window.LangToggle.t === 'function') {
      const translated = window.LangToggle.t(key, mode);
      if (translated && translated !== key) return translated;
    }
    return fallback;
  }

  function formatScore(val, unit) {
    if (val === undefined || val === null || !Number.isFinite(Number(val))) return '—';
    const num = Number(val);
    if (unit === 'Elo') return String(Math.round(num));
    const fixed = num.toFixed(1);
    return unit === '%' ? `${fixed}%` : `${fixed} ${unit}`.trim();
  }

  function formatPrice(usd, currency, rate) {
    if (usd === undefined || usd === null || !Number.isFinite(Number(usd))) return '—';
    const val = currency === 'usd' ? Number(usd) : Number(usd) * (Number(rate) || 7.25);
    const sym = currency === 'usd' ? '$' : '¥';
    if (val === 0) return `${sym}0.00`;
    if (val < 1) return `${sym}${val.toFixed(2)}`;
    if (val < 10) return `${sym}${val.toFixed(2)}`;
    return `${sym}${val.toFixed(1)}`;
  }

  function formatContext(ctx, mode) {
    if (!ctx || !Number.isFinite(Number(ctx))) return '—';
    const n = Number(ctx);
    if (mode === 'zh') {
      if (n >= 10000) return `${Math.round(n / 10000)}万`;
      return `${Math.round(n / 1000)}K`;
    }
    if (n >= 1000000) return `${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 2)}M`;
    return `${Math.round(n / 1000)}K`;
  }

  function computeBarPercent(score, bench) {
    if (!Number.isFinite(Number(score))) return 0;
    const s = Number(score);
    const max = Number(bench.maxScore) || 0;
    const min = Number(bench.minScore) || 0;
    if (bench.higherIsBetter !== false) {
      if (bench.unit === '%') return Math.max(0, Math.min(100, s));
      if (max <= 0) return 0;
      return Math.max(0, Math.min(100, (s / max) * 100));
    }
    if (s <= 0) return min <= 0 ? 100 : 0;
    if (min <= 0) return 0;
    return Math.max(0, Math.min(100, (min / s) * 100));
  }

  function filterRows(rows, state) {
    const query = String(state.search || '').trim().toLowerCase();
    return rows.filter((row) => {
      if (state.license === 'open' && !row.openWeights) return false;
      if (state.license === 'closed' && row.openWeights) return false;
      if (state.domesticOnly && !row.domestic) return false;
      if (state.reasoningOnly && !row.reasoning) return false;
      if (state.provider && state.provider !== 'all' && row.provider !== state.provider) return false;
      if (query) {
        const haystack = `${row.model || ''} ${row.provider || ''} ${row.notes || ''}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }

  function compareNullableNumber(aVal, bVal, dir, aModel, bModel) {
    const aNum = aVal === null || aVal === undefined ? NaN : Number(aVal);
    const bNum = bVal === null || bVal === undefined ? NaN : Number(bVal);
    const aMissing = !Number.isFinite(aNum);
    const bMissing = !Number.isFinite(bNum);
    if (aMissing && bMissing) return (aModel || '').localeCompare(bModel || '', 'en');
    if (aMissing) return 1;
    if (bMissing) return -1;
    const diff = aNum - bNum;
    return diff !== 0 ? diff * dir : (aModel || '').localeCompare(bModel || '', 'en');
  }

  function sortRows(rows, sortKey, sortDir, activeBench) {
    const dir = sortDir === 'asc' ? 1 : -1;
    return rows.slice().sort((a, b) => {
      if (sortKey === 'model') {
        return a.model.localeCompare(b.model, 'en') * dir;
      }
      if (sortKey === 'provider') {
        const cmp = (a.provider || '').localeCompare(b.provider || '', 'en');
        return cmp !== 0 ? cmp * dir : a.model.localeCompare(b.model, 'en');
      }
      if (sortKey === 'releaseDate') {
        const cmp = (a.releaseDate || '').localeCompare(b.releaseDate || '', 'en');
        return cmp !== 0 ? cmp * dir : a.model.localeCompare(b.model, 'en');
      }
      if (sortKey === 'coverage') {
        return compareNullableNumber(a.benchCount, b.benchCount, dir, a.model, b.model);
      }
      if (sortKey === 'contextLength') {
        return compareNullableNumber(a.contextLength, b.contextLength, dir, a.model, b.model);
      }
      if (sortKey === 'blendedUsd') {
        return compareNullableNumber(a.blendedUsd, b.blendedUsd, dir, a.model, b.model);
      }
      if (sortKey === 'cachePrice') {
        return compareNullableNumber(a.pricingUsd?.cacheRead, b.pricingUsd?.cacheRead, dir, a.model, b.model);
      }
      if (sortKey === 'inputPrice') {
        return compareNullableNumber(a.pricingUsd?.input, b.pricingUsd?.input, dir, a.model, b.model);
      }
      if (sortKey === 'outputPrice') {
        return compareNullableNumber(a.pricingUsd?.output, b.pricingUsd?.output, dir, a.model, b.model);
      }
      if (sortKey === 'avgNormalized' || sortKey === 'compositeScore') {
        const av = a.compositeScore !== undefined ? a.compositeScore : a.avgNormalized;
        const bv = b.compositeScore !== undefined ? b.compositeScore : b.avgNormalized;
        return compareNullableNumber(av, bv, dir, a.model, b.model);
      }
      if (sortKey.startsWith('domain:')) {
        const domId = sortKey.slice(7);
        return compareNullableNumber(a.domainScores?.[domId], b.domainScores?.[domId], dir, a.model, b.model);
      }
      if (sortKey === 'score') {
        return compareNullableNumber(a.score, b.score, dir, a.model, b.model);
      }
      if (sortKey.startsWith('bench:')) {
        const benchId = sortKey.slice(6);
        return compareNullableNumber(a.scores?.[benchId], b.scores?.[benchId], dir, a.model, b.model);
      }
      if (activeBench && activeBench.higherIsBetter === false) {
        return compareNullableNumber(a.score, b.score, dir, a.model, b.model);
      }
      return 0;
    });
  }

  function computeLocalPareto(rows) {
    const candidates = rows
      .filter((r) => r.blendedUsd !== null && r.blendedUsd > 0 && Number.isFinite(Number(r.compositeScore)))
      .slice()
      .sort((a, b) => (a.blendedUsd !== b.blendedUsd ? a.blendedUsd - b.blendedUsd : b.compositeScore - a.compositeScore));

    const frontier = [];
    let bestScore = -Infinity;
    for (const r of candidates) {
      if (r.compositeScore > bestScore + 0.05) {
        const prev = frontier.length ? frontier[frontier.length - 1] : null;
        frontier.push({
          ...r,
          priceRatio: prev ? Math.round((r.blendedUsd / prev.blendedUsd) * 10) / 10 : null,
          scoreGain: prev ? Math.round((r.compositeScore - prev.compositeScore) * 10) / 10 : null
        });
        bestScore = r.compositeScore;
      }
    }
    return { candidates, frontier };
  }

  function renderModelIdentityCell(row, mode, openLabel, domesticLabel) {
    const badge = row.providerBadge || { code: 'AI', color: '#64748b' };
    const href = row.slug ? `/models/${encodeURIComponent(row.slug)}/` : '#';
    const openBadge = row.openWeights
      ? (row.weightsUrl
        ? `<a class="models-badge is-open" href="${escapeHtml(row.weightsUrl)}" target="_blank" rel="noreferrer">${escapeHtml(openLabel)} ↗</a>`
        : `<span class="models-badge is-open">${escapeHtml(openLabel)}</span>`)
      : '';
    const domesticBadge = row.domestic
      ? `<span class="models-badge is-domestic">${escapeHtml(domesticLabel)}</span>`
      : '';

    return `<div class="models-model-cell">
      <div class="models-model-head">
        <span class="models-provider-badge" style="background:${escapeHtml(badge.color)}">${escapeHtml(badge.code)}</span>
        <div class="models-model-title-wrap">
          <a class="models-model-name" href="${href}">${escapeHtml(row.model)}</a>
          <div class="models-model-meta">
            <span class="models-provider-label">${escapeHtml(row.provider)}</span>
            ${openBadge}
            ${domesticBadge}
            ${row.notes ? `<span class="models-model-notes">${escapeHtml(row.notes)}</span>` : ''}
          </div>
        </div>
      </div>
    </div>`;
  }

  function initModelsBoard({ root = globalThis.document, data } = {}) {
    if (!root || !root.querySelector) return null;
    const board = root.querySelector('[data-models-board]');
    if (!board) return null;
    if (board.dataset && board.dataset.modelsBound === '1') return null;

    let payload = data;
    if (!payload) {
      const dataEl = root.getElementById ? root.getElementById('models-board-data') : root.querySelector('#models-board-data');
      if (!dataEl) return null;
      try {
        payload = JSON.parse(dataEl.textContent || '{}');
      } catch {
        return null;
      }
    }

    const benchmarks = Array.isArray(payload.benchmarks) ? payload.benchmarks : [];
    const domains = Array.isArray(payload.domains) ? payload.domains : [];
    const overview = Array.isArray(payload.overview) ? payload.overview : [];
    const ranked = Array.isArray(payload.ranked) && payload.ranked.length ? payload.ranked : overview;
    const unranked = Array.isArray(payload.unranked) ? payload.unranked : [];
    const usdToCny = Number(payload.usdToCny) || 7.25;
    if (!benchmarks.length) return null;

    if (board.dataset) board.dataset.modelsBound = '1';

    const benchById = new Map(benchmarks.map((b) => [b.id, b]));
    const domainById = new Map(domains.map((d) => [d.id, d]));

    const viewsContainer = board.querySelector('[data-models-views]');
    const currencyGroup = board.querySelector('[data-models-currency-group]');
    const tabsWrap = board.querySelector('[data-models-tabs-wrap]');
    const tabsContainer = board.querySelector('[data-models-tabs]');
    const benchPillsContainer = board.querySelector('[data-models-bench-pills]');
    const metaDescEl = board.querySelector('[data-models-meta-desc]');
    const metaBadgesEl = board.querySelector('[data-models-meta-badges]');
    const licenseBtns = Array.from(board.querySelectorAll('[data-models-license]'));
    const domesticBtn = board.querySelector('[data-models-domestic]');
    const reasoningBtn = board.querySelector('[data-models-reasoning]');
    const providerSelect = board.querySelector('[data-models-provider]');
    const searchInput = board.querySelector('[data-models-search]');
    const statusEl = board.querySelector('[data-models-status]');
    const tableSection = board.querySelector('[data-models-table-section]');
    const thead = board.querySelector('[data-models-thead]');
    const tbody = board.querySelector('[data-models-tbody]');
    const emptyEl = board.querySelector('[data-models-empty]');
    const resetBtn = board.querySelector('[data-models-reset]');
    const frontierSection = board.querySelector('[data-models-frontier-section]');
    const frontierChartEl = board.querySelector('[data-models-frontier-chart]');
    const frontierStepsEl = board.querySelector('[data-models-frontier-steps]');
    const frontierUnitEl = board.querySelector('[data-models-frontier-unit]');
    const unrankedWrap = board.querySelector('[data-models-unranked-wrap]');
    const unrankedTbody = board.querySelector('[data-models-unranked-tbody]');
    const unrankedCountEl = board.querySelector('[data-models-unranked-count]');
    const calibrationNoteEl = board.querySelector('[data-models-calibration-note]');

    let initialCurrency = 'cny';
    try {
      const saved = typeof localStorage !== 'undefined' && localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (saved === 'usd' || saved === 'cny') initialCurrency = saved;
    } catch {
      // ignore
    }

    const state = {
      viewMode: 'leaderboard', // 'leaderboard' | 'pricing' | 'frontier'
      activeTab: 'overview',   // 'overview' | 'domain:<id>' | '<benchId>'
      currency: initialCurrency,
      license: 'all',
      domesticOnly: false,
      reasoningOnly: false,
      provider: 'all',
      search: '',
      sortKey: 'compositeScore',
      sortDir: 'desc'
    };

    function getSortIndicator(key) {
      if (state.sortKey !== key) return '↕';
      return state.sortDir === 'asc' ? '↑' : '↓';
    }

    function getAriaSort(key) {
      if (state.sortKey !== key) return 'none';
      return state.sortDir === 'asc' ? 'ascending' : 'descending';
    }

    function thSort(colClass, key, label) {
      const isSorted = state.sortKey === key;
      return `<th scope="col" class="${colClass}" aria-sort="${getAriaSort(key)}">
        <button type="button" class="models-sort-btn${isSorted ? ' is-sorted' : ''}" data-sort-key="${escapeHtml(key)}">
          <span>${escapeHtml(label)}</span>
          <span class="sort-icon" aria-hidden="true">${getSortIndicator(key)}</span>
        </button>
      </th>`;
    }

    function syncDomainTabLabels() {
      const mode = getLangMode(root);
      if (!tabsContainer) return;
      tabsContainer.querySelectorAll('[data-domain-label]').forEach((el) => {
        const id = el.getAttribute('data-domain-label');
        const dom = domainById.get(id);
        if (!dom) return;
        el.textContent = mode === 'zh' ? dom.labelZh : dom.labelEn;
      });
    }

    function renderMeta() {
      const mode = getLangMode(root);
      syncDomainTabLabels();
      if (!metaDescEl || !metaBadgesEl) return;

      const updatedLabel = translate('models.meta.updated', mode, 'Updated');
      const unitLabel = state.currency === 'usd'
        ? '$ / 1M Tokens'
        : (mode === 'zh' ? '¥ / 百万 Token' : '¥ / 1M Tokens');

      if (state.viewMode === 'pricing') {
        metaDescEl.textContent = translate(
          'models.pricing.desc',
          mode,
          'API pricing & context window comparison. 7:2:1 blended cost reflects typical agent workloads (70% cached input, 20% uncached input, 10% output).'
        );
        const badges = [`<span class="models-meta-badge">${escapeHtml(unitLabel)}</span>`];
        if (payload.priceSourceUrl) {
          badges.push(`<a class="models-meta-badge" href="${escapeHtml(payload.priceSourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(payload.priceSource || 'OpenRouter')} ↗</a>`);
        }
        if (payload.latestUpdatedAt) {
          badges.push(`<span class="models-meta-badge">${escapeHtml(updatedLabel)}: ${escapeHtml(payload.latestUpdatedAt)}</span>`);
        }
        metaBadgesEl.innerHTML = badges.join('');
        return;
      }

      if (state.viewMode === 'frontier') {
        metaDescEl.textContent = translate(
          'models.frontier.metaDesc',
          mode,
          'Pareto value frontier plotting log-scale 7:2:1 blended cost against calibrated composite score.'
        );
        metaBadgesEl.innerHTML = `<span class="models-meta-badge">${escapeHtml(unitLabel)}</span>`;
        return;
      }

      if (state.activeTab === 'overview') {
        metaDescEl.textContent = translate(
          'models.overview.desc',
          mode,
          'Difficulty-calibrated composite index (mean 50, SD 15) weighted across Coding (38%), Reasoning (19%), Professional (19%), Knowledge (14%), and Arena (10%).'
        );
        const badges = [`<span class="models-meta-badge">${escapeHtml(unitLabel)}</span>`];
        if (payload.latestUpdatedAt) {
          badges.push(`<span class="models-meta-badge">${escapeHtml(updatedLabel)}: ${escapeHtml(payload.latestUpdatedAt)}</span>`);
        }
        metaBadgesEl.innerHTML = badges.join('');
        return;
      }

      if (state.activeTab.startsWith('domain:')) {
        const domId = state.activeTab.slice(7);
        const dom = domainById.get(domId);
        if (!dom) return;
        const domLabel = mode === 'zh' ? dom.labelZh : dom.labelEn;
        metaDescEl.textContent = mode === 'zh'
          ? `${domLabel}领域子榜（占综合权重 ${dom.weightPct}%），聚合 ${dom.benchmarkCount} 项评测的难度校准得分。`
          : `${domLabel} domain sub-leaderboard (${dom.weightPct}% of composite weight), aggregating ${dom.benchmarkCount} calibrated benchmarks.`;
        metaBadgesEl.innerHTML = [
          `<span class="models-meta-badge">${escapeHtml(domLabel)} · ${dom.weightPct}%</span>`,
          `<span class="models-meta-badge">${dom.benchmarkCount} ${mode === 'zh' ? '项评测' : 'benchmarks'}</span>`
        ].join('');
        return;
      }

      const bench = benchById.get(state.activeTab);
      if (!bench) return;
      metaDescEl.textContent = bench.description || bench.name;
      const badges = [];
      if (bench.category) badges.push(`<span class="models-meta-badge">${escapeHtml(bench.category)}</span>`);
      if (bench.unit) {
        const dirText = bench.higherIsBetter !== false
          ? translate('models.meta.higherBetter', mode, 'Higher is better')
          : translate('models.meta.lowerBetter', mode, 'Lower is better');
        badges.push(`<span class="models-meta-badge">${escapeHtml(bench.unit)} · ${escapeHtml(dirText)}</span>`);
      }
      if (bench.sourceName) {
        const sourceLabel = translate('models.meta.source', mode, 'Source');
        badges.push(
          bench.sourceUrl
            ? `<a class="models-meta-badge" href="${escapeHtml(bench.sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(sourceLabel)}: ${escapeHtml(bench.sourceName)} ↗</a>`
            : `<span class="models-meta-badge">${escapeHtml(sourceLabel)}: ${escapeHtml(bench.sourceName)}</span>`
        );
      }
      if (bench.updatedAt) {
        badges.push(`<span class="models-meta-badge">${escapeHtml(updatedLabel)}: ${escapeHtml(bench.updatedAt)}</span>`);
      }
      metaBadgesEl.innerHTML = badges.join('');
    }

    function renderFrontierView() {
      const mode = getLangMode(root);
      const filtered = filterRows(ranked, state);
      const { candidates, frontier } = computeLocalPareto(filtered);
      const unitLabel = state.currency === 'usd'
        ? '$ / 1M Tokens'
        : (mode === 'zh' ? '¥ / 百万 Token' : '¥ / 1M Tokens');

      if (frontierUnitEl) frontierUnitEl.textContent = unitLabel;
      if (statusEl) statusEl.textContent = `${candidates.length} / ${ranked.length}`;

      if (!frontierChartEl || !frontierStepsEl) return;

      if (!candidates.length) {
        frontierChartEl.innerHTML = `<div class="models-empty-state"><p>${escapeHtml(translate('models.empty', mode, 'No models match the current filters.'))}</p></div>`;
        frontierStepsEl.innerHTML = '';
        return;
      }

      const width = 920;
      const height = 400;
      const pad = { top: 28, right: 44, bottom: 52, left: 58 };
      const plotW = width - pad.left - pad.right;
      const plotH = height - pad.top - pad.bottom;

      const mult = state.currency === 'usd' ? 1 : usdToCny;
      const prices = candidates.map((c) => c.blendedUsd * mult);
      const scores = candidates.map((c) => c.compositeScore);
      const minLogX = Math.log10(Math.max(0.01, Math.min(...prices) * 0.72));
      const maxLogX = Math.log10(Math.max(...prices) * 1.45);
      const minY = Math.max(0, Math.floor((Math.min(...scores) - 6) / 5) * 5);
      const maxY = Math.min(100, Math.ceil((Math.max(...scores) + 6) / 5) * 5);

      const xPos = (p) => {
        const lx = Math.log10(Math.max(0.01, p));
        return pad.left + ((lx - minLogX) / Math.max(0.1, maxLogX - minLogX)) * plotW;
      };
      const yPos = (s) => pad.top + plotH - ((s - minY) / Math.max(1, maxY - minY)) * plotH;

      // Grid lines
      const yTicks = [];
      for (let y = minY; y <= maxY; y += 10) yTicks.push(y);
      const xTickCandidates = state.currency === 'usd'
        ? [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10]
        : [0.3, 0.5, 1, 2, 5, 10, 20, 50];
      const xTicks = xTickCandidates.filter((v) => Math.log10(v) >= minLogX && Math.log10(v) <= maxLogX);
      const sym = state.currency === 'usd' ? '$' : '¥';

      const gridSvg = [
        ...yTicks.map((y) => {
          const py = yPos(y).toFixed(1);
          return `<line x1="${pad.left}" y1="${py}" x2="${width - pad.right}" y2="${py}" class="frontier-grid-line" />
            <text x="${pad.left - 10}" y="${py}" text-anchor="end" dominant-baseline="middle" class="frontier-axis-tick">${y}</text>`;
        }),
        ...xTicks.map((x) => {
          const px = xPos(x).toFixed(1);
          return `<line x1="${px}" y1="${pad.top}" x2="${px}" y2="${height - pad.bottom}" class="frontier-grid-line" />
            <text x="${px}" y="${height - pad.bottom + 18}" text-anchor="middle" class="frontier-axis-tick">${sym}${x}</text>`;
        })
      ].join('');

      // Frontier polyline + step path
      const frontierSlugs = new Set(frontier.map((f) => f.slug));
      let stepPath = '';
      if (frontier.length >= 2) {
        const parts = frontier.map((f, idx) => {
          const px = xPos(f.blendedUsd * mult).toFixed(1);
          const py = yPos(f.compositeScore).toFixed(1);
          if (idx === 0) return `M ${px} ${py}`;
          const prevY = yPos(frontier[idx - 1].compositeScore).toFixed(1);
          return `L ${px} ${prevY} L ${px} ${py}`;
        });
        stepPath = `<path d="${parts.join(' ')}" class="frontier-step-path" />`;
      }

      const linePath = frontier.length >= 2
        ? `<polyline points="${frontier.map((f) => `${xPos(f.blendedUsd * mult).toFixed(1)},${yPos(f.compositeScore).toFixed(1)}`).join(' ')}" class="frontier-line" />`
        : '';

      const nonFrontierDots = candidates
        .filter((c) => !frontierSlugs.has(c.slug))
        .map((c) => {
          const cx = xPos(c.blendedUsd * mult).toFixed(1);
          const cy = yPos(c.compositeScore).toFixed(1);
          const tip = `${c.model} · ${formatPrice(c.blendedUsd, state.currency, usdToCny)} · ${c.compositeScore.toFixed(1)}`;
          return `<a href="/models/${encodeURIComponent(c.slug)}/" class="frontier-point-link">
            <circle cx="${cx}" cy="${cy}" r="5" class="frontier-dot-muted"><title>${escapeHtml(tip)}</title></circle>
          </a>`;
        })
        .join('');

      const placedLabels = [];
      const frontierDots = frontier
        .map((f, idx) => {
          const cx = xPos(f.blendedUsd * mult);
          const cy = yPos(f.compositeScore);
          const nearRight = cx > width - 175;
          let labelAnchor = nearRight ? 'end' : 'start';
          let labelDx = nearRight ? -10 : 10;
          let labelDy = idx % 2 === 0 ? -11 : 17;

          // Avoid label overlap with previously placed frontier labels
          for (const prev of placedLabels) {
            const curX = cx + labelDx;
            const curY = cy + labelDy;
            if (Math.abs(curY - prev.y) < 18 && Math.abs(curX - prev.x) < 130) {
              if (labelDy < 0) {
                labelDy = 18;
              } else {
                labelAnchor = 'end';
                labelDx = -10;
                labelDy = -12;
              }
            }
          }
          placedLabels.push({ x: cx + labelDx, y: cy + labelDy });

          const tip = `${f.model} · ${formatPrice(f.blendedUsd, state.currency, usdToCny)} · ${f.compositeScore.toFixed(1)}`;
          return `<a href="/models/${encodeURIComponent(f.slug)}/" class="frontier-point-link">
            <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="7" class="frontier-dot-active"><title>${escapeHtml(tip)}</title></circle>
            <text x="${(cx + labelDx).toFixed(1)}" y="${(cy + labelDy).toFixed(1)}" text-anchor="${labelAnchor}" class="frontier-point-label">${escapeHtml(f.model)}</text>
          </a>`;
        })
        .join('');

      const xAxisTitle = mode === 'zh'
        ? `7:2:1 综合用量价格（对数坐标，${unitLabel}）`
        : `7:2:1 Blended Price (Log Scale, ${unitLabel})`;
      const yAxisTitle = mode === 'zh' ? '综合评分' : 'Composite Score';

      frontierChartEl.innerHTML = `<svg viewBox="0 0 ${width} ${height}" class="frontier-svg" role="img" aria-label="${escapeHtml(xAxisTitle)}">
        ${gridSvg}
        ${stepPath}
        ${linePath}
        ${nonFrontierDots}
        ${frontierDots}
        <text x="${pad.left + plotW / 2}" y="${height - 10}" text-anchor="middle" class="frontier-axis-title">${escapeHtml(xAxisTitle)}</text>
        <text x="18" y="${pad.top + plotH / 2}" text-anchor="middle" transform="rotate(-90 18 ${pad.top + plotH / 2})" class="frontier-axis-title">${escapeHtml(yAxisTitle)}</text>
      </svg>`;

      frontierStepsEl.innerHTML = frontier
        .map((f, idx) => {
          const deltaText = idx === 0
            ? (mode === 'zh' ? '性价比起点' : 'Entry Frontier')
            : (mode === 'zh' ? `价格 ×${f.priceRatio}，+${f.scoreGain.toFixed(1)} 分` : `Price ×${f.priceRatio}, +${f.scoreGain.toFixed(1)} pts`);
          return `<a class="frontier-step-card" href="/models/${encodeURIComponent(f.slug)}/">
            <div class="frontier-step-head">
              <span class="models-provider-badge" style="background:${escapeHtml(f.providerBadge?.color || '#64748b')}">${escapeHtml(f.providerBadge?.code || 'AI')}</span>
              <span class="frontier-step-name">${escapeHtml(f.model)}</span>
            </div>
            <div class="frontier-step-metrics">
              <span class="frontier-step-price">${escapeHtml(formatPrice(f.blendedUsd, state.currency, usdToCny))}</span>
              <span class="frontier-step-score">${f.compositeScore.toFixed(1)}</span>
            </div>
            <span class="frontier-step-delta">${escapeHtml(deltaText)}</span>
          </a>`;
        })
        .join('');
    }

    function renderUnrankedTable() {
      if (!unrankedWrap || !unrankedTbody) return;
      const showUnranked = state.viewMode === 'leaderboard' && state.activeTab === 'overview' && unranked.length > 0;
      unrankedWrap.hidden = !showUnranked;
      if (calibrationNoteEl) {
        calibrationNoteEl.hidden = state.viewMode !== 'leaderboard';
      }
      if (!showUnranked) return;

      const mode = getLangMode(root);
      const openLabel = translate('models.badge.open', mode, 'Open');
      const domesticLabel = translate('models.badge.domestic', mode, 'CN');
      const filteredUnranked = filterRows(unranked, state);
      if (unrankedCountEl) unrankedCountEl.textContent = String(filteredUnranked.length);

      unrankedTbody.innerHTML = filteredUnranked
        .map((row) => `<tr>
          <td class="col-model">${renderModelIdentityCell(row, mode, openLabel, domesticLabel)}</td>
          <td class="col-coverage">
            <div class="models-coverage-cell">
              <span class="models-coverage-count">${row.benchCount} / ${payload.totalBenchmarks}</span>
              <span class="models-coverage-pct">${row.coveragePct}%</span>
            </div>
          </td>
          <td class="col-composite"><span class="models-bench-val">${row.compositeScore.toFixed(1)}</span></td>
          <td><span class="models-model-notes">${escapeHtml(row.unrankedReason || '')}</span></td>
        </tr>`)
        .join('');
    }

    function renderTable() {
      const mode = getLangMode(root);
      const isPricing = state.viewMode === 'pricing';
      const isFrontier = state.viewMode === 'frontier';

      if (tabsWrap) tabsWrap.hidden = isPricing || isFrontier;
      if (tableSection) tableSection.hidden = isFrontier;
      if (frontierSection) frontierSection.hidden = !isFrontier;

      if (isFrontier) {
        renderFrontierView();
        renderUnrankedTable();
        return;
      }

      const openLabel = translate('models.badge.open', mode, 'Open');
      const domesticLabel = translate('models.badge.domestic', mode, 'CN');
      const rankCol = translate('models.col.rank', mode, '#');
      const modelCol = translate('models.col.model', mode, 'Model');
      const releaseCol = translate('models.col.release', mode, 'Release');
      const coverageCol = translate('models.col.coverage', mode, 'Coverage');
      const cacheCol = translate('models.col.cachePrice', mode, 'Cache');
      const inputCol = translate('models.col.inputPrice', mode, 'Input');
      const outputCol = translate('models.col.outputPrice', mode, 'Output');
      const blendedCol = translate('models.col.blended', mode, '7:2:1 Blended');
      const contextCol = translate('models.col.context', mode, 'Context');
      const scoreCol = translate('models.col.composite', mode, 'Score');
      const providerCol = translate('models.col.provider', mode, 'Provider');

      if (isPricing) {
        const pricedBase = overview.filter((r) => r.pricingUsd || r.contextLength);
        const filtered = filterRows(pricedBase, state);
        const sorted = sortRows(filtered, state.sortKey, state.sortDir, null);

        if (thead) {
          thead.innerHTML = `<tr>
            <th scope="col" class="col-rank">${escapeHtml(rankCol)}</th>
            ${thSort('col-model', 'model', modelCol)}
            ${thSort('col-context', 'contextLength', contextCol)}
            ${thSort('col-price', 'blendedUsd', blendedCol)}
            ${thSort('col-price', 'cachePrice', cacheCol)}
            ${thSort('col-price', 'inputPrice', inputCol)}
            ${thSort('col-price', 'outputPrice', outputCol)}
            ${thSort('col-composite', 'compositeScore', scoreCol)}
          </tr>`;
        }

        if (tbody) {
          tbody.innerHTML = sorted
            .map((row, idx) => `<tr data-model-row="${escapeHtml(row.model)}">
              <td class="col-rank"><span class="models-rank${idx < 3 ? ` is-top-${idx + 1}` : ''}">${String(idx + 1).padStart(2, '0')}</span></td>
              <td class="col-model">${renderModelIdentityCell(row, mode, openLabel, domesticLabel)}</td>
              <td class="col-context"><span class="models-bench-val">${escapeHtml(formatContext(row.contextLength, mode))}</span></td>
              <td class="col-price"><span class="models-price-val is-blended">${escapeHtml(formatPrice(row.blendedUsd, state.currency, usdToCny))}</span></td>
              <td class="col-price"><span class="models-price-val">${escapeHtml(formatPrice(row.pricingUsd?.cacheRead, state.currency, usdToCny))}</span></td>
              <td class="col-price"><span class="models-price-val">${escapeHtml(formatPrice(row.pricingUsd?.input, state.currency, usdToCny))}</span></td>
              <td class="col-price"><span class="models-price-val">${escapeHtml(formatPrice(row.pricingUsd?.output, state.currency, usdToCny))}</span></td>
              <td class="col-composite"><span class="models-score-val is-primary">${row.compositeScore.toFixed(1)}</span></td>
            </tr>`)
            .join('');
        }

        if (statusEl) statusEl.textContent = `${sorted.length} / ${pricedBase.length}`;
        if (emptyEl) emptyEl.hidden = sorted.length > 0;
        renderUnrankedTable();
        return;
      }

      // Leaderboard view: Overview | Domain | Single Benchmark
      const isOverview = state.activeTab === 'overview';
      const isDomain = state.activeTab.startsWith('domain:');
      const activeDomainId = isDomain ? state.activeTab.slice(7) : null;
      const activeBench = !isOverview && !isDomain ? benchById.get(state.activeTab) : null;

      let baseRows = [];
      if (isOverview) {
        baseRows = ranked;
      } else if (isDomain) {
        baseRows = overview.filter((r) => r.domainScores && r.domainScores[activeDomainId] !== undefined);
      } else if (activeBench) {
        baseRows = activeBench.entries;
      }

      const filtered = filterRows(baseRows, state);
      const sorted = sortRows(filtered, state.sortKey, state.sortDir, activeBench);

      if (thead) {
        if (isOverview) {
          thead.innerHTML = `<tr>
            <th scope="col" class="col-rank">${escapeHtml(rankCol)}</th>
            ${thSort('col-model', 'model', modelCol)}
            ${thSort('col-release', 'releaseDate', releaseCol)}
            ${thSort('col-coverage', 'coverage', coverageCol)}
            ${thSort('col-price', 'cachePrice', cacheCol)}
            ${thSort('col-price', 'inputPrice', inputCol)}
            ${thSort('col-price', 'outputPrice', outputCol)}
            ${thSort('col-composite', 'compositeScore', scoreCol)}
          </tr>`;
        } else if (isDomain) {
          const domBenches = benchmarks.filter((b) => b.domain === activeDomainId);
          const benchHeaders = domBenches.map((b) => thSort('col-bench', `bench:${b.id}`, b.name)).join('');
          thead.innerHTML = `<tr>
            <th scope="col" class="col-rank">${escapeHtml(rankCol)}</th>
            ${thSort('col-model', 'model', modelCol)}
            ${thSort('col-composite', `domain:${activeDomainId}`, scoreCol)}
            ${thSort('col-price', 'blendedUsd', blendedCol)}
            ${benchHeaders}
          </tr>`;
        } else {
          const unitSuffix = activeBench && activeBench.unit ? ` (${activeBench.unit})` : '';
          thead.innerHTML = `<tr>
            <th scope="col" class="col-rank">${escapeHtml(rankCol)}</th>
            ${thSort('col-model', 'model', modelCol)}
            ${thSort('col-provider', 'provider', providerCol)}
            ${thSort('col-score', 'score', `${translate('models.col.score', mode, 'Score')}${unitSuffix}`)}
            ${thSort('col-release', 'releaseDate', releaseCol)}
          </tr>`;
        }
      }

      if (tbody) {
        if (isOverview) {
          tbody.innerHTML = sorted
            .map((row, idx) => {
              const rankClass = idx < 3 ? ` is-top-${idx + 1}` : '';
              const pct = Math.max(0, Math.min(100, Number(row.compositeScore) || 0));
              return `<tr data-model-row="${escapeHtml(row.model)}">
                <td class="col-rank"><span class="models-rank${rankClass}">${String(idx + 1).padStart(2, '0')}</span></td>
                <td class="col-model">${renderModelIdentityCell(row, mode, openLabel, domesticLabel)}</td>
                <td class="col-release"><span class="models-release-val">${escapeHtml(row.releaseDate || '—')}</span></td>
                <td class="col-coverage">
                  <div class="models-coverage-cell">
                    <span class="models-coverage-count">${row.benchCount} / ${payload.totalBenchmarks}</span>
                    <span class="models-coverage-pct">${row.coveragePct}%</span>
                  </div>
                </td>
                <td class="col-price"><span class="models-price-val">${escapeHtml(formatPrice(row.pricingUsd?.cacheRead, state.currency, usdToCny))}</span></td>
                <td class="col-price"><span class="models-price-val">${escapeHtml(formatPrice(row.pricingUsd?.input, state.currency, usdToCny))}</span></td>
                <td class="col-price"><span class="models-price-val">${escapeHtml(formatPrice(row.pricingUsd?.output, state.currency, usdToCny))}</span></td>
                <td class="col-composite">
                  <div class="models-bar-cell">
                    <span class="models-score-val is-primary">${row.compositeScore.toFixed(1)}</span>
                    <div class="models-bar-track" aria-hidden="true"><div class="models-bar-fill" style="width:${pct}%"></div></div>
                  </div>
                </td>
              </tr>`;
            })
            .join('');
        } else if (isDomain) {
          const domBenches = benchmarks.filter((b) => b.domain === activeDomainId);
          tbody.innerHTML = sorted
            .map((row, idx) => {
              const rankClass = idx < 3 ? ` is-top-${idx + 1}` : '';
              const dScore = Number(row.domainScores?.[activeDomainId] || 0);
              const benchCells = domBenches
                .map((b) => {
                  const val = row.scores ? row.scores[b.id] : undefined;
                  const missing = val === undefined || val === null || !Number.isFinite(Number(val));
                  return `<td class="col-bench"><span class="models-bench-val${missing ? ' is-missing' : ''}">${escapeHtml(formatScore(val, b.unit))}</span></td>`;
                })
                .join('');
              return `<tr data-model-row="${escapeHtml(row.model)}">
                <td class="col-rank"><span class="models-rank${rankClass}">${String(idx + 1).padStart(2, '0')}</span></td>
                <td class="col-model">${renderModelIdentityCell(row, mode, openLabel, domesticLabel)}</td>
                <td class="col-composite">
                  <div class="models-bar-cell">
                    <span class="models-score-val is-primary">${dScore.toFixed(1)}</span>
                    <div class="models-bar-track" aria-hidden="true"><div class="models-bar-fill" style="width:${Math.min(100, Math.max(0, dScore))}%"></div></div>
                  </div>
                </td>
                <td class="col-price"><span class="models-price-val is-blended">${escapeHtml(formatPrice(row.blendedUsd, state.currency, usdToCny))}</span></td>
                ${benchCells}
              </tr>`;
            })
            .join('');
        } else if (activeBench) {
          tbody.innerHTML = sorted
            .map((row, idx) => {
              const rankClass = idx < 3 ? ` is-top-${idx + 1}` : '';
              const pct = computeBarPercent(row.score, activeBench);
              const catalogRow = overview.find((o) => o.slug === row.slug);
              const mergedRow = catalogRow ? { ...catalogRow, notes: row.notes } : row;
              return `<tr data-model-row="${escapeHtml(row.model)}">
                <td class="col-rank"><span class="models-rank${rankClass}">${String(idx + 1).padStart(2, '0')}</span></td>
                <td class="col-model">${renderModelIdentityCell(mergedRow, mode, openLabel, domesticLabel)}</td>
                <td class="col-provider">${escapeHtml(row.provider)}</td>
                <td class="col-score">
                  <div class="models-bar-cell">
                    <span class="models-score-val is-primary">${escapeHtml(formatScore(row.score, activeBench.unit))}</span>
                    <div class="models-bar-track" aria-hidden="true"><div class="models-bar-fill" style="width:${pct.toFixed(1)}%"></div></div>
                  </div>
                </td>
                <td class="col-release"><span class="models-release-val">${escapeHtml(row.releaseDate || '—')}</span></td>
              </tr>`;
            })
            .join('');
        }
      }

      if (statusEl) statusEl.textContent = `${sorted.length} / ${baseRows.length}`;
      if (emptyEl) emptyEl.hidden = sorted.length > 0;
      renderUnrankedTable();
    }

    function setCurrency(cur) {
      const mode = cur === 'usd' ? 'usd' : 'cny';
      state.currency = mode;
      try {
        if (typeof localStorage !== 'undefined') localStorage.setItem(CURRENCY_STORAGE_KEY, mode);
      } catch {
        // ignore
      }
      if (currencyGroup) {
        currencyGroup.querySelectorAll('[data-models-currency]').forEach((btn) => {
          const active = btn.getAttribute('data-models-currency') === mode;
          btn.classList.toggle('is-active', active);
          btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
      }
      renderMeta();
      renderTable();
    }

    function selectView(viewId) {
      const valid = viewId === 'pricing' || viewId === 'frontier' ? viewId : 'leaderboard';
      state.viewMode = valid;

      if (valid === 'pricing') {
        state.sortKey = 'blendedUsd';
        state.sortDir = 'asc';
      } else if (valid === 'leaderboard') {
        if (state.activeTab === 'overview') {
          state.sortKey = 'compositeScore';
          state.sortDir = 'desc';
        } else if (state.activeTab.startsWith('domain:')) {
          state.sortKey = state.activeTab;
          state.sortDir = 'desc';
        } else {
          const b = benchById.get(state.activeTab);
          state.sortKey = 'score';
          state.sortDir = b && b.higherIsBetter === false ? 'asc' : 'desc';
        }
      }

      if (viewsContainer) {
        viewsContainer.querySelectorAll('[data-models-view]').forEach((btn) => {
          const active = btn.getAttribute('data-models-view') === valid;
          btn.classList.toggle('is-active', active);
          btn.setAttribute('aria-selected', active ? 'true' : 'false');
        });
      }

      renderMeta();
      renderTable();
    }

    function selectTab(tabId) {
      let targetId = 'overview';
      if (tabId === 'overview') {
        targetId = 'overview';
      } else if (tabId && tabId.startsWith('domain:') && domainById.has(tabId.slice(7))) {
        targetId = tabId;
      } else if (benchById.has(tabId)) {
        targetId = tabId;
      }

      state.activeTab = targetId;
      state.viewMode = 'leaderboard';

      if (targetId === 'overview') {
        state.sortKey = 'compositeScore';
        state.sortDir = 'desc';
      } else if (targetId.startsWith('domain:')) {
        state.sortKey = targetId;
        state.sortDir = 'desc';
      } else {
        const bench = benchById.get(targetId);
        state.sortKey = 'score';
        state.sortDir = bench && bench.higherIsBetter === false ? 'asc' : 'desc';
      }

      if (viewsContainer) {
        viewsContainer.querySelectorAll('[data-models-view]').forEach((btn) => {
          const active = btn.getAttribute('data-models-view') === 'leaderboard';
          btn.classList.toggle('is-active', active);
          btn.setAttribute('aria-selected', active ? 'true' : 'false');
        });
      }

      [tabsContainer, benchPillsContainer].forEach((container) => {
        if (!container) return;
        container.querySelectorAll('[data-models-tab]').forEach((btn) => {
          const isActive = btn.getAttribute('data-models-tab') === targetId;
          btn.classList.toggle('is-active', isActive);
          btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
      });

      renderMeta();
      renderTable();
    }

    function toggleSort(key) {
      if (state.sortKey === key) {
        state.sortDir = state.sortDir === 'desc' ? 'asc' : 'desc';
      } else {
        state.sortKey = key;
        if (key === 'model' || key === 'provider' || key === 'blendedUsd' || key === 'cachePrice' || key === 'inputPrice' || key === 'outputPrice') {
          state.sortDir = 'asc';
        } else if (key === 'score') {
          const bench = benchById.get(state.activeTab);
          state.sortDir = bench && bench.higherIsBetter === false ? 'asc' : 'desc';
        } else if (key.startsWith('bench:')) {
          const bench = benchById.get(key.slice(6));
          state.sortDir = bench && bench.higherIsBetter === false ? 'asc' : 'desc';
        } else {
          state.sortDir = 'desc';
        }
      }
      renderTable();
    }

    function resetFilters() {
      state.license = 'all';
      state.domesticOnly = false;
      state.reasoningOnly = false;
      state.provider = 'all';
      state.search = '';

      licenseBtns.forEach((btn) => {
        const active = btn.getAttribute('data-models-license') === 'all';
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      if (domesticBtn) {
        domesticBtn.classList.remove('is-active');
        domesticBtn.setAttribute('aria-pressed', 'false');
      }
      if (reasoningBtn) {
        reasoningBtn.classList.remove('is-active');
        reasoningBtn.setAttribute('aria-pressed', 'false');
      }
      if (providerSelect) providerSelect.value = 'all';
      if (searchInput) searchInput.value = '';
      renderTable();
    }

    // Event bindings
    if (viewsContainer) {
      viewsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest ? e.target.closest('[data-models-view]') : null;
        if (!btn) return;
        selectView(btn.getAttribute('data-models-view'));
      });
    }

    if (currencyGroup) {
      currencyGroup.addEventListener('click', (e) => {
        const btn = e.target.closest ? e.target.closest('[data-models-currency]') : null;
        if (!btn) return;
        setCurrency(btn.getAttribute('data-models-currency'));
      });
    }

    [tabsContainer, benchPillsContainer].forEach((container) => {
      if (!container) return;
      container.addEventListener('click', (e) => {
        const btn = e.target.closest ? e.target.closest('[data-models-tab]') : null;
        if (!btn) return;
        selectTab(btn.getAttribute('data-models-tab'));
      });
    });

    licenseBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        state.license = btn.getAttribute('data-models-license') || 'all';
        licenseBtns.forEach((b) => {
          const active = b === btn;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        renderTable();
      });
    });

    if (domesticBtn) {
      domesticBtn.addEventListener('click', () => {
        state.domesticOnly = !state.domesticOnly;
        domesticBtn.classList.toggle('is-active', state.domesticOnly);
        domesticBtn.setAttribute('aria-pressed', state.domesticOnly ? 'true' : 'false');
        renderTable();
      });
    }

    if (reasoningBtn) {
      reasoningBtn.addEventListener('click', () => {
        state.reasoningOnly = !state.reasoningOnly;
        reasoningBtn.classList.toggle('is-active', state.reasoningOnly);
        reasoningBtn.setAttribute('aria-pressed', state.reasoningOnly ? 'true' : 'false');
        renderTable();
      });
    }

    if (providerSelect) {
      providerSelect.addEventListener('change', () => {
        state.provider = providerSelect.value || 'all';
        renderTable();
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        state.search = searchInput.value || '';
        renderTable();
      });
    }

    if (thead) {
      thead.addEventListener('click', (e) => {
        const btn = e.target.closest ? e.target.closest('[data-sort-key]') : null;
        if (!btn) return;
        toggleSort(btn.getAttribute('data-sort-key'));
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', resetFilters);
    }

    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('xdlkc:lang-change', () => {
        renderMeta();
        renderTable();
      });
    }

    // URL query support (?view=pricing|frontier, ?domain=<id>, ?bench=<id>)
    let initialTab = 'overview';
    let initialView = 'leaderboard';
    try {
      const searchStr = typeof window !== 'undefined' && window.location ? window.location.search : '';
      const params = new URLSearchParams(searchStr);
      const qView = params.get('view');
      const qDomain = params.get('domain');
      const qBench = params.get('bench');
      if (qView === 'pricing' || qView === 'frontier') initialView = qView;
      if (qDomain && domainById.has(qDomain)) initialTab = `domain:${qDomain}`;
      else if (qBench && benchById.has(qBench)) initialTab = qBench;
    } catch {
      // ignore
    }

    setCurrency(state.currency);
    if (initialView !== 'leaderboard') {
      selectView(initialView);
    } else {
      selectTab(initialTab);
    }

    return {
      state,
      setCurrency,
      selectView,
      selectTab,
      toggleSort,
      resetFilters,
      render: () => {
        renderMeta();
        renderTable();
      }
    };
  }

  return {
    formatScore,
    formatPrice,
    formatContext,
    computeBarPercent,
    computeLocalPareto,
    filterRows,
    sortRows,
    initModelsBoard
  };
});
