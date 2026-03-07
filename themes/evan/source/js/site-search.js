/* Lightweight site search modal.
 *
 * Data source: /db.json (generated/checked-in)
 * Searches: title + tags
 * Highlights: <mark>
 *
 * Exposes window.SiteSearch in browser; exports for Node tests.
 */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SiteSearch = factory();
    root.SiteSearch?.initSiteSearch?.();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  const DB_URL = '/db.json';

  function escapeHtml(input) {
    return String(input || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function highlightText(text, query) {
    const raw = String(text || '');
    const q = String(query || '').trim();
    if (!q) return escapeHtml(raw);

    const escaped = escapeHtml(raw);

    const keywords = splitKeywords(q)
      .map((kw) => escapeHtml(kw))
      .filter(Boolean);

    if (keywords.length === 0) return escaped;

    // Highlight on escaped strings to avoid XSS.
    // For multi-keyword queries, highlight each keyword.
    const parts = keywords
      .slice()
      // Longer first to reduce partial-overlap surprises.
      .sort((a, b) => b.length - a.length)
      .map((kw) => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    const re = new RegExp(`(${parts.join('|')})`, 'ig');
    return escaped.replace(re, (match) => `<mark>${match}</mark>`);
  }

  function splitKeywords(query) {
    const q = String(query || '').trim();
    if (!q) return [];

    const tokens = q
      .split(/\s+/)
      .map((t) => String(t || '').trim())
      .filter(Boolean);

    // Dedupe while keeping order.
    const uniq = [];
    const seen = new Set();
    tokens.forEach((t) => {
      const key = t.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      uniq.push(t);
    });

    return uniq.slice(0, 6);
  }

  function normalizePost(raw) {
    if (!raw) return null;

    const title = typeof raw.title === 'string' ? raw.title : '';
    const path = typeof raw.path === 'string' ? raw.path : '';

    const tags = Array.isArray(raw.tags)
      ? raw.tags
      : (Array.isArray(raw.tag) ? raw.tag : []);

    return {
      title,
      path,
      tags: tags.filter((t) => typeof t === 'string')
    };
  }

  function scorePost(post, queryTokensLower) {
    const title = (post.title || '').toLowerCase();
    const tags = (post.tags || []).map((t) => String(t).toLowerCase());

    const tokens = Array.isArray(queryTokensLower)
      ? queryTokensLower.filter(Boolean)
      : [String(queryTokensLower || '').toLowerCase()].filter(Boolean);

    if (tokens.length === 0) return 0;

    let score = 0;
    let matchedTokens = 0;

    tokens.forEach((token) => {
      let matchedThis = false;

      if (title.includes(token)) {
        score += 10;
        matchedThis = true;

        // More occurrences in title gets slightly higher.
        const titleMatches = title.split(token).length - 1;
        score += Math.min(5, titleMatches);
      }

      tags.forEach((t) => {
        if (t.includes(token)) {
          score += 3;
          matchedThis = true;
        }
      });

      if (matchedThis) matchedTokens += 1;
    });

    // Bonus for matching more distinct keywords.
    if (matchedTokens > 1) score += matchedTokens * 2;
    if (matchedTokens === tokens.length && tokens.length > 1) score += 6;

    return score;
  }

  function searchPosts(posts, query) {
    const q = String(query || '').trim();
    if (!q) return [];

    const tokensLower = splitKeywords(q).map((t) => String(t).toLowerCase());
    if (tokensLower.length === 0) return [];

    const normalized = (posts || [])
      .map(normalizePost)
      .filter(Boolean);

    const scored = normalized
      .map((post) => ({ post, score: scorePost(post, tokensLower) }))
      .filter((row) => row.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        // Stable-ish: alphabetical by title
        return String(a.post.title).localeCompare(String(b.post.title));
      })
      .map((row) => row.post);

    return scored;
  }

  function ensureDialog({ root = document } = {}) {
    const existing = root.querySelector?.('[data-site-search-dialog]');
    if (existing) return existing;

    const overlay = root.createElement('div');
    overlay.className = 'site-search-overlay';
    overlay.setAttribute('data-site-search-dialog', '');
    overlay.setAttribute('aria-hidden', 'true');

    overlay.innerHTML = `
      <div class="site-search-modal" role="dialog" aria-modal="true" aria-label="站内搜索">
        <div class="site-search-header">
          <input class="site-search-input" data-site-search-input type="search" placeholder="搜索标题 / 标签…" autocomplete="off" />
          <button class="site-search-close" data-site-search-close type="button" aria-label="关闭">关闭</button>
        </div>
        <div class="site-search-body">
          <div class="site-search-hint">输入关键词开始搜索</div>
          <div class="site-search-results" data-site-search-results></div>
        </div>
      </div>
    `.trim();

    root.body?.appendChild(overlay);

    return overlay;
  }

  function openDialog(dialog) {
    if (!dialog) return;
    dialog.setAttribute('aria-hidden', 'false');
    dialog.classList.add('is-open');

    const input = dialog.querySelector('[data-site-search-input]');
    input?.focus?.();
  }

  function closeDialog(dialog) {
    if (!dialog) return;
    dialog.setAttribute('aria-hidden', 'true');
    dialog.classList.remove('is-open');
  }

  function renderResults({ root = document, query, results } = {}) {
    const dialog = root.querySelector?.('[data-site-search-dialog]');
    const container = dialog?.querySelector?.('[data-site-search-results]');
    if (!container) return;

    container.innerHTML = '';

    const q = String(query || '').trim();
    if (!q) return;

    if (!results || results.length === 0) {
      const keywords = splitKeywords(q);
      const hasKeywordChips = keywords.length > 1;

      const chipsHtml = hasKeywordChips
        ? `
          <div class="site-search-suggest" data-site-search-suggest>
            <p class="site-search-suggest-title">试试拆分关键词：</p>
            <div class="site-search-suggest-chips">
              ${keywords
                .map((kw) => {
                  const safe = escapeHtml(kw);
                  return `<button class="site-search-suggest-chip" type="button" data-site-search-keyword="${safe}">${safe}</button>`;
                })
                .join('')}
            </div>
          </div>
        `.trim()
        : '';

      container.innerHTML = `
        <div class="site-search-empty" data-site-search-empty>
          <p>无结果：<strong>${escapeHtml(q)}</strong></p>
          ${chipsHtml}
          <ul>
            <li>试试缩短关键词或换个说法</li>
            <li>去 <a href="/archives/">Archives</a> 按时间浏览</li>
          </ul>
        </div>
      `.trim();
      return;
    }

    const list = root.createElement('ul');
    list.className = 'site-search-list';

    results.slice(0, 12).forEach((post) => {
      const item = root.createElement('li');
      item.className = 'site-search-item';

      const tags = Array.isArray(post.tags) ? post.tags : [];
      const tagHtml = tags.length
        ? `<div class="site-search-tags">${tags
          .slice(0, 6)
          .map((t) => `<span class="site-search-tag">${highlightText(t, q)}</span>`)
          .join('')}</div>`
        : '';

      item.innerHTML = `
        <a class="site-search-link" href="/${String(post.path || '').replace(/^\//, '')}">
          <div class="site-search-title">${highlightText(post.title, q)}</div>
          ${tagHtml}
        </a>
      `.trim();

      list.appendChild(item);
    });

    container.appendChild(list);
  }

  async function fetchDbJson() {
    const res = await fetch(DB_URL, { credentials: 'same-origin' });
    if (!res.ok) throw new Error(`db fetch failed: ${res.status}`);
    return await res.json();
  }

  function extractPostsFromDb(db) {
    if (!db) return [];

    // Try a few common shapes.
    if (Array.isArray(db.posts)) return db.posts;
    if (Array.isArray(db)) return db;
    if (Array.isArray(db.data)) return db.data;

    return [];
  }

  function isEditableTarget(target) {
    const el = target && target.nodeType === 1 ? target : null;
    if (!el) return false;

    if (el.isContentEditable) return true;

    const tag = String(el.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;

    // If an element is inside an editable container.
    const editableAncestor = el.closest?.('[contenteditable=""],[contenteditable="true"]');
    if (editableAncestor) return true;

    return false;
  }

  function openFirstResult({ root = document, location = globalThis.location } = {}) {
    const dialog = root.querySelector?.('[data-site-search-dialog]');
    if (!dialog?.classList?.contains?.('is-open')) return false;

    const link = dialog.querySelector?.('.site-search-link');
    const href = link?.href || link?.getAttribute?.('href');
    if (!href) return false;

    if (location?.assign) {
      location.assign(href);
    } else if (location) {
      location.href = href;
    }

    return true;
  }

  function initSiteSearch({ root = document, location = globalThis.location } = {}) {
    if (!root?.querySelectorAll) return;

    // In Node test environment, `window` may be undefined. Prefer the document's defaultView.
    const win = root.defaultView || globalThis;

    const dialog = ensureDialog({ root });
    const input = dialog.querySelector('[data-site-search-input]');
    const closeBtn = dialog.querySelector('[data-site-search-close]');

    let cachedDb = null;
    let dbLoading = null;

    async function ensureDb() {
      if (cachedDb) return cachedDb;
      if (dbLoading) return dbLoading;
      dbLoading = fetchDbJson()
        .then((db) => {
          cachedDb = db;
          return db;
        })
        .finally(() => {
          dbLoading = null;
        });
      return dbLoading;
    }

    function handleOpen() {
      openDialog(dialog);
      input.value = '';
      renderResults({ root, query: '', results: [] });
      resetSelection();
    }

    function handleClose() {
      closeDialog(dialog);
    }

    root.querySelectorAll('[data-site-search-trigger]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        handleOpen();
        try {
          await ensureDb();
        } catch (err) {
          const container = dialog.querySelector('[data-site-search-results]');
          if (container) {
            container.innerHTML = `
              <div class="site-search-empty" data-site-search-empty>
                <p>搜索索引加载失败</p>
                <ul>
                  <li>你可以稍后重试</li>
                  <li>或直接去 <a href="/archives/">Archives</a></li>
                </ul>
              </div>
            `.trim();
          }
        }
      });
    });

    closeBtn?.addEventListener('click', handleClose);

    dialog.addEventListener('click', (event) => {
      // Click outside modal closes.
      if (event.target === dialog) {
        handleClose();
        return;
      }

      // Keyword chip: replace query and trigger search.
      const chip = event.target?.closest?.('[data-site-search-keyword]');
      if (chip) {
        const keyword = chip.getAttribute('data-site-search-keyword') || '';
        input.value = keyword;
        input.dispatchEvent(new win.Event('input', { bubbles: true }));
      }
    });

    root.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && dialog.classList.contains('is-open')) {
        handleClose();
        return;
      }

      // Keyboard shortcuts: /, Cmd+K, Ctrl+K
      if (dialog.classList.contains('is-open')) return;
      if (isEditableTarget(event.target)) return;

      const key = String(event.key || '');
      const isSlash = key === '/';
      const isK = key.toLowerCase() === 'k';
      const isMetaOrCtrlK = isK && (event.metaKey || event.ctrlKey);

      if (isSlash || isMetaOrCtrlK) {
        event.preventDefault();
        handleOpen();
        // Best-effort prefetch of DB index.
        ensureDb().catch(() => {});
      }
    });

    let selectedIndex = -1;

    function getResultItems() {
      return Array.from(dialog.querySelectorAll('.site-search-item'));
    }

    function clearSelection() {
      getResultItems().forEach((item) => item.classList.remove('is-selected'));
    }

    function applySelection(index) {
      const items = getResultItems();
      if (items.length === 0) {
        selectedIndex = -1;
        return;
      }

      const next = Math.max(0, Math.min(items.length - 1, index));
      selectedIndex = next;
      items.forEach((item, i) => {
        if (i === next) item.classList.add('is-selected');
        else item.classList.remove('is-selected');
      });
    }

    function resetSelection() {
      selectedIndex = -1;
      clearSelection();
    }

    function openSelectedResult() {
      const items = getResultItems();
      const item = selectedIndex >= 0 ? items[selectedIndex] : null;
      const link = item?.querySelector?.('.site-search-link');
      const href = link?.href || link?.getAttribute?.('href');
      if (!href) return false;

      if (location?.assign) {
        location.assign(href);
      } else if (location) {
        location.href = href;
      }

      return true;
    }

    input?.addEventListener('keydown', (event) => {
      if (event.isComposing) return;

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        const items = getResultItems();
        if (items.length === 0) return;

        event.preventDefault();

        if (event.key === 'ArrowDown') {
          applySelection(selectedIndex + 1);
        } else {
          applySelection(selectedIndex <= 0 ? 0 : selectedIndex - 1);
        }

        return;
      }

      if (event.key !== 'Enter') return;

      const didOpen = selectedIndex >= 0
        ? openSelectedResult()
        : openFirstResult({ root, location });

      if (didOpen) {
        event.preventDefault();
      }
    });

    let debounce = null;
    input?.addEventListener('input', () => {
      win.clearTimeout?.(debounce);
      debounce = win.setTimeout(async () => {
        const q = String(input.value || '').trim();
        if (!q) {
          renderResults({ root, query: '', results: [] });
          resetSelection();
          return;
        }

        try {
          const db = await ensureDb();
          const posts = extractPostsFromDb(db);
          const results = searchPosts(posts, q);
          renderResults({ root, query: q, results });
          resetSelection();
        } catch (err) {
          renderResults({ root, query: q, results: [] });
          resetSelection();
        }
      }, 120);
    });
  }

  return {
    escapeHtml,
    highlightText,
    splitKeywords,
    searchPosts,
    ensureDialog,
    renderResults,
    openFirstResult,
    initSiteSearch
  };
});
