/* Lightweight site search modal.
 *
 * Data source: /search.json (generated) with /db.json fallback
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
  const DB_URLS = ['/search.json', '/db.json'];

  // Recent search history (stored when user actually opens a result).
  const RECENT_STORAGE_KEY = 'xdlkc:site-search:recent';
  const RECENT_LIMIT = 5;

  function safeJsonParse(raw, fallback) {
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function loadRecentQueries(storage) {
    if (!storage?.getItem) return [];
    try {
      const raw = storage.getItem(RECENT_STORAGE_KEY);
      const arr = safeJsonParse(raw, []);
      return Array.isArray(arr)
        ? arr.map((s) => String(s || '').trim()).filter(Boolean).slice(0, RECENT_LIMIT)
        : [];
    } catch {
      return [];
    }
  }

  function saveRecentQueries(storage, queries) {
    if (!storage?.setItem) return;
    try {
      storage.setItem(RECENT_STORAGE_KEY, JSON.stringify((queries || []).slice(0, RECENT_LIMIT)));
    } catch {
      // ignore
    }
  }

  function addRecentQuery(storage, query) {
    const q = String(query || '').trim();
    if (!q) return;

    const current = loadRecentQueries(storage);
    const next = [q];

    const seen = new Set([q.toLowerCase()]);
    current.forEach((item) => {
      const v = String(item || '').trim();
      if (!v) return;
      const key = v.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      next.push(v);
    });

    saveRecentQueries(storage, next.slice(0, RECENT_LIMIT));
  }

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
    const highlightQuery = q.startsWith('#')
      ? q.replace(/^#+/, '').trim()
      : q;
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

  // Parse user query and support a lightweight tag-only mode.
  // Supported syntax:
  //   - #tag
  //   - tag:foo / tags:foo (case-insensitive)
  function parseQuery(query) {
    const raw = String(query || '');
    const trimmed = raw.trim();
    if (!trimmed) return { mode: 'all', query: '', tokensLower: [] };

    // Tag-only query mode: leading '#'.
    if (trimmed.startsWith('#')) {
      const q = trimmed.replace(/^#+/, '').trim();
      const tokensLower = splitKeywords(q).map((t) => String(t).toLowerCase()).filter(Boolean);
      return { mode: 'tag', query: q, tokensLower };
    }

    // Tag-only query mode: tag: / tags: prefix.
    // Examples: "tag:foo", "tags: foo bar".
    const tagPrefixMatch = trimmed.match(/^(tags?):\s*(.*)$/i);
    if (tagPrefixMatch) {
      const q = String(tagPrefixMatch[2] || '').trim();
      const tokensLower = splitKeywords(q).map((t) => String(t).toLowerCase()).filter(Boolean);
      return { mode: 'tag', query: q, tokensLower };
    }

    const tokensLower = splitKeywords(trimmed).map((t) => String(t).toLowerCase()).filter(Boolean);
    return { mode: 'all', query: trimmed, tokensLower };
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

  function scorePost(post, queryTokensLower, { mode = 'all' } = {}) {
    const title = (post.title || '').toLowerCase();
    const tags = (post.tags || []).map((t) => String(t).toLowerCase());

    const tokens = Array.isArray(queryTokensLower)
      ? queryTokensLower.filter(Boolean)
      : [String(queryTokensLower || '').toLowerCase()].filter(Boolean);

    if (tokens.length === 0) return 0;

    const isTagOnly = String(mode || 'all') === 'tag';

    let score = 0;
    let matchedTokens = 0;

    tokens.forEach((token) => {
      let matchedThis = false;

      if (!isTagOnly && title.includes(token)) {
        score += 10;
        matchedThis = true;

        // More occurrences in title gets slightly higher.
        const titleMatches = title.split(token).length - 1;
        score += Math.min(5, titleMatches);
      }

      tags.forEach((t) => {
        if (t.includes(token)) {
          // Tag match: slightly lower than title, but meaningful.
          score += isTagOnly ? 6 : 3;
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
    const parsed = parseQuery(query);
    const tokensLower = parsed.tokensLower;
    if (tokensLower.length === 0) return [];

    const normalized = (posts || [])
      .map(normalizePost)
      .filter(Boolean);

    const scored = normalized
      .map((post) => ({ post, score: scorePost(post, tokensLower, { mode: parsed.mode }) }))
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

    const langMode = root?.documentElement?.dataset?.langMode === 'zh' ? 'zh' : 'en';
    const i18n = {
      dialogLabel: langMode === 'zh' ? '站内搜索' : 'Site Search',
      placeholder: langMode === 'zh' ? '搜索标题 / 标签…' : 'Search titles / tags...',
      close: langMode === 'zh' ? '关闭' : 'Close',
      hintStart: langMode === 'zh' ? '输入关键词开始搜索' : 'Type to start searching',
    };

    const overlay = root.createElement('div');
    overlay.className = 'site-search-overlay';
    overlay.setAttribute('data-site-search-dialog', '');
    overlay.setAttribute('aria-hidden', 'true');

    overlay.innerHTML = `
      <div class="site-search-modal" role="dialog" aria-modal="true" aria-label="${i18n.dialogLabel}">
        <div class="site-search-header">
          <input class="site-search-input" data-site-search-input type="search" placeholder="${i18n.placeholder}" autocomplete="off" />
          <button class="site-search-close" data-site-search-close type="button" aria-label="${i18n.close}">${i18n.close}</button>
        </div>
        <div class="site-search-body" data-site-search-scroll>
          <div class="site-search-hint">${i18n.hintStart}</div>
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
    const langMode = root?.documentElement?.dataset?.langMode === 'zh' ? 'zh' : 'en';
    const i18n = {
      hintStart: langMode === 'zh' ? '输入关键词开始搜索，或点击热门标签：' : 'Type to search, or pick a popular tag:',
      topTags: langMode === 'zh' ? '热门标签' : 'Popular Tags',
      trySplit: langMode === 'zh' ? '试试拆分关键词：' : 'Try splitting keywords:',
      tryTopTags: langMode === 'zh' ? '也可以试试热门标签：' : 'You can also try popular tags:',
      noResult: langMode === 'zh' ? '无结果' : 'No results',
      retryHint: langMode === 'zh' ? '试试缩短关键词或换个说法' : 'Try shorter keywords or another phrase',
      browseArchives: langMode === 'zh' ? '去 <a href="/archives/">归档</a> 按时间浏览' : 'Browse by time in <a href="/archives/">Archives</a>',
      foundCount: (n) => {
        const count = Math.max(0, Number(n) || 0);
        if (langMode === 'zh') return `找到 ${count} 篇`;
        return `Found ${count} ${count === 1 ? 'result' : 'results'}`;
      }
    };

    container.innerHTML = '';

    const q = String(query || '').trim();
    const highlightQuery = q.startsWith('#')
      ? q.replace(/^#+/, '').trim()
      : q;
    if (!q) {
      const topTags = suggestions && Array.isArray(suggestions.topTags)
        ? suggestions.topTags.filter(Boolean)
        : [];

      const recent = suggestions && Array.isArray(suggestions.recentQueries)
        ? suggestions.recentQueries.map((s) => String(s || '').trim()).filter(Boolean)
        : [];

      const recentTitle = langMode === 'zh' ? '最近搜索' : 'Recent searches';
      const recentClearText = langMode === 'zh' ? '清空' : 'Clear';
      const recentClearAria = langMode === 'zh' ? '清空最近搜索' : 'Clear recent searches';

      const recentHtml = recent.length > 0
        ? `
          <div class="site-search-suggest" data-site-search-recent>
            <div class="site-search-suggest-title-row">
              <p class="site-search-suggest-title">${recentTitle}</p>
              <button class="site-search-clear-recent" type="button" data-site-search-clear-recent aria-label="${recentClearAria}">${recentClearText}</button>
            </div>
            <div class="site-search-suggest-chips">
              ${recent
                .slice(0, 5)
                .map((kw) => {
                  const safe = escapeHtml(kw);
                  return `<button class=\"site-search-suggest-chip\" type=\"button\" data-site-search-keyword=\"${safe}\">${safe}</button>`;
                })
                .join('')}
            </div>
          </div>
        `.trim()
        : '';

      const topTagsHtml = topTags.length > 0
        ? `
          <div class="site-search-suggest" data-site-search-top-tags>
            <p class="site-search-suggest-title">${i18n.topTags}</p>
            <div class="site-search-suggest-chips">
              ${topTags
                .slice(0, 10)
                .map((tag) => {
                  const safe = escapeHtml(tag);
                  return `<button class=\"site-search-suggest-chip\" type=\"button\" data-site-search-keyword=\"${safe}\" data-site-search-keyword-mode=\"tag\">${safe}</button>`;
                })
                .join('')}
            </div>
          </div>
        `.trim()
        : '';

      if (recentHtml || topTagsHtml) {
        container.innerHTML = `
          <div class="site-search-hint">${i18n.hintStart}</div>
          ${recentHtml}
          ${topTagsHtml}
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
            <p class="site-search-suggest-title">${i18n.trySplit}</p>
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
            <p class="site-search-suggest-title">${i18n.tryTopTags}</p>
            <div class="site-search-suggest-chips">
              ${topTags
                .slice(0, 10)
                .map((tag) => {
                  const safe = escapeHtml(tag);
                  return `<button class="site-search-suggest-chip" type="button" data-site-search-keyword="${safe}" data-site-search-keyword-mode="tag">${safe}</button>`;
                })
                .join('')}
            </div>
          </div>
        `.trim()
        : '';

      container.innerHTML = `
        <div class="site-search-empty" data-site-search-empty>
          <p>${i18n.noResult}: <strong>${escapeHtml(q)}</strong></p>
          ${chipsHtml}
          ${topTagsHtml}
          <ul>
            <li>${i18n.retryHint}</li>
            <li>${i18n.browseArchives}</li>
          </ul>
        </div>
      `.trim();
      return;
    }

    const count = root.createElement('div');
    count.className = 'site-search-count';
    count.setAttribute('data-site-search-count', '');
    count.textContent = i18n.foundCount(results.length);
    container.appendChild(count);

    const list = root.createElement('ul');
    list.className = 'site-search-list';

    results.slice(0, 12).forEach((post) => {
      const item = root.createElement('li');
      item.className = 'site-search-item';

      const tags = Array.isArray(post.tags) ? post.tags : [];
      const tagHtml = tags.length
        ? `<div class="site-search-tags">${tags
          .slice(0, 6)
          .map((t) => {
            const raw = String(t || '').trim();
            const safeRaw = escapeHtml(raw);
            return `<button class="site-search-tag" type="button" data-site-search-keyword="${safeRaw}" data-site-search-keyword-mode="tag">${highlightText(raw, highlightQuery)}</button>`;
          })
          .join('')}</div>`
        : '';

      const formattedDate = formatPostDate(post.date);
      const metaHtml = formattedDate
        ? `<div class="site-search-meta">${escapeHtml(formattedDate)}</div>`
        : '';

      const snippet = makeSnippet(post, highlightQuery, { document: root });
      const snippetHtml = snippet
        ? `<div class="site-search-snippet">${snippet}</div>`
        : '';

      // Note: keep tags outside the <a> so chips can be clickable without triggering navigation.
      item.innerHTML = `
        <a class="site-search-link" href="/${String(post.path || '').replace(/^\//, '')}">
          <div class="site-search-title">${highlightText(post.title, highlightQuery)}</div>
          ${metaHtml}
          ${snippetHtml}
        </a>
        ${tagHtml}
      `.trim();

      list.appendChild(item);
    });

    container.appendChild(list);
  }

  async function fetchDbJson() {
    let lastStatus = null;

    for (const url of DB_URLS) {
      try {
        const res = await fetch(url, { credentials: 'same-origin' });
        lastStatus = res.status;
        if (res.ok) return await res.json();
      } catch {
        // try next source
      }
    }

    throw new Error(`db fetch failed: ${lastStatus || 'network'}`);
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

  function openFirstResult({ root = document, location = globalThis.location, onBeforeNavigate } = {}) {
    const dialog = root.querySelector?.('[data-site-search-dialog]');
    if (!dialog?.classList?.contains?.('is-open')) return false;

    const link = dialog.querySelector?.('.site-search-link');
    const href = link?.href || link?.getAttribute?.('href');
    if (!href) return false;

    try {
      if (typeof onBeforeNavigate === 'function') onBeforeNavigate(href);
    } catch {
      // ignore
    }

    if (location?.assign) {
      location.assign(href);
    } else if (location) {
      location.href = href;
    }

    return true;
  }

  function initSiteSearch({ root = document, location = globalThis.location, storage } = {}) {
    if (!root?.querySelectorAll) return;
    if (root.__siteSearchBound) return;
    root.__siteSearchBound = true;

    // In Node test environment, `window` may be undefined. Prefer the document's defaultView.
    const win = root.defaultView || globalThis;

    const storageRef = storage
      || win?.localStorage
      || root.defaultView?.localStorage
      || globalThis.localStorage;

    const dialog = ensureDialog({ root });
    const input = dialog.querySelector('[data-site-search-input]');
    const closeBtn = dialog.querySelector('[data-site-search-close]');

    function applyDialogI18n() {
      const langMode = root?.documentElement?.dataset?.langMode === 'zh' ? 'zh' : 'en';
      const dialogLabel = langMode === 'zh' ? '站内搜索' : 'Site Search';
      const placeholder = langMode === 'zh' ? '搜索标题 / 标签…' : 'Search titles / tags...';
      const closeText = langMode === 'zh' ? '关闭' : 'Close';
      const hintStart = langMode === 'zh' ? '输入关键词开始搜索' : 'Type to start searching';
      dialog.querySelector('.site-search-modal')?.setAttribute('aria-label', dialogLabel);
      if (input) input.setAttribute('placeholder', placeholder);
      if (closeBtn) {
        closeBtn.textContent = closeText;
        closeBtn.setAttribute('aria-label', closeText);
      }
      const hint = dialog.querySelector('.site-search-hint');
      if (hint) hint.textContent = hintStart;
    }

    applyDialogI18n();

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
      renderResults({
        root,
        query: '',
        results: [],
        suggestions: {
          topTags: cachedTopTags || [],
          recentQueries: loadRecentQueries(storageRef)
        }
      });
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
          renderResults({ root, query: '', results: [], suggestions: { topTags: cachedTopTags || [], recentQueries: loadRecentQueries(storageRef) } });
        } catch (err) {
          const container = dialog.querySelector('[data-site-search-results]');
          if (container) {
            const langMode = root?.documentElement?.dataset?.langMode === 'zh' ? 'zh' : 'en';
            const loadFail = langMode === 'zh' ? '搜索索引加载失败' : 'Failed to load search index';
            const retryLater = langMode === 'zh' ? '你可以稍后重试' : 'You can retry later';
            const archivesHint = langMode === 'zh'
              ? '或直接去 <a href="/archives/">归档</a>'
              : 'Or jump to <a href="/archives/">Archives</a>';
            container.innerHTML = `
              <div class="site-search-empty" data-site-search-empty>
                <p>${loadFail}</p>
                <ul>
                  <li>${retryLater}</li>
                  <li>${archivesHint}</li>
                </ul>
              </div>
            `.trim();
          }
        }
      });
    });

    closeBtn?.addEventListener('click', handleClose);

    // Page keyword chips (outside the modal): open the dialog and run a search.
    // Usage: <button data-site-search-open data-site-search-keyword="AI" data-site-search-keyword-mode="tag">AI</button>
    root.addEventListener('click', (event) => {
      const chip = event.target?.closest?.('[data-site-search-open][data-site-search-keyword]');
      if (!chip) return;

      // If the chip is inside the modal, let the modal's own handler deal with it.
      if (dialog?.contains?.(chip)) return;

      // Avoid hijacking clicks while typing in editable fields.
      if (isEditableTarget(event.target)) return;

      try {
        event.preventDefault?.();
        event.stopPropagation?.();
      } catch {
        // ignore
      }

      const keyword = String(chip.getAttribute('data-site-search-keyword') || '').trim();
      const mode = String(chip.getAttribute('data-site-search-keyword-mode') || '').trim();
      if (!keyword) return;

      openDialog(dialog);

      const next = mode === 'tag'
        ? (keyword.startsWith('#') ? keyword : `#${keyword}`)
        : keyword;

      input.value = next;
      input.dispatchEvent(new win.Event('input', { bubbles: true }));
      input.focus?.();

      // Best-effort warm-up: don't block UI.
      ensureDb().catch(() => {});
    });

    dialog.addEventListener('click', (event) => {
      // Click outside modal closes.
      if (event.target === dialog) {
        handleClose();
        return;
      }

      // Clear recent searches.
      const clearRecent = event.target?.closest?.('[data-site-search-clear-recent]');
      if (clearRecent) {
        saveRecentQueries(storageRef, []);
        if (input) input.value = '';
        renderResults({
          root,
          query: '',
          results: [],
          suggestions: {
            topTags: cachedTopTags || [],
            recentQueries: []
          }
        });
        resetSelection();
        return;
      }

      // Clicking a result link should also store the query.
      const resultLink = event.target?.closest?.('.site-search-link');
      if (resultLink) {
        addRecentQuery(storageRef, input?.value || '');
        return;
      }

      // Keyword chip: replace query and trigger search.
      const chip = event.target?.closest?.('[data-site-search-keyword]');
      if (chip) {
        try {
          event.preventDefault?.();
          event.stopPropagation?.();
        } catch {
          // ignore
        }

        const keyword = String(chip.getAttribute('data-site-search-keyword') || '').trim();
        const mode = String(chip.getAttribute('data-site-search-keyword-mode') || '').trim();

        const next = mode === 'tag'
          ? (keyword.startsWith('#') ? keyword : `#${keyword}`)
          : keyword;

        input.value = next;
        input.dispatchEvent(new win.Event('input', { bubbles: true }));
      }
    });

    root.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && dialog.classList.contains('is-open')) {
        // UX: Esc clears current query first; a second Esc closes the dialog.
        const activeInput = dialog.querySelector?.('[data-site-search-input]');
        const value = String(activeInput?.value || '');
        if (value.trim()) {
          try {
            event.preventDefault();
            event.stopPropagation();
          } catch {
            // ignore
          }

          activeInput.value = '';
          // Trigger an input event to refresh suggestions to the "empty query" state.
          try {
            const doc = dialog.ownerDocument || root;
            const win = doc?.defaultView || globalThis;
            activeInput.dispatchEvent(new win.Event('input', { bubbles: true }));
          } catch {
            // ignore
          }

          activeInput.focus?.();
          return;
        }

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

    if (win?.addEventListener) {
      win.addEventListener('xdlkc:lang-change', () => {
        applyDialogI18n();
      });
    }

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

      // Store query only when user actually navigates.
      addRecentQuery(storageRef, input?.value || '');

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
        : openFirstResult({
            root,
            location,
            onBeforeNavigate: () => addRecentQuery(storageRef, input?.value || '')
          });

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
          renderResults({ root, query: '', results: [], suggestions: { topTags: cachedTopTags || [], recentQueries: loadRecentQueries(storageRef) } });
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
    parseQuery,
    getTopTags,
    searchPosts,
    ensureDialog,
    renderResults,
    computeScrollTopToReveal,
    openFirstResult,
    initSiteSearch
  };
});
