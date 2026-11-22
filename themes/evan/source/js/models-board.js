/* Interactive Models Leaderboard controller:
 * - Bench switcher tabs (Overview Matrix + dynamically discovered benchmarks)
 * - Filters (All / Open Weights / Closed API, Reasoning toggle, Provider select, Search)
 * - Column sorting (asc/desc) with horizontal progress bars
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
      if (state.reasoningOnly && !row.reasoning) return false;
      if (state.provider && state.provider !== 'all' && row.provider !== state.provider) return false;
      if (query) {
        const haystack = `${row.model || ''} ${row.provider || ''} ${row.notes || ''}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
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
      if (sortKey === 'avgNormalized') {
        const diff = (Number(a.avgNormalized) || 0) - (Number(b.avgNormalized) || 0);
        return diff !== 0 ? diff * dir : a.model.localeCompare(b.model, 'en');
      }
      if (sortKey === 'score') {
        const av = Number(a.score);
        const bv = Number(b.score);
        const aMissing = !Number.isFinite(av);
        const bMissing = !Number.isFinite(bv);
        if (aMissing && bMissing) return a.model.localeCompare(b.model, 'en');
        if (aMissing) return 1;
        if (bMissing) return -1;
        const diff = av - bv;
        return diff !== 0 ? diff * dir : a.model.localeCompare(b.model, 'en');
      }
      if (sortKey.startsWith('bench:')) {
        const benchId = sortKey.slice(6);
        const av = a.scores ? Number(a.scores[benchId]) : NaN;
        const bv = b.scores ? Number(b.scores[benchId]) : NaN;
        const aMissing = !Number.isFinite(av);
        const bMissing = !Number.isFinite(bv);
        if (aMissing && bMissing) return a.model.localeCompare(b.model, 'en');
        if (aMissing) return 1;
        if (bMissing) return -1;
        const diff = av - bv;
        return diff !== 0 ? diff * dir : a.model.localeCompare(b.model, 'en');
      }
      if (activeBench && activeBench.higherIsBetter === false) {
        return ((Number(a.score) || 0) - (Number(b.score) || 0)) * dir;
      }
      return 0;
    });
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
    const overview = Array.isArray(payload.overview) ? payload.overview : [];
    if (!benchmarks.length) return null;

    if (board.dataset) board.dataset.modelsBound = '1';

    const benchById = new Map(benchmarks.map((b) => [b.id, b]));
    const tabsContainer = board.querySelector('[data-models-tabs]');
    const metaDescEl = board.querySelector('[data-models-meta-desc]');
    const metaBadgesEl = board.querySelector('[data-models-meta-badges]');
    const licenseBtns = Array.from(board.querySelectorAll('[data-models-license]'));
    const reasoningBtn = board.querySelector('[data-models-reasoning]');
    const providerSelect = board.querySelector('[data-models-provider]');
    const searchInput = board.querySelector('[data-models-search]');
    const statusEl = board.querySelector('[data-models-status]');
    const thead = board.querySelector('[data-models-thead]');
    const tbody = board.querySelector('[data-models-tbody]');
    const emptyEl = board.querySelector('[data-models-empty]');
    const resetBtn = board.querySelector('[data-models-reset]');

    const state = {
      activeTab: 'overview',
      license: 'all',
      reasoningOnly: false,
      provider: 'all',
      search: '',
      sortKey: 'avgNormalized',
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

    function renderMeta() {
      const mode = getLangMode(root);
      if (!metaDescEl || !metaBadgesEl) return;

      if (state.activeTab === 'overview') {
        metaDescEl.textContent = translate(
          'models.overview.desc',
          mode,
          'Normalized composite index (0–100, relative to top score per benchmark) aggregated automatically from all registered benchmark JSON files.'
        );
        const updatedLabel = translate('models.meta.updated', mode, 'Updated');
        metaBadgesEl.innerHTML = payload.latestUpdatedAt
          ? `<span class="models-meta-badge">${escapeHtml(updatedLabel)}: ${escapeHtml(payload.latestUpdatedAt)}</span>`
          : '';
        return;
      }

      const bench = benchById.get(state.activeTab);
      if (!bench) return;

      metaDescEl.textContent = bench.description || bench.name;

      const badges = [];
      if (bench.category) {
        badges.push(`<span class="models-meta-badge">${escapeHtml(bench.category)}</span>`);
      }
      if (bench.unit) {
        const dirText = bench.higherIsBetter !== false
          ? translate('models.meta.higherBetter', mode, 'Higher is better')
          : translate('models.meta.lowerBetter', mode, 'Lower is better');
        badges.push(`<span class="models-meta-badge">${escapeHtml(bench.unit)} · ${escapeHtml(dirText)}</span>`);
      }
      if (bench.sourceName) {
        const sourceLabel = translate('models.meta.source', mode, 'Source');
        if (bench.sourceUrl) {
          badges.push(
            `<a class="models-meta-badge" href="${escapeHtml(bench.sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(sourceLabel)}: ${escapeHtml(bench.sourceName)} ↗</a>`
          );
        } else {
          badges.push(`<span class="models-meta-badge">${escapeHtml(sourceLabel)}: ${escapeHtml(bench.sourceName)}</span>`);
        }
      }
      if (bench.updatedAt) {
        const updatedLabel = translate('models.meta.updated', mode, 'Updated');
        badges.push(`<span class="models-meta-badge">${escapeHtml(updatedLabel)}: ${escapeHtml(bench.updatedAt)}</span>`);
      }
      metaBadgesEl.innerHTML = badges.join('');
    }

    function renderTable() {
      const mode = getLangMode(root);
      const isOverview = state.activeTab === 'overview';
      const activeBench = isOverview ? null : benchById.get(state.activeTab);

      const baseRows = isOverview ? overview : (activeBench ? activeBench.entries : []);
      const filtered = filterRows(baseRows, state);
      const sorted = sortRows(filtered, state.sortKey, state.sortDir, activeBench);

      const openLabel = translate('models.badge.open', mode, 'Open');
      const closedLabel = translate('models.badge.closed', mode, 'API');
      const reasoningLabel = translate('models.badge.reasoning', mode, 'Reasoning');

      if (thead) {
        if (isOverview) {
          const rankCol = translate('models.col.rank', mode, '#');
          const modelCol = translate('models.col.model', mode, 'Model');
          const compCol = translate('models.col.composite', mode, 'Composite');

          const benchHeaders = benchmarks
            .map((bench) => {
              const key = `bench:${bench.id}`;
              const isSorted = state.sortKey === key;
              return `<th scope="col" class="col-bench" aria-sort="${getAriaSort(key)}">
                <button type="button" class="models-sort-btn${isSorted ? ' is-sorted' : ''}" data-sort-key="${escapeHtml(key)}">
                  <span>${escapeHtml(bench.name)}</span>
                  <span class="sort-icon" aria-hidden="true">${getSortIndicator(key)}</span>
                </button>
              </th>`;
            })
            .join('');

          thead.innerHTML = `<tr>
            <th scope="col" class="col-rank">${escapeHtml(rankCol)}</th>
            <th scope="col" class="col-model" aria-sort="${getAriaSort('model')}">
              <button type="button" class="models-sort-btn${state.sortKey === 'model' ? ' is-sorted' : ''}" data-sort-key="model">
                <span>${escapeHtml(modelCol)}</span>
                <span class="sort-icon" aria-hidden="true">${getSortIndicator('model')}</span>
              </button>
            </th>
            <th scope="col" class="col-composite" aria-sort="${getAriaSort('avgNormalized')}">
              <button type="button" class="models-sort-btn${state.sortKey === 'avgNormalized' ? ' is-sorted' : ''}" data-sort-key="avgNormalized">
                <span>${escapeHtml(compCol)}</span>
                <span class="sort-icon" aria-hidden="true">${getSortIndicator('avgNormalized')}</span>
              </button>
            </th>
            ${benchHeaders}
          </tr>`;
        } else {
          const rankCol = translate('models.col.rank', mode, '#');
          const modelCol = translate('models.col.model', mode, 'Model');
          const providerCol = translate('models.col.provider', mode, 'Provider');
          const scoreCol = translate('models.col.score', mode, 'Score');
          const releaseCol = translate('models.col.release', mode, 'Release');
          const unitSuffix = activeBench && activeBench.unit ? ` (${activeBench.unit})` : '';

          thead.innerHTML = `<tr>
            <th scope="col" class="col-rank">${escapeHtml(rankCol)}</th>
            <th scope="col" class="col-model" aria-sort="${getAriaSort('model')}">
              <button type="button" class="models-sort-btn${state.sortKey === 'model' ? ' is-sorted' : ''}" data-sort-key="model">
                <span>${escapeHtml(modelCol)}</span>
                <span class="sort-icon" aria-hidden="true">${getSortIndicator('model')}</span>
              </button>
            </th>
            <th scope="col" class="col-provider" aria-sort="${getAriaSort('provider')}">
              <button type="button" class="models-sort-btn${state.sortKey === 'provider' ? ' is-sorted' : ''}" data-sort-key="provider">
                <span>${escapeHtml(providerCol)}</span>
                <span class="sort-icon" aria-hidden="true">${getSortIndicator('provider')}</span>
              </button>
            </th>
            <th scope="col" class="col-score" aria-sort="${getAriaSort('score')}">
              <button type="button" class="models-sort-btn${state.sortKey === 'score' ? ' is-sorted' : ''}" data-sort-key="score">
                <span>${escapeHtml(scoreCol + unitSuffix)}</span>
                <span class="sort-icon" aria-hidden="true">${getSortIndicator('score')}</span>
              </button>
            </th>
            <th scope="col" class="col-release" aria-sort="${getAriaSort('releaseDate')}">
              <button type="button" class="models-sort-btn${state.sortKey === 'releaseDate' ? ' is-sorted' : ''}" data-sort-key="releaseDate">
                <span>${escapeHtml(releaseCol)}</span>
                <span class="sort-icon" aria-hidden="true">${getSortIndicator('releaseDate')}</span>
              </button>
            </th>
          </tr>`;
        }
      }

      if (tbody) {
        if (isOverview) {
          tbody.innerHTML = sorted
            .map((row, idx) => {
              const rankClass = idx < 3 ? ` is-top-${idx + 1}` : '';
              const pct = Math.max(0, Math.min(100, Number(row.avgNormalized) || 0));
              const benchCells = benchmarks
                .map((bench) => {
                  const rawVal = row.scores ? row.scores[bench.id] : undefined;
                  const missing = rawVal === undefined || rawVal === null || !Number.isFinite(Number(rawVal));
                  return `<td class="col-bench"><span class="models-bench-val${missing ? ' is-missing' : ''}">${escapeHtml(formatScore(rawVal, bench.unit))}</span></td>`;
                })
                .join('');

              return `<tr data-model-row="${escapeHtml(row.model)}">
                <td class="col-rank"><span class="models-rank${rankClass}">${idx + 1}</span></td>
                <td class="col-model">
                  <div class="models-model-cell">
                    <span class="models-model-name">${escapeHtml(row.model)}</span>
                    <div class="models-model-meta">
                      <span class="models-provider-label">${escapeHtml(row.provider)}</span>
                      <span class="models-badge ${row.openWeights ? 'is-open' : 'is-closed'}">${escapeHtml(row.openWeights ? openLabel : closedLabel)}</span>
                      ${row.reasoning ? `<span class="models-badge is-reasoning">${escapeHtml(reasoningLabel)}</span>` : ''}
                    </div>
                  </div>
                </td>
                <td class="col-composite">
                  <div class="models-bar-cell">
                    <span class="models-score-val">${escapeHtml((Number(row.avgNormalized) || 0).toFixed(1))}</span>
                    <div class="models-bar-track" aria-hidden="true"><div class="models-bar-fill" style="width:${pct}%"></div></div>
                  </div>
                </td>
                ${benchCells}
              </tr>`;
            })
            .join('');
        } else if (activeBench) {
          tbody.innerHTML = sorted
            .map((row, idx) => {
              const rankClass = idx < 3 ? ` is-top-${idx + 1}` : '';
              const pct = computeBarPercent(row.score, activeBench);
              return `<tr data-model-row="${escapeHtml(row.model)}">
                <td class="col-rank"><span class="models-rank${rankClass}">${idx + 1}</span></td>
                <td class="col-model">
                  <div class="models-model-cell">
                    <span class="models-model-name">${escapeHtml(row.model)}</span>
                    <div class="models-model-meta">
                      <span class="models-badge ${row.openWeights ? 'is-open' : 'is-closed'}">${escapeHtml(row.openWeights ? openLabel : closedLabel)}</span>
                      ${row.reasoning ? `<span class="models-badge is-reasoning">${escapeHtml(reasoningLabel)}</span>` : ''}
                      ${row.notes ? `<span class="models-model-notes">${escapeHtml(row.notes)}</span>` : ''}
                    </div>
                  </div>
                </td>
                <td class="col-provider">${escapeHtml(row.provider)}</td>
                <td class="col-score">
                  <div class="models-bar-cell">
                    <span class="models-score-val">${escapeHtml(formatScore(row.score, activeBench.unit))}</span>
                    <div class="models-bar-track" aria-hidden="true"><div class="models-bar-fill" style="width:${pct.toFixed(1)}%"></div></div>
                  </div>
                </td>
                <td class="col-release"><span class="models-release-val">${escapeHtml(row.releaseDate || '—')}</span></td>
              </tr>`;
            })
            .join('');
        }
      }

      if (statusEl) {
        statusEl.textContent = `${sorted.length} / ${baseRows.length}`;
      }
      if (emptyEl) {
        emptyEl.hidden = sorted.length > 0;
      }
    }

    function selectTab(tabId) {
      const targetId = tabId === 'overview' || benchById.has(tabId) ? tabId : 'overview';
      state.activeTab = targetId;

      if (targetId === 'overview') {
        state.sortKey = 'avgNormalized';
        state.sortDir = 'desc';
      } else {
        const bench = benchById.get(targetId);
        state.sortKey = 'score';
        state.sortDir = bench && bench.higherIsBetter === false ? 'asc' : 'desc';
      }

      if (tabsContainer) {
        tabsContainer.querySelectorAll('[data-models-tab]').forEach((btn) => {
          const isActive = btn.getAttribute('data-models-tab') === targetId;
          btn.classList.toggle('is-active', isActive);
          btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
      }

      renderMeta();
      renderTable();
    }

    function toggleSort(key) {
      if (state.sortKey === key) {
        state.sortDir = state.sortDir === 'desc' ? 'asc' : 'desc';
      } else {
        state.sortKey = key;
        if (key === 'model' || key === 'provider') {
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
      state.reasoningOnly = false;
      state.provider = 'all';
      state.search = '';

      licenseBtns.forEach((btn) => {
        const active = btn.getAttribute('data-models-license') === 'all';
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      if (reasoningBtn) {
        reasoningBtn.classList.remove('is-active');
        reasoningBtn.setAttribute('aria-pressed', 'false');
      }
      if (providerSelect) providerSelect.value = 'all';
      if (searchInput) searchInput.value = '';
      renderTable();
    }

    // Event bindings
    if (tabsContainer) {
      tabsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest ? e.target.closest('[data-models-tab]') : null;
        if (!btn) return;
        selectTab(btn.getAttribute('data-models-tab'));
      });
    }

    licenseBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-models-license') || 'all';
        state.license = val;
        licenseBtns.forEach((b) => {
          const active = b === btn;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        renderTable();
      });
    });

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

    // Optional URL ?bench=<id> support
    let initialTab = 'overview';
    try {
      const searchStr = typeof window !== 'undefined' && window.location ? window.location.search : '';
      const params = new URLSearchParams(searchStr);
      const qBench = params.get('bench');
      if (qBench && benchById.has(qBench)) initialTab = qBench;
    } catch {
      // ignore
    }

    selectTab(initialTab);

    return {
      state,
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
    computeBarPercent,
    filterRows,
    sortRows,
    initModelsBoard
  };
});
