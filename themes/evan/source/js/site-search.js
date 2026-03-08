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

  function stripHtmlToText(input, { document } = {}) {
    const html = String(input || '');
    if (!html) return '';

    // Prefer DOM when available (better entity decoding, robust tag stripping).
    const doc = document || globalThis.document;
    if (doc?.createElement) {
      try {
        const div = doc.createElement('div');
        div.innerHTML = html;
        return String(div.textContent || '').replace(/\s+/g, ' ').trim();
      } catch {
        // fall through
      }
    }

    // Fallback: naive tag strip.
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function makeSnippet(post, query, { document } = {}) {
    const q = String(query || '').trim();
    const keywords = splitKeywords(q).map((t) => String(t).toLowerCase());

    const source = post
      ? (post.excerpt || post.content || post.raw || '')
      : '';

    const text = stripHtmlToText(source, { document });
    if (!text) return '';

    const maxLen = 90;
    const before = 24;
    const after = 56;

    let start = 0;
    let end = Math.min(text.length, maxLen);

    if (keywords.length > 0) {
      const lower = text.toLowerCase();
      let hit = -1;

      for (const kw of keywords) {
        if (!kw) continue;
        const idx = lower.indexOf(kw);
        if (idx >= 0 && (hit < 0 || idx < hit)) hit = idx;
      }

      if (hit >= 0) {
        start = Math.max(0, hit - before);
        end = Math.min(text.length, hit + after);
      }
    }

    let snippet = text.slice(start, end).trim();
    if (!snippet) return '';

    const prefixEllipsis = start > 0 ? '…' : '';
    const suffixEllipsis = end < text.length ? '…' : '';

    snippet = `${prefixEllipsis}${snippet}${suffixEllipsis}`;

    // Highlight using existing mechanism (safe HTML output).
    return highlightText(snippet, q);
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

  function formatPostDate(input) {
    const raw = String(input || '').trim();
    if (!raw) return '';

    // Fast path for ISO-ish strings.
    const m = raw.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];

    try {
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) return '';
      return d.toISOString().slice(0, 10);
    } catch {
      return '';
    }
  }

  function normalizePost(raw) {
    if (!raw) return null;

    const title = typeof raw.title === 'string' ? raw.title : '';
    const path = typeof raw.path === 'string' ? raw.path : '';

    const tags = Array.isArray(raw.tags)
      ? raw.tags
      : (Array.isArray(raw.tag) ? raw.tag : []);

    const date = formatPostDate(raw.date || raw.publishedAt || raw.published_at);

    const excerpt = typeof raw.excerpt === 'string' ? raw.excerpt : '';
    const content = typeof raw.content === 'string' ? raw.content : '';
    const rawText = typeof raw.raw === 'string' ? raw.raw : '';

    return {
      title,
      path,
      tags: tags.filter((t) => typeof t === 'string'),
      date,
      excerpt,
      content,
      raw: rawText
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

  function getTopTags(posts, { limit = 10, minCount = 2 } = {}) {
    const counts = new Map();
    const display = new Map();

    (posts || []).forEach((raw) => {
      const post = normalizePost(raw);
      if (!post) return;
      (post.tags || []).forEach((tag) => {
        if (typeof tag !== 'string') return;
        const trimmed = tag.trim();
        if (!trimmed) return;
        const key = trimmed.toLowerCase();
        counts.set(key, (counts.get(key) || 0) + 1);
        if (!display.has(key)) display.set(key, key);
      });
    });

    const rows = Array.from(counts.entries())
      .filter(([, count]) => count >= Number(minCount || 0))
      .map(([key, count]) => ({ key, count, name: display.get(key) || key }));

    rows.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return String(a.name).localeCompare(String(b.name));
    });

    return rows
      .slice(0, Math.max(0, Number(limit) || 10))
      .map((row) => row.name);
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
        <div class="site-search-body" data-site-search-scroll>
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

    // Remember the current focus so we can restore it when closing.
    // This improves keyboard UX without implementing a full focus-trap.
    try {
      const doc = dialog.ownerDocument || globalThis.document;
      const active = doc?.activeElement;
      dialog._xdlkcPrevFocus = active && active !== doc?.body ? active : null;
    } catch {
      dialog._xdlkcPrevFocus = null;
    }

    dialog.setAttribute('aria-hidden', 'false');
    dialog.classList.add('is-open');

    const input = dialog.querySelector('[data-site-search-input]');
    input?.focus?.();
  }

  function toNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  // Keep a scrollable container positioned so an item stays visible.
  // Coordinates are relative to the scroll content of the container.
  function computeScrollTopToReveal({
    containerScrollTop = 0,
    containerHeight = 0,
    itemTop = 0,
    itemHeight = 0,
  } = {}) {
    const scrollTop = toNumber(containerScrollTop, 0);
    const height = Math.max(0, toNumber(containerHeight, 0));
    const top = Math.max(0, toNumber(itemTop, 0));
    const h = Math.max(0, toNumber(itemHeight, 0));

    if (height <= 0) return scrollTop;

    const viewTop = scrollTop;
    const viewBottom = scrollTop + height;
    const itemBottom = top + h;

    if (top < viewTop) return top;
    if (itemBottom > viewBottom) return Math.max(0, itemBottom - height);

    return scrollTop;
  }

  function closeDialog(dialog) {
    if (!dialog) return;
    dialog.setAttribute('aria-hidden', 'true');
    dialog.classList.remove('is-open');

    // Best-effort focus restore.
    try {
      const prev = dialog._xdlkcPrevFocus;
      const doc = dialog.ownerDocument || globalThis.document;
      dialog._xdlkcPrevFocus = null;

      if (prev && typeof prev.focus === 'function') {
        const connected = prev.isConnected
          ? prev.isConnected
          : (doc?.contains ? doc.contains(prev) : true);
        if (connected) prev.focus();
      }
    } catch {
      // ignore
    }
  }

  function renderResults({ root = document, query, results, suggestions } = {}) {
    const dialog = root.querySelector?.('[data-site-search-dialog]');
    const container = dialog?.querySelector?.('[data-site-search-results]');
    if (!container) return;

    container.innerHTML = '';

    const q = String(query || '').trim();
    if (!q) {
      const topTags = suggestions && Array.isArray(suggestions.topTags)
        ? suggestions.topTags.filter(Boolean)
        : [];

      if (topTags.length > 0) {
        container.innerHTML =                     `
          <div class="site-search-hint">输入关键词开始搜索，或点击热门标签：</div>
          <div class="site-search-suggest" data-site-search-top-tags>
            <p class="site-search-suggest-title">热门标签</p>
            <div class="site-search-suggest-chips">
              ${topTags
                .slice(0, 10)
                .map((tag) => {
                  const safe = escapeHtml(tag);
                  return `<button class=\"site-search-suggest-chip\" type=\"button\" data-site-search-keyword=\"${safe}\">${safe}</button>`;
                })
                .join('')}
            </div>
          </div>
        `.trim();
      }

      return;
    }

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

      const topTags = suggestions && Array.isArray(suggestions.topTags)
        ? suggestions.topTags.filter(Boolean)
        : [];

      const topTagsHtml = topTags.length > 0
        ? `
          <div class="site-search-suggest" data-site-search-top-tags>
            <p class="site-search-suggest-title">也可以试试热门标签：</p>
            <div class="site-search-suggest-chips">
              ${topTags
                .slice(0, 10)
                .map((tag) => {
                  const safe = escapeHtml(tag);
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
          ${topTagsHtml}
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

      const formattedDate = formatPostDate(post.date);
      const metaHtml = formattedDate
        ? `<div class="site-search-meta">${escapeHtml(formattedDate)}</div>`
        : '';

      const snippet = makeSnippet(post, q, { document: root });
      const snippetHtml = snippet
        ? `<div class="site-search-snippet">${snippet}</div>`
        : '';

      item.innerHTML = `
        <a class="site-search-link" href="/${String(post.path || '').replace(/^\//, '')}">
          <div class="site-search-title">${highlightText(post.title, q)}</div>
          ${metaHtml}
          ${snippetHtml}
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

    // Hexo db.json (e.g. hexo-generator-searchdb) often emits:
    // { meta: {...}, models: { Post: [...], Tag: [...], ... } }
    if (db.models && Array.isArray(db.models.Post)) return db.models.Post;

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
    let cachedTopTags = null;

    async function ensureDb() {
      if (cachedDb) return cachedDb;
      if (dbLoading) return dbLoading;
      dbLoading = fetchDbJson()
        .then((db) => {
          cachedDb = db;
          try {
            const posts = extractPostsFromDb(db);
            cachedTopTags = getTopTags(posts, { limit: 10, minCount: 2 });
          } catch {
            cachedTopTags = null;
          }
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
      renderResults({ root, query: '', results: [], suggestions: { topTags: cachedTopTags || [] } });
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
          renderResults({ root, query: '', results: [], suggestions: { topTags: cachedTopTags || [] } });
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

    function getItemTopWithinContainer(container, item) {
      if (!container || !item) return 0;

      try {
        const c = container.getBoundingClientRect?.();
        const r = item.getBoundingClientRect?.();
        if (c && r && Number.isFinite(c.top) && Number.isFinite(r.top)) {
          return (r.top - c.top) + (container.scrollTop || 0);
        }
      } catch {
        // ignore
      }

      // Fallback: offsetTop is relative to offsetParent; good enough for our modal.
      return toNumber(item.offsetTop, 0);
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

      // Keep selection visible within the modal scroll container.
      try {
        const selectedItem = items[next];
        const scrollContainer = dialog.querySelector?.('[data-site-search-scroll]')
          || dialog.querySelector?.('[data-site-search-results]');

        const height = scrollContainer?.clientHeight || 0;
        if (scrollContainer && height > 0) {
          const itemTop = getItemTopWithinContainer(scrollContainer, selectedItem);
          const itemHeight = selectedItem?.offsetHeight || 0;
          const nextScrollTop = computeScrollTopToReveal({
            containerScrollTop: scrollContainer.scrollTop || 0,
            containerHeight: height,
            itemTop,
            itemHeight,
          });
          if (Number.isFinite(nextScrollTop)) scrollContainer.scrollTop = nextScrollTop;
        }
      } catch {
        // ignore
      }
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
          renderResults({ root, query: '', results: [], suggestions: { topTags: cachedTopTags || [] } });
          resetSelection();
          return;
        }

        try {
          const db = await ensureDb();
          const posts = extractPostsFromDb(db);
          const results = searchPosts(posts, q);
          renderResults({ root, query: q, results, suggestions: { topTags: cachedTopTags || [] } });
          resetSelection();
        } catch (err) {
          renderResults({ root, query: q, results: [], suggestions: { topTags: cachedTopTags || [] } });
          resetSelection();
        }
      }, 120);
    });
  }

  return {
    escapeHtml,
    highlightText,
    stripHtmlToText,
    makeSnippet,
    splitKeywords,
    getTopTags,
    searchPosts,
    ensureDialog,
    renderResults,
    computeScrollTopToReveal,
    openFirstResult,
    initSiteSearch
  };
});
