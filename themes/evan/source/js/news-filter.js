/* Interactive tag/category filtering and Load More pagination for /news/. */
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

  function getLangMode(doc) {
    const mode = doc?.documentElement?.dataset?.langMode;
    return mode === 'zh' ? 'zh' : 'en';
  }

  function formatCopy(mode, key, params = {}) {
    if (mode === 'zh') {
      if (key === 'all') return '全部';
      if (key === 'filterBarLabel') return '按标签筛选新闻';
      if (key === 'loadMore') return `加载更多（剩余 ${params.remaining} 条）`;
      if (key === 'statusAll') return `显示 ${params.shown} / ${params.total} 条快讯`;
      if (key === 'statusFiltered') return `显示 ${params.shown} / ${params.total} 条 #${params.tag} 快讯`;
    }
    if (key === 'all') return 'All';
    if (key === 'filterBarLabel') return 'Filter news by tag';
    if (key === 'loadMore') return `Load more (${params.remaining} remaining)`;
    if (key === 'statusAll') return `Showing ${params.shown} of ${params.total} items`;
    if (key === 'statusFiltered') return `Showing ${params.shown} of ${params.total} items in #${params.tag}`;
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

  function syncTagToUrl(tag, win) {
    if (!win?.location || !win?.history?.replaceState) return;
    try {
      const url = new URL(win.location.href);
      if (tag && tag !== ALL_TAG) {
        url.searchParams.set('tag', tag);
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

    const chips = Array.from(filterBar.querySelectorAll('[data-news-filter-chip]'));
    const statusEl = filterBar.querySelector('[data-news-filter-status]');
    const items = Array.from(feed.querySelectorAll('[data-news-item]'));
    const badges = Array.from(feed.querySelectorAll('[data-news-tag-badge]'));
    const paginationEl = root.querySelector('[data-news-pagination]');
    const loadMoreBtn = root.querySelector('[data-news-load-more]');

    const availableTags = new Set(
      chips
        .map((c) => c.getAttribute('data-news-filter-chip'))
        .filter((t) => t && t !== ALL_TAG)
    );

    const state = {
      activeTag: ALL_TAG,
      visibleCount: resolvedPageSize
    };

    const initialUrlTag = readTagFromLocation(win?.location);
    if (initialUrlTag && availableTags.has(initialUrlTag)) {
      state.activeTag = initialUrlTag;
    }

    function applyRender({ updateUrl = false } = {}) {
      const mode = getLangMode(root);

      filterBar.setAttribute('aria-label', formatCopy(mode, 'filterBarLabel'));

      // Update filter chips active state and "All" label
      chips.forEach((chip) => {
        const chipTag = chip.getAttribute('data-news-filter-chip');
        const isActive = chipTag === state.activeTag;
        chip.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        chip.classList.toggle('is-active', isActive);
        if (chipTag === ALL_TAG) {
          const labelEl = chip.querySelector('[data-news-i18n="all"]');
          if (labelEl) labelEl.textContent = formatCopy(mode, 'all');
        }
      });

      // Update inline tag badges active state
      badges.forEach((badge) => {
        const badgeTag = badge.getAttribute('data-news-tag-badge');
        const isActive = state.activeTag !== ALL_TAG && badgeTag === state.activeTag;
        badge.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        badge.classList.toggle('is-active', isActive);
      });

      // Filter and paginate items
      const matchingItems = [];
      items.forEach((item) => {
        const tags = parseItemTags(item);
        const matches = state.activeTag === ALL_TAG || tags.includes(state.activeTag);
        if (matches) {
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
        statusEl.textContent = state.activeTag === ALL_TAG
          ? formatCopy(mode, 'statusAll', { shown: shownCount, total: matchingItems.length })
          : formatCopy(mode, 'statusFiltered', {
            shown: shownCount,
            total: matchingItems.length,
            tag: state.activeTag
          });
      }

      if (updateUrl) {
        syncTagToUrl(state.activeTag, win);
      }
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

    function loadMore() {
      state.visibleCount += resolvedPageSize;
      applyRender({ updateUrl: false });
    }

    // Bind chip clicks
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const tag = chip.getAttribute('data-news-filter-chip');
        setFilter(tag, { toggleIfActive: tag !== ALL_TAG, updateUrl: true });
      });
    });

    // Bind inline tag badge clicks (event delegation on feed)
    feed.addEventListener('click', (event) => {
      const target = event.target?.closest?.('[data-news-tag-badge]');
      if (!target) return;
      const tag = target.getAttribute('data-news-tag-badge');
      setFilter(tag, { toggleIfActive: true, updateUrl: true });
    });

    // Bind Load More click
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        loadMore();
      });
    }

    // React to language toggle events
    if (win?.addEventListener) {
      win.addEventListener('xdlkc:lang-change', () => {
        applyRender({ updateUrl: false });
      });
      win.addEventListener('hashchange', () => {
        const hashTag = readTagFromLocation(win.location);
        if (hashTag && availableTags.has(hashTag)) {
          setFilter(hashTag, { toggleIfActive: false, updateUrl: false });
        } else if (!hashTag && state.activeTag !== ALL_TAG) {
          setFilter(ALL_TAG, { toggleIfActive: false, updateUrl: false });
        }
      });
    }

    // Initial render
    applyRender({ updateUrl: false });

    return {
      getState: () => ({ ...state }),
      setFilter,
      loadMore,
      refresh: () => applyRender({ updateUrl: false })
    };
  }

  return {
    DEFAULT_PAGE_SIZE,
    ALL_TAG,
    parseItemTags,
    readTagFromLocation,
    initNewsFilter
  };
});
