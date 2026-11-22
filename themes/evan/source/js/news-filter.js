/* Interactive 3-view tabs, 2-level industry/topic filtering, URL sync, i18n, and Load More pagination for /news/. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NewsFilter = factory();
    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          root.NewsFilter.initNewsFilter();
        });
      } else {
        root.NewsFilter.initNewsFilter();
      }
    }
  }
})(typeof self !== 'undefined' ? self : this, function () {
  const DEFAULT_PAGE_SIZE = 15;
  const ALL_TAG = 'all';
  const ALL_INDUSTRY = 'all';
  const DEFAULT_VIEW = 'curated';
  const VALID_VIEWS = ['curated', 'all', 'hot'];

  const INDUSTRY_LABELS = {
    en: {
      all: 'All Industries',
      AI: 'AI',
      '工程与开源': 'Engineering & OSS',
      '金融与政策': 'Finance & Policy'
    },
    zh: {
      all: '全部行业',
      AI: 'AI',
      '工程与开源': '工程与开源',
      '金融与政策': '金融与政策'
    }
  };

  function getLangMode(doc) {
    const mode = doc?.documentElement?.dataset?.langMode;
    return mode === 'zh' ? 'zh' : 'en';
  }

  function formatIndustryLabel(mode, industry) {
    const dict = INDUSTRY_LABELS[mode] || INDUSTRY_LABELS.en;
    return dict[industry] || industry;
  }

  function formatCopy(mode, key, params = {}) {
    if (mode === 'zh') {
      if (key === 'all') return '全部';
      if (key === 'industryAll') return '全部行业';
      if (key === 'viewCurated') return '精选';
      if (key === 'viewAll') return '全部动态';
      if (key === 'viewHot') return '热点榜';
      if (key === 'heat') return '热度';
      if (key === 'sources') return `${params.count || 1} 家来源报道`;
      if (key === 'relatedCoverage') return `相关报道（${params.count || 0} 篇）`;
      if (key === 'viewDetail') return '查看详情 →';
      if (key === 'emptyFiltered') return '当前筛选条件下暂无快讯。';
      if (key === 'resetFilters') return '重置筛选';
      if (key === 'filterBarLabel') return '按行业和标签筛选新闻';
      if (key === 'viewTabsLabel') return '新闻视图切换';
      if (key === 'industryBarLabel') return '按行业筛选新闻';
      if (key === 'loadMore') return `加载更多（剩余 ${params.remaining} 条）`;
      if (key === 'statusAll') return `显示 ${params.shown} / ${params.total} 条快讯`;
      if (key === 'statusFiltered') return `显示 ${params.shown} / ${params.total} 条 #${params.tag} 快讯`;
      if (key === 'statusIndustry') return `显示 ${params.shown} / ${params.total} 条 ${params.industryLabel} 快讯`;
      if (key === 'statusIndustryTag') return `显示 ${params.shown} / ${params.total} 条 ${params.industryLabel} · #${params.tag} 快讯`;
      if (key === 'statusHotAll') return `显示 ${params.shown} / ${params.total} 条热点事件`;
      if (key === 'statusHotFiltered') return `显示 ${params.shown} / ${params.total} 条 ${params.filterDesc} 热点事件`;
    }
    if (key === 'all') return 'All';
    if (key === 'industryAll') return 'All Industries';
    if (key === 'viewCurated') return 'Curated';
    if (key === 'viewAll') return 'All Updates';
    if (key === 'viewHot') return 'Hot Events';
    if (key === 'heat') return 'Heat';
    if (key === 'sources') return (params.count || 1) === 1 ? '1 source' : `${params.count} sources`;
    if (key === 'relatedCoverage') return `Related coverage (${params.count || 0})`;
    if (key === 'viewDetail') return 'Read summary →';
    if (key === 'emptyFiltered') return 'No matching items for the current filters.';
    if (key === 'resetFilters') return 'Reset filters';
    if (key === 'filterBarLabel') return 'Filter news by tag';
    if (key === 'viewTabsLabel') return 'News views';
    if (key === 'industryBarLabel') return 'Filter news by industry';
    if (key === 'loadMore') return `Load more (${params.remaining} remaining)`;
    if (key === 'statusAll') return `Showing ${params.shown} of ${params.total} items`;
    if (key === 'statusFiltered') return `Showing ${params.shown} of ${params.total} items in #${params.tag}`;
    if (key === 'statusIndustry') return `Showing ${params.shown} of ${params.total} items in ${params.industryLabel}`;
    if (key === 'statusIndustryTag') return `Showing ${params.shown} of ${params.total} items in ${params.industryLabel} · #${params.tag}`;
    if (key === 'statusHotAll') return `Showing ${params.shown} of ${params.total} hot events`;
    if (key === 'statusHotFiltered') return `Showing ${params.shown} of ${params.total} hot events in ${params.filterDesc}`;
    return '';
  }

  function parseItemTags(itemEl) {
    const raw = itemEl?.getAttribute?.('data-news-tags') || '';
    if (!raw) return [];
    return raw
      .split('|')
      .map((t) => t.trim())
      .filter(Boolean);
  }

  function parseItemIndustry(itemEl) {
    return (itemEl?.getAttribute?.('data-news-industry') || '').trim();
  }

  function isItemSelected(itemEl) {
    return itemEl?.getAttribute?.('data-news-selected') !== 'false';
  }

  function readTagFromLocation(loc) {
    if (!loc) return null;
    try {
      if (loc.search) {
        const params = new URLSearchParams(loc.search);
        const qTag = params.get('tag');
        if (qTag && qTag.trim()) return qTag.trim();
      }
      if (loc.hash && loc.hash.startsWith('#tag=')) {
        const hTag = decodeURIComponent(loc.hash.slice(5)).trim();
        if (hTag) return hTag;
      }
    } catch {
      // ignore malformed URL/hash
    }
    return null;
  }

  function readStateFromLocation(loc) {
    const result = { view: null, industry: null, tag: null };
    if (!loc) return result;
    try {
      if (loc.search) {
        const params = new URLSearchParams(loc.search);
        const qView = params.get('view');
        if (qView && VALID_VIEWS.includes(qView.trim())) {
          result.view = qView.trim();
        }
        const qIndustry = params.get('industry');
        if (qIndustry && qIndustry.trim()) {
          result.industry = qIndustry.trim();
        }
      }
      result.tag = readTagFromLocation(loc);
    } catch {
      // ignore malformed URL
    }
    return result;
  }

  function syncStateToUrl(state, win) {
    if (!win?.location || !win?.history?.replaceState) return;
    try {
      const url = new URL(win.location.href);
      if (state.activeView && state.activeView !== DEFAULT_VIEW) {
        url.searchParams.set('view', state.activeView);
      } else {
        url.searchParams.delete('view');
      }
      if (state.activeIndustry && state.activeIndustry !== ALL_INDUSTRY) {
        url.searchParams.set('industry', state.activeIndustry);
      } else {
        url.searchParams.delete('industry');
      }
      if (state.activeTag && state.activeTag !== ALL_TAG) {
        url.searchParams.set('tag', state.activeTag);
      } else {
        url.searchParams.delete('tag');
      }
      if (url.hash && url.hash.startsWith('#tag=')) {
        url.hash = '';
      }
      win.history.replaceState(null, '', url.pathname + url.search + url.hash);
    } catch {
      // ignore in environments where replaceState is unavailable
    }
  }

  function initNewsFilter({
    root = typeof document !== 'undefined' ? document : null,
    window: win = typeof window !== 'undefined' ? window : null,
    pageSize
  } = {}) {
    if (!root?.querySelector) return null;

    const filterBar = root.querySelector('[data-news-filter-bar]');
    const feed = root.querySelector('[data-news-feed]');
    if (!filterBar || !feed) return null;

    if (feed.dataset?.newsFilterBound === '1') return null;
    if (feed.dataset) feed.dataset.newsFilterBound = '1';

    const attrSize = Number.parseInt(feed.getAttribute('data-news-page-size') || '', 10);
    const resolvedPageSize = Number.isInteger(pageSize) && pageSize > 0
      ? pageSize
      : (Number.isInteger(attrSize) && attrSize > 0 ? attrSize : DEFAULT_PAGE_SIZE);

    const viewTabsBar = root.querySelector('[data-news-view-tabs]');
    const viewTabs = viewTabsBar ? Array.from(viewTabsBar.querySelectorAll('[data-news-view-tab]')) : [];
    const industryBar = filterBar.querySelector('[data-news-industry-bar]');
    const industryChips = industryBar ? Array.from(industryBar.querySelectorAll('[data-news-industry-chip]')) : [];
    const chips = Array.from(filterBar.querySelectorAll('[data-news-filter-chip]'));
    const statusEl = filterBar.querySelector('[data-news-filter-status]');
    const items = Array.from(feed.querySelectorAll('[data-news-item]'));
    const hotFeed = root.querySelector('[data-news-hot-feed]');
    const hotItems = hotFeed ? Array.from(hotFeed.querySelectorAll('[data-news-hot-item]')) : [];
    const emptyEl = root.querySelector('[data-news-filter-empty]');
    const resetBtn = root.querySelector('[data-news-reset-filters]');
    const paginationEl = root.querySelector('[data-news-pagination]');
    const loadMoreBtn = root.querySelector('[data-news-load-more]');

    const availableViews = new Set(
      viewTabs.map((t) => t.getAttribute('data-news-view-tab')).filter(Boolean)
    );
    const availableIndustries = new Set(
      industryChips
        .map((c) => c.getAttribute('data-news-industry-chip'))
        .filter((ind) => ind && ind !== ALL_INDUSTRY)
    );
    const availableTags = new Set(
      chips
        .map((c) => c.getAttribute('data-news-filter-chip'))
        .filter((t) => t && t !== ALL_TAG)
    );

    const state = {
      activeView: DEFAULT_VIEW,
      activeIndustry: ALL_INDUSTRY,
      activeTag: ALL_TAG,
      visibleCount: resolvedPageSize
    };

    function applyLocationState(loc) {
      const parsed = readStateFromLocation(loc);
      if (parsed.view && (availableViews.size === 0 || availableViews.has(parsed.view))) {
        state.activeView = parsed.view;
      } else {
        state.activeView = DEFAULT_VIEW;
      }
      if (parsed.industry && availableIndustries.has(parsed.industry)) {
        state.activeIndustry = parsed.industry;
      } else {
        state.activeIndustry = ALL_INDUSTRY;
      }
      if (parsed.tag && availableTags.has(parsed.tag)) {
        state.activeTag = parsed.tag;
      } else {
        state.activeTag = ALL_TAG;
      }
    }

    applyLocationState(win?.location);

    function getActivePool() {
      if (state.activeView === 'hot' && hotFeed) {
        return hotItems;
      }
      if (state.activeView === 'curated') {
        return items.filter(isItemSelected);
      }
      return items;
    }

    function updateI18nNodes(mode) {
      const i18nNodes = Array.from(root.querySelectorAll('[data-news-i18n]'));
      i18nNodes.forEach((el) => {
        const key = el.getAttribute('data-news-i18n');
        if (!key) return;
        const countAttr = el.getAttribute('data-count');
        const count = countAttr !== null ? Number.parseInt(countAttr, 10) : undefined;
        const translated = formatCopy(mode, key, { count });
        if (translated) {
          el.textContent = translated;
        }
      });

      const industryLabelNodes = Array.from(root.querySelectorAll('[data-news-industry-label]'));
      industryLabelNodes.forEach((el) => {
        const ind = el.getAttribute('data-news-industry-label');
        if (ind) el.textContent = formatIndustryLabel(mode, ind);
      });

      const industryPills = Array.from(root.querySelectorAll('[data-news-industry-pill]'));
      industryPills.forEach((el) => {
        const ind = el.getAttribute('data-news-industry-pill');
        if (ind) el.textContent = formatIndustryLabel(mode, ind);
      });
    }

    function formatStatusLine(mode, shown, total) {
      const isHot = state.activeView === 'hot' && Boolean(hotFeed);
      const hasIndustry = state.activeIndustry !== ALL_INDUSTRY;
      const hasTag = state.activeTag !== ALL_TAG;
      const industryLabel = formatIndustryLabel(mode, state.activeIndustry);

      if (isHot) {
        if (!hasIndustry && !hasTag) {
          return formatCopy(mode, 'statusHotAll', { shown, total });
        }
        const parts = [];
        if (hasIndustry) parts.push(industryLabel);
        if (hasTag) parts.push(`#${state.activeTag}`);
        return formatCopy(mode, 'statusHotFiltered', {
          shown,
          total,
          filterDesc: parts.join(' · ')
        });
      }

      if (!hasIndustry && !hasTag) {
        return formatCopy(mode, 'statusAll', { shown, total });
      }
      if (!hasIndustry && hasTag) {
        return formatCopy(mode, 'statusFiltered', { shown, total, tag: state.activeTag });
      }
      if (hasIndustry && !hasTag) {
        return formatCopy(mode, 'statusIndustry', { shown, total, industryLabel });
      }
      return formatCopy(mode, 'statusIndustryTag', {
        shown,
        total,
        industryLabel,
        tag: state.activeTag
      });
    }

    function applyRender({ updateUrl = false } = {}) {
      const mode = getLangMode(root);
      const isHotView = state.activeView === 'hot' && Boolean(hotFeed);

      filterBar.setAttribute('aria-label', formatCopy(mode, 'filterBarLabel'));
      if (viewTabsBar) {
        viewTabsBar.setAttribute('aria-label', formatCopy(mode, 'viewTabsLabel'));
      }
      if (industryBar) {
        industryBar.setAttribute('aria-label', formatCopy(mode, 'industryBarLabel'));
      }

      updateI18nNodes(mode);

      // Update view tabs active state
      viewTabs.forEach((tab) => {
        const tabView = tab.getAttribute('data-news-view-tab');
        const isActive = tabView === state.activeView;
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        tab.classList.toggle('is-active', isActive);
      });

      // Toggle feed containers
      feed.hidden = isHotView;
      if (hotFeed) {
        hotFeed.hidden = !isHotView;
      }

      // Compute active pool for the current view
      const viewPool = getActivePool();

      // Update industry counts based on current viewPool
      if (industryChips.length) {
        const indCounts = new Map();
        viewPool.forEach((el) => {
          const ind = parseItemIndustry(el);
          if (ind) indCounts.set(ind, (indCounts.get(ind) || 0) + 1);
        });

        industryChips.forEach((chip) => {
          const chipInd = chip.getAttribute('data-news-industry-chip');
          const isActive = chipInd === state.activeIndustry;
          chip.setAttribute('aria-pressed', isActive ? 'true' : 'false');
          chip.classList.toggle('is-active', isActive);
          const countEl = chip.querySelector('[data-news-industry-count]');
          if (countEl) {
            countEl.textContent = String(chipInd === ALL_INDUSTRY ? viewPool.length : (indCounts.get(chipInd) || 0));
          }
        });
      }

      // Filter viewPool by industry
      const industryPool = state.activeIndustry === ALL_INDUSTRY
        ? viewPool
        : viewPool.filter((el) => parseItemIndustry(el) === state.activeIndustry);

      // Update topic/tag chip counts based on industryPool
      const tagCounts = new Map();
      industryPool.forEach((el) => {
        parseItemTags(el).forEach((t) => {
          tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
        });
      });

      chips.forEach((chip) => {
        const chipTag = chip.getAttribute('data-news-filter-chip');
        const isActive = chipTag === state.activeTag;
        chip.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        chip.classList.toggle('is-active', isActive);
        if (chipTag === ALL_TAG) {
          const labelEl = chip.querySelector('[data-news-i18n="all"]');
          if (labelEl) labelEl.textContent = formatCopy(mode, 'all');
        }
        const countEl = chip.querySelector('[data-news-tag-count]');
        if (countEl) {
          countEl.textContent = String(chipTag === ALL_TAG ? industryPool.length : (tagCounts.get(chipTag) || 0));
        }
      });

      // Update inline tag badges active state across both feeds
      const allBadges = Array.from(root.querySelectorAll('[data-news-tag-badge]'));
      allBadges.forEach((badge) => {
        const badgeTag = badge.getAttribute('data-news-tag-badge');
        const isActive = state.activeTag !== ALL_TAG && badgeTag === state.activeTag;
        badge.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        badge.classList.toggle('is-active', isActive);
      });

      // Hide non-active feed items and apply industry + tag + pagination to active feed
      const matchingItems = [];
      const activeList = isHotView ? hotItems : items;
      const viewPoolSet = new Set(viewPool);

      activeList.forEach((item) => {
        if (!viewPoolSet.has(item)) {
          item.hidden = true;
          return;
        }
        const matchesIndustry = state.activeIndustry === ALL_INDUSTRY || parseItemIndustry(item) === state.activeIndustry;
        const tags = parseItemTags(item);
        const matchesTag = state.activeTag === ALL_TAG || tags.includes(state.activeTag);
        if (matchesIndustry && matchesTag) {
          matchingItems.push(item);
        } else {
          item.hidden = true;
        }
      });

      let shownCount = 0;
      matchingItems.forEach((item, index) => {
        const shouldShow = index < state.visibleCount;
        item.hidden = !shouldShow;
        if (shouldShow) shownCount += 1;
      });

      // Toggle empty filter state
      if (emptyEl) {
        emptyEl.hidden = matchingItems.length > 0;
      }

      const remaining = Math.max(0, matchingItems.length - shownCount);

      // Update pagination button
      if (paginationEl && loadMoreBtn) {
        if (remaining > 0) {
          paginationEl.hidden = false;
          loadMoreBtn.textContent = formatCopy(mode, 'loadMore', { remaining });
        } else {
          paginationEl.hidden = true;
        }
      }

      // Update live status line
      if (statusEl) {
        statusEl.textContent = formatStatusLine(mode, shownCount, matchingItems.length);
      }

      if (updateUrl) {
        syncStateToUrl(state, win);
      }
    }

    function setView(view, { updateUrl = true } = {}) {
      const nextView = view && VALID_VIEWS.includes(view) && (availableViews.size === 0 || availableViews.has(view))
        ? view
        : DEFAULT_VIEW;
      state.activeView = nextView;
      state.visibleCount = resolvedPageSize;
      applyRender({ updateUrl });
    }

    function setIndustry(industry, { toggleIfActive = false, updateUrl = true } = {}) {
      let nextInd = industry && (industry === ALL_INDUSTRY || availableIndustries.has(industry))
        ? industry
        : ALL_INDUSTRY;
      if (toggleIfActive && nextInd !== ALL_INDUSTRY && nextInd === state.activeIndustry) {
        nextInd = ALL_INDUSTRY;
      }
      state.activeIndustry = nextInd;
      state.visibleCount = resolvedPageSize;
      applyRender({ updateUrl });
    }

    function setFilter(tag, { toggleIfActive = false, updateUrl = true } = {}) {
      let nextTag = tag && (tag === ALL_TAG || availableTags.has(tag)) ? tag : ALL_TAG;
      if (toggleIfActive && nextTag !== ALL_TAG && nextTag === state.activeTag) {
        nextTag = ALL_TAG;
      }
      state.activeTag = nextTag;
      state.visibleCount = resolvedPageSize;
      applyRender({ updateUrl });
    }

    function resetFilters({ updateUrl = true } = {}) {
      state.activeIndustry = ALL_INDUSTRY;
      state.activeTag = ALL_TAG;
      state.visibleCount = resolvedPageSize;
      applyRender({ updateUrl });
    }

    function loadMore() {
      state.visibleCount += resolvedPageSize;
      applyRender({ updateUrl: false });
    }

    // Bind view tabs
    viewTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const view = tab.getAttribute('data-news-view-tab');
        setView(view, { updateUrl: true });
      });
    });

    // Bind industry chips
    industryChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const ind = chip.getAttribute('data-news-industry-chip');
        setIndustry(ind, { toggleIfActive: ind !== ALL_INDUSTRY, updateUrl: true });
      });
    });

    // Bind topic/tag chips
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const tag = chip.getAttribute('data-news-filter-chip');
        setFilter(tag, { toggleIfActive: tag !== ALL_TAG, updateUrl: true });
      });
    });

    // Bind inline tag badge clicks (event delegation on feed & hotFeed)
    const handleBadgeClick = (event) => {
      const target = event.target?.closest?.('[data-news-tag-badge]');
      if (!target) return;
      const tag = target.getAttribute('data-news-tag-badge');
      setFilter(tag, { toggleIfActive: true, updateUrl: true });
    };
    feed.addEventListener('click', handleBadgeClick);
    if (hotFeed) {
      hotFeed.addEventListener('click', handleBadgeClick);
    }

    // Bind Reset Filters button
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        resetFilters({ updateUrl: true });
      });
    }

    // Bind Load More click
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        loadMore();
      });
    }

    // React to language toggle and URL navigation events
    if (win?.addEventListener) {
      win.addEventListener('xdlkc:lang-change', () => {
        applyRender({ updateUrl: false });
      });
      const handleUrlChange = () => {
        applyLocationState(win.location);
        state.visibleCount = resolvedPageSize;
        applyRender({ updateUrl: false });
      };
      win.addEventListener('hashchange', handleUrlChange);
      win.addEventListener('popstate', handleUrlChange);
    }

    // Initial render
    applyRender({ updateUrl: false });

    return {
      getState: () => ({ ...state }),
      setView,
      setIndustry,
      setFilter,
      resetFilters,
      loadMore,
      refresh: () => applyRender({ updateUrl: false })
    };
  }

  return {
    DEFAULT_PAGE_SIZE,
    ALL_TAG,
    ALL_INDUSTRY,
    DEFAULT_VIEW,
    VALID_VIEWS,
    parseItemTags,
    parseItemIndustry,
    isItemSelected,
    readTagFromLocation,
    readStateFromLocation,
    initNewsFilter
  };
});
