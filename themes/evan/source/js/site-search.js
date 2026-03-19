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

  // Search history (all queries, up to 10).
  const SEARCH_HISTORY_KEY = 'xdlkc:search-history';
  const SEARCH_HISTORY_LIMIT = 10;

  // Last query (persisted on close so reopen can restore the previous search).
  const LAST_QUERY_KEY = 'xdlkc:site-search:last';

  function safeJsonParse(raw, fallback) {
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function loadLastQuery(storage) {
    if (!storage?.getItem) return '';
    try {
      return String(storage.getItem(LAST_QUERY_KEY) || '').trim();
    } catch {
      return '';
    }
  }

  function saveLastQuery(storage, query) {
    if (!storage?.setItem) return;
    try {
      const q = String(query || '').trim();
      // Keep behavior simple: empty string clears.
      storage.setItem(LAST_QUERY_KEY, q);
    } catch {
      // ignore
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

  function loadSearchHistory(storage) {
    if (!storage?.getItem) return [];
    try {
      const raw = storage.getItem(SEARCH_HISTORY_KEY);
      const arr = safeJsonParse(raw, []);
      return Array.isArray(arr)
        ? arr.filter((item) => item && item.query && item.timestamp)
        : [];
    } catch {
      return [];
    }
  }

  function saveSearchHistory(storage, history) {
    if (!storage?.setItem) return;
    try {
      storage.setItem(SEARCH_HISTORY_KEY, JSON.stringify((history || []).slice(0, SEARCH_HISTORY_LIMIT)));
    } catch {
      // ignore
    }
  }

  function addSearchHistory(storage, query) {
    const q = String(query || '').trim();
    if (!q) return;

    const current = loadSearchHistory(storage);
    const timestamp = Date.now();

    // Remove existing query if present
    const filtered = current.filter((item) => item.query.toLowerCase() !== q.toLowerCase());

    // Add new query at the top
    const next = [{ query: q, timestamp }, ...filtered];

    saveSearchHistory(storage, next);
  }

  function clearSearchHistory(storage) {
    if (!storage?.removeItem) return;
    try {
      storage.removeItem(SEARCH_HISTORY_KEY);
    } catch {
      // ignore
    }
  }

  function formatRelativeTime(timestamp, langMode = 'en') {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) {
      return langMode === 'zh' ? '刚刚' : 'just now';
    } else if (minutes < 60) {
      return langMode === 'zh' ? `${minutes}分钟前` : `${minutes}m ago`;
    } else if (hours < 24) {
      return langMode === 'zh' ? `${hours}小时前` : `${hours}h ago`;
    } else if (days < 7) {
      return langMode === 'zh' ? `${days}天前` : `${days}d ago`;
    } else {
      const date = new Date(timestamp);
      const formatted = langMode === 'zh'
        ? `${date.getMonth() + 1}月${date.getDate()}日`
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return formatted;
    }
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
      .map((kw) => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&'));

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

    // Try content first, then excerpt, then raw
    const sources = [
      post?.content || '',
      post?.excerpt || '',
      post?.raw || ''
    ];

    let text = '';
    let sourceIndex = -1;

    // Find the first source that contains any keyword
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      const sourceText = stripHtmlToText(source, { document });
      if (!sourceText) continue;

      const lower = sourceText.toLowerCase();
      const hasMatch = keywords.some((kw) => kw && lower.includes(kw));
      if (hasMatch) {
        text = sourceText;
        sourceIndex = i;
        break;
      }
    }

    // If no match found, use the first available source
    if (!text && sources.length > 0) {
      text = stripHtmlToText(sources[0], { document });
    }

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

    // Category-only query mode: cat: / cats: / category: / categories: prefix.
    // Examples: "cat:life", "category: life notes".
    const catPrefixMatch = trimmed.match(/^(cats?|cat|categories?|category):\s*(.*)$/i);
    if (catPrefixMatch) {
      const q = String(catPrefixMatch[2] || '').trim();
      const tokensLower = splitKeywords(q).map((t) => String(t).toLowerCase()).filter(Boolean);
      return { mode: 'category', query: q, tokensLower };
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

    const categories = Array.isArray(raw.categories)
      ? raw.categories
      : (Array.isArray(raw.category) ? raw.category
        : (typeof raw.category === 'string' ? [raw.category]
          : (typeof raw.categories === 'string' ? [raw.categories] : [])));

    const date = formatPostDate(raw.date || raw.publishedAt || raw.published_at);

    const excerpt = typeof raw.excerpt === 'string' ? raw.excerpt : '';
    const content = typeof raw.content === 'string' ? raw.content : '';
    const rawText = typeof raw.raw === 'string' ? raw.raw : '';

    return {
      title,
      path,
      tags: tags.filter((t) => typeof t === 'string'),
      categories: categories.filter((c) => typeof c === 'string'),
      date,
      excerpt,
      content,
      raw: rawText
    };
  }

  function scorePost(post, queryTokensLower, { mode = 'all' } = {}) {
    const title = (post.title || '').toLowerCase();
    const tags = (post.tags || []).map((t) => String(t).toLowerCase());
    const categories = (post.categories || []).map((c) => String(c).toLowerCase());
    const content = stripHtmlToText(post.content || '', {}).toLowerCase();
    const excerpt = stripHtmlToText(post.excerpt || '', {}).toLowerCase();

    const tokens = Array.isArray(queryTokensLower)
      ? queryTokensLower.filter(Boolean)
      : [String(queryTokensLower || '').toLowerCase()].filter(Boolean);

    if (tokens.length === 0) return 0;

    const modeName = String(mode || 'all');
    const isTagOnly = modeName === 'tag';
    const isCategoryOnly = modeName === 'category';

    let score = 0;
    let matchedTokens = 0;
    let hasTitleMatch = false;
    let hasTagOrCategoryMatch = false;
    let contentScore = 0;
    let excerptScore = 0;
    let titleMatchedTokens = new Set();

    tokens.forEach((token) => {
      let matchedThis = false;

      if (!isTagOnly && !isCategoryOnly && title.includes(token)) {
        score += 10;
        matchedThis = true;
        hasTitleMatch = true;
        titleMatchedTokens.add(token);

        // More occurrences in title gets slightly higher.
        const titleMatches = title.split(token).length - 1;
        score += Math.min(5, titleMatches);
      }
      if (!isCategoryOnly) {
        tags.forEach((t) => {
          if (t.includes(token)) {
            // Tag match: slightly lower than title, but meaningful.
            score += isTagOnly ? 6 : 3;
            matchedThis = true;
            hasTagOrCategoryMatch = true;
          }
        });
      }

      categories.forEach((c) => {
        if (c.includes(token)) {
          // Category match: between title and tag.
          score += isCategoryOnly ? 8 : 4;
          matchedThis = true;
          hasTagOrCategoryMatch = true;
        }
      });

      // Content search: lower priority than title/tags/categories
      // Only count content matches for tokens NOT already matched in title
      if (!isTagOnly && !isCategoryOnly && !titleMatchedTokens.has(token) && content.includes(token)) {
        const contentMatches = content.split(token).length - 1;
        contentScore += Math.min(4, Math.max(2, contentMatches));
        matchedThis = true;
      }

      // Excerpt search: lowest priority, but still useful
      // Only count excerpt matches for tokens NOT already matched in title
      if (!isTagOnly && !isCategoryOnly && !titleMatchedTokens.has(token) && excerpt.includes(token)) {
        const excerptMatches = excerpt.split(token).length - 1;
        excerptScore += Math.min(2, Math.max(1, excerptMatches));
        matchedThis = true;
      }

      if (matchedThis) matchedTokens += 1;
    });

    // Cap content and excerpt scores to ensure they don't exceed reasonable limits
    contentScore = Math.min(contentScore, 4);
    excerptScore = Math.min(excerptScore, 2);

    // Add content and excerpt scores only if no higher-priority matches
    if (!hasTitleMatch && !hasTagOrCategoryMatch) {
      score += contentScore + excerptScore;
    } else if (hasTitleMatch || hasTagOrCategoryMatch) {
      // Bonus for matching more distinct keywords (only for title/tag/category matches)
      // But reduce or remove bonus when content/excerpt matches are also present
      const hasContentMatch = contentScore > 0 || excerptScore > 0;
      if (matchedTokens > 1) {
        const bonus = matchedTokens * 2;
        score += hasContentMatch ? 1 : bonus;
      }
      if (matchedTokens === tokens.length && tokens.length > 1) {
        const bonus = 6;
        score += hasContentMatch ? 0 : bonus;
      }
    }

    return score;
  }

  function findFirstContaining(list, tokensLower) {
    const arr = Array.isArray(list) ? list : [];
    const tokens = Array.isArray(tokensLower) ? tokensLower.filter(Boolean) : [];
    if (arr.length === 0 || tokens.length === 0) return '';

    for (const item of arr) {
      const raw = String(item || '').trim();
      if (!raw) continue;
      const lower = raw.toLowerCase();
      for (const token of tokens) {
        if (token && lower.includes(token)) return raw;
      }
    }

    return '';
  }

  function hasSubstringMatch(text, tokensLower) {
    const raw = String(text || '');
    const lower = raw.toLowerCase();
    const tokens = Array.isArray(tokensLower) ? tokensLower.filter(Boolean) : [];
    if (!lower || tokens.length === 0) return false;
    return tokens.some((t) => t && lower.includes(t));
  }

  function buildMatchBadgesHtml(post, parsed, { langMode = 'en', highlightQuery = '' } = {}) {
    if (!post || !parsed) return '';

    const mode = String(parsed.mode || 'all');
    const tokensLower = Array.isArray(parsed.tokensLower) ? parsed.tokensLower : [];
    if (tokensLower.length === 0) return '';

    const badges = [];

    const titleLabel = langMode === 'zh' ? '标题' : 'Title';

    // Requirement: tag-only query does not emit Title badge.
    // Requirement: category-only query does not emit Title or Tag badge.
    const allowTitle = mode !== 'tag' && mode !== 'category';
    const allowTag = mode !== 'category';

    if (allowTitle && hasSubstringMatch(post.title, tokensLower)) {
      badges.push({ kind: 'title', html: escapeHtml(titleLabel) });
    }

    if (allowTag) {
      const matchedTag = findFirstContaining(post.tags, tokensLower);
      if (matchedTag) {
        badges.push({
          kind: 'tag',
          html: `#${highlightText(matchedTag, highlightQuery)}`
        });
      }
    }

    const matchedCategory = findFirstContaining(post.categories, tokensLower);
    if (matchedCategory) {
      badges.push({
        kind: 'category',
        html: `${highlightText(matchedCategory, highlightQuery)}`
      });
    }

    const limited = badges.slice(0, 3);
    if (limited.length === 0) return '';

    return `
      <div class="site-search-match-badges" data-site-search-match-badges>
        ${limited
          .map((b) => `<span class="site-search-match-badge site-search-match-badge-${escapeHtml(b.kind)}">${b.html}</span>`)
          .join('')}
      </div>
    `.trim();
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

  function getAllTags(posts) {
    const display = new Map();

    (posts || []).forEach((raw) => {
      const post = normalizePost(raw);
      if (!post) return;
      (post.tags || []).forEach((tag) => {
        if (typeof tag !== 'string') return;
        const trimmed = tag.trim();
        if (!trimmed) return;
        const key = trimmed.toLowerCase();
        if (!display.has(key)) display.set(key, trimmed);
      });
    });

    return Array.from(display.values());
  }

  // Levenshtein edit distance (small strings only).
  function levenshtein(a, b) {
    const s = String(a || '');
    const t = String(b || '');
    if (s === t) return 0;
    if (!s) return t.length;
    if (!t) return s.length;

    const m = s.length;
    const n = t.length;

    // DP with two rows to save memory.
    let prev = new Array(n + 1);
    let curr = new Array(n + 1);

    for (let j = 0; j <= n; j++) prev[j] = j;

    for (let i = 1; i <= m; i++) {
      curr[0] = i;
      const sc = s.charCodeAt(i - 1);
      for (let j = 1; j <= n; j++) {
        const cost = sc === t.charCodeAt(j - 1) ? 0 : 1;
        curr[j] = Math.min(
          prev[j] + 1,      // deletion
          curr[j - 1] + 1,  // insertion
          prev[j - 1] + cost // substitution
        );
      }
      const tmp = prev;
      prev = curr;
      curr = tmp;
    }

    return prev[n];
  }

  function suggestSimilarTags(allTags, queryTokensLower, { limit = 8, maxDistance = 2 } = {}) {
    const tags = Array.isArray(allTags) ? allTags : [];
    const tokens = Array.isArray(queryTokensLower)
      ? queryTokensLower.map((t) => String(t || '').toLowerCase()).filter(Boolean)
      : [String(queryTokensLower || '').toLowerCase()].filter(Boolean);

    if (tags.length === 0 || tokens.length === 0) return [];

    // De-dupe tags case-insensitively while preserving first-seen casing.
    const uniq = [];
    const seen = new Set();
    tags.forEach((tag) => {
      const name = String(tag || '').trim();
      if (!name) return;
      const key = name.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      uniq.push(name);
    });

    const rows = [];

    uniq.forEach((tag) => {
      const lower = tag.toLowerCase();

      // Substring match if any token is contained.
      let hasSubstring = false;
      for (const token of tokens) {
        if (token && lower.includes(token)) {
          hasSubstring = true;
          break;
        }
      }

      if (hasSubstring) {
        rows.push({ tag, kind: 'substr', distance: 0 });
        return;
      }

      // Edit distance against the first token (best-effort).
      // This is intentionally lightweight and avoids heavy fuzzy-search libs.
      const token = tokens[0] || '';
      if (!token) return;

      // Quick prune for very different lengths.
      if (Math.abs(lower.length - token.length) > Math.max(3, maxDistance + 1)) return;

      const d = levenshtein(lower, token);
      if (d <= Math.max(0, Number(maxDistance) || 0)) {
        rows.push({ tag, kind: 'edit', distance: d });
      }
    });

    rows.sort((a, b) => {
      // substring first
      if (a.kind !== b.kind) return a.kind === 'substr' ? -1 : 1;
      // smaller distance first
      if (a.distance !== b.distance) return a.distance - b.distance;
      return String(a.tag).localeCompare(String(b.tag));
    });

    return rows
      .slice(0, Math.max(0, Number(limit) || 8))
      .map((r) => r.tag);
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

  function buildQuerySummaryHtml(parsedQuery, { query = '', resultCount = 0, langMode = 'en' } = {}) {
    const raw = String(parsedQuery?.query || query || '').trim();
    const count = Math.max(0, Number(resultCount) || 0);
    if (!raw) return '';

    const mode = String(parsedQuery?.mode || 'all');
    const label = mode === 'tag'
      ? (langMode === 'zh' ? '标签' : 'Tag')
      : mode === 'category'
        ? (langMode === 'zh' ? '分类' : 'Category')
        : (langMode === 'zh' ? '搜索' : 'Search');

    const countText = langMode === 'zh'
      ? `找到 ${count} 篇`
      : `Found ${count} ${count === 1 ? 'result' : 'results'}`;

    return `
      <div class="site-search-summary" data-site-search-summary>
        <span class="site-search-summary-kind">${escapeHtml(label)}</span>
        <strong class="site-search-summary-query">${escapeHtml(raw)}</strong>
        <span class="site-search-summary-sep" aria-hidden="true">·</span>
        <span class="site-search-summary-count">${escapeHtml(countText)}</span>
      </div>
    `.trim();
  }

  function renderResults({ root = document, query, results, suggestions, storage } = {}) {
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
      externalSearchTitle: langMode === 'zh' ? '站外搜索：' : 'Search the web:',
      externalSearchGoogle: 'Google',
      externalSearchBing: 'Bing',
      externalSearchDuckDuckGo: 'DuckDuckGo',
      foundCount: (n) => {
        const count = Math.max(0, Number(n) || 0);
        if (langMode === 'zh') return `找到 ${count} 篇`;
        return `Found ${count} ${count === 1 ? 'result' : 'results'}`;
      },
      copyLink: langMode === 'zh' ? '复制链接' : 'Copy link',
      copied: langMode === 'zh' ? '已复制' : 'Copied',
      copyLinkAria: langMode === 'zh' ? '复制该条结果链接' : 'Copy link for this result',
      toastCopied: langMode === 'zh' ? '链接已复制' : 'Link copied',
      toastCopyFailed: langMode === 'zh' ? '复制失败，请手动复制' : 'Copy failed, please copy manually',
      searchHistory: langMode === 'zh' ? '搜索历史' : 'Search history',
      clearHistory: langMode === 'zh' ? '清空' : 'Clear',
      clearHistoryAria: langMode === 'zh' ? '清除搜索历史' : 'Clear search history',
    };

    container.innerHTML = '';

    const q = String(query || '').trim();
    const highlightQuery = q.startsWith('#')
      ? q.replace(/^#+/, '').trim()
      : q;

    const parsedQuery = parseQuery(q);
    if (!q) {
      const topTags = suggestions && Array.isArray(suggestions.topTags)
        ? suggestions.topTags.filter(Boolean)
        : [];

      // Prefer recent queries from suggestions for backward compatibility
      const recentFromSuggestions = suggestions && Array.isArray(suggestions.recentQueries)
        ? suggestions.recentQueries.map((s) => String(s || '').trim()).filter(Boolean)
        : [];

      const recentHtml = recentFromSuggestions.length > 0
        ? `
          <div class="site-search-suggest" data-site-search-recent>
            <div class="site-search-suggest-title-row">
              <p class="site-search-suggest-title">${langMode === 'zh' ? '最近搜索' : 'Recent searches'}</p>
              <button class="site-search-clear-recent" type="button" data-site-search-clear-recent aria-label="${langMode === 'zh' ? '清空最近搜索' : 'Clear recent searches'}">${langMode === 'zh' ? '清空' : 'Clear'}</button>
            </div>
            <div class="site-search-suggest-chips">
              ${recentFromSuggestions
                .slice(0, 5)
                .map((kw) => {
                  const safe = escapeHtml(kw);
                  return `<button class="site-search-suggest-chip" type="button" data-site-search-keyword="${safe}">${safe}</button>`;
                })
                .join('')}
            </div>
          </div>
        `.trim()
        : '';

      // Load search history from localStorage
      const searchHistory = loadSearchHistory(storage);

      const historyHtml = searchHistory.length > 0
        ? `
          <div class="site-search-suggest" data-site-search-history>
            <div class="site-search-suggest-title-row">
              <p class="site-search-suggest-title">${i18n.searchHistory}</p>
              <button class="site-search-clear-history" type="button" data-site-search-history-clear aria-label="${i18n.clearHistoryAria}">${i18n.clearHistory}</button>
            </div>
            <div class="site-search-history-list">
              ${searchHistory
                .slice(0, 10)
                .map((item) => {
                  const query = escapeHtml(item.query);
                  const relativeTime = formatRelativeTime(item.timestamp, langMode);
                  return `<button class="site-search-history-item" type="button" data-site-search-history-item="${query}">${query}<span class="site-search-history-time">${relativeTime}</span></button>`;
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
                  return `<button class="site-search-suggest-chip" type="button" data-site-search-keyword="${safe}" data-site-search-keyword-mode="tag">${safe}</button>`;
                })
                .join('')}
            </div>
          </div>
        `.trim()
        : '';

      if (recentHtml || historyHtml || topTagsHtml) {
        container.innerHTML = `
          <div class="site-search-hint">${i18n.hintStart}</div>
          ${recentHtml}
          ${historyHtml}
          ${topTagsHtml}
        `.trim();
      }

      return;
    }

    if (!results || results.length === 0) {
      const querySummaryHtml = buildQuerySummaryHtml(parsedQuery, {
        query: q,
        resultCount: 0,
        langMode,
      });
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

      const allTags = suggestions && Array.isArray(suggestions.allTags)
        ? suggestions.allTags.filter(Boolean)
        : topTags;

      const similarTags = suggestSimilarTags(allTags, parsedQuery.tokensLower, { limit: 8, maxDistance: 2 });
      const didYouMean = langMode === 'zh' ? '你是不是想找：' : 'Did you mean:';
      const similarHtml = similarTags.length > 0
        ? `
          <div class="site-search-suggest" data-site-search-similar-tags>
            <p class="site-search-suggest-title">${didYouMean}</p>
            <div class="site-search-suggest-chips">
              ${similarTags
                .slice(0, 8)
                .map((tag) => {
                  const safe = escapeHtml(tag);
                  return `<button class="site-search-suggest-chip" type="button" data-site-search-keyword="${safe}" data-site-search-keyword-mode="tag">${highlightText(tag, highlightQuery)}</button>`;
                })
                .join('')}
            </div>
          </div>
        `.trim()
        : '';

      let host = '';
      try {
        host = root?.location?.host || '';
      } catch {
        host = '';
      }

      const sitePrefix = host ? `site:${host} ` : '';
      const externalEncoded = encodeURIComponent(`${sitePrefix}${q}`.trim());
      const externalHtml = q
        ? `
          <div class="site-search-suggest" data-site-search-external-links>
            <p class="site-search-suggest-title">${i18n.externalSearchTitle}</p>
            <div class="site-search-suggest-chips">
              <a class="site-search-suggest-chip site-search-external-link" href="https://www.google.com/search?q=${externalEncoded}" target="_blank" rel="noopener noreferrer" data-site-search-external-link="google">${i18n.externalSearchGoogle}</a>
              <a class="site-search-suggest-chip site-search-external-link" href="https://www.bing.com/search?q=${externalEncoded}" target="_blank" rel="noopener noreferrer" data-site-search-external-link="bing">${i18n.externalSearchBing}</a>
              <a class="site-search-suggest-chip site-search-external-link" href="https://duckduckgo.com/?q=${externalEncoded}" target="_blank" rel="noopener noreferrer" data-site-search-external-link="duckduckgo">${i18n.externalSearchDuckDuckGo}</a>
            </div>
          </div>
        `.trim()
        : '';

      container.innerHTML = `
        <div class="site-search-empty" data-site-search-empty>
          ${querySummaryHtml}
          <p>${i18n.noResult}: <strong>${escapeHtml(q)}</strong></p>
          ${chipsHtml}
          ${similarHtml}
          ${externalHtml}
          ${topTagsHtml}
          <ul>
            <li>${i18n.retryHint}</li>
            <li>${i18n.browseArchives}</li>
          </ul>
        </div>
      `.trim();
      return;
    }

    const summary = root.createElement('div');
    summary.innerHTML = buildQuerySummaryHtml(parsedQuery, {
      query: q,
      resultCount: results.length,
      langMode,
    });
    if (summary.firstElementChild) {
      container.appendChild(summary.firstElementChild);
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

      const categories = Array.isArray(post.categories) ? post.categories : [];
      const categoryHtml = categories.length
        ? `<div class="site-search-categories">${categories
          .slice(0, 3)
          .map((c) => {
            const raw = String(c || '').trim();
            const safeRaw = escapeHtml(raw);
            return `<button class="site-search-category" type="button" data-site-search-keyword="${safeRaw}" data-site-search-keyword-mode="category">${highlightText(raw, highlightQuery)}</button>`;
          })
          .join('')}</div>`
        : '';

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

      const badgesHtml = buildMatchBadgesHtml(post, parsedQuery, { langMode, highlightQuery });

      const formattedDate = formatPostDate(post.date);
      const metaHtml = formattedDate
        ? `<div class="site-search-meta">${escapeHtml(formattedDate)}</div>`
        : '';

      const snippet = makeSnippet(post, highlightQuery, { document: root });
      const snippetHtml = snippet
        ? `<div class="site-search-snippet">${snippet}</div>`
        : '';

      const href = `/${String(post.path || '').replace(/^\//, '')}`;
      const safeHref = escapeHtml(href);

      // Note: keep tags outside the <a> so chips can be clickable without triggering navigation.
      item.innerHTML = `
        <div class="site-search-row">
          <a class="site-search-link" href="${safeHref}">
            <div class="site-search-title">${highlightText(post.title, highlightQuery)}</div>
            ${badgesHtml}
            ${metaHtml}
            ${snippetHtml}
          </a>
          <button class="site-search-copy-link" type="button" data-site-search-copy-link="${safeHref}" aria-label="${escapeHtml(i18n.copyLinkAria)}">${escapeHtml(i18n.copyLink)}</button>
        </div>
        ${categoryHtml}
        ${tagHtml}
      `.trim();

      list.appendChild(item);
    });

    container.appendChild(list);
  }

  function resolveLangMode(document = globalThis.document) {
    return document?.documentElement?.dataset?.langMode === 'zh' ? 'zh' : 'en';
  }

  function ensureToast({ document = globalThis.document } = {}) {
    const existing = document?.querySelector?.('.code-copy-toast');
    if (existing) return existing;

    const toast = document.createElement('div');
    toast.className = 'code-copy-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body?.appendChild?.(toast);
    return toast;
  }

  function showToast({ toast, message, window = globalThis.window } = {}) {
    if (!toast) return;
    try {
      toast.textContent = String(message || '');
      toast.classList.add('is-visible');
      window?.clearTimeout?.(showToast._timer);
      showToast._timer = window?.setTimeout?.(() => {
        toast.classList.remove('is-visible');
      }, 1400);
    } catch {
      // ignore
    }
  }

  function fallbackCopy({ text, document = globalThis.document } = {}) {
    const area = document.createElement('textarea');
    area.value = String(text || '');
    area.setAttribute('readonly', 'readonly');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand && document.execCommand('copy');
    document.body.removeChild(area);
    if (!ok) throw new Error('copy failed');
  }

  async function copyText({ text, navigator = globalThis.navigator, document = globalThis.document } = {}) {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(String(text || ''));
      return;
    }
    fallbackCopy({ text, document });
  }

  function bindCopyLinkButtons({
    root = document,
    document = root,
    window = document?.defaultView || globalThis.window,
    navigator = window?.navigator || globalThis.navigator,
    location = window?.location || globalThis.location,
  } = {}) {
    const dialog = root.querySelector?.('[data-site-search-dialog]');
    if (!dialog) return;
    if (dialog.getAttribute?.('data-site-search-copy-bound') === '1') return;
    dialog.setAttribute?.('data-site-search-copy-bound', '1');

    const toast = ensureToast({ document });

    dialog.addEventListener('click', async (event) => {
      const target = event?.target;
      const btn = target?.closest?.('[data-site-search-copy-link]');
      if (!btn) return;

      // Avoid triggering navigation via surrounding <a>.
      try {
        event.preventDefault?.();
        event.stopPropagation?.();
      } catch {
        // ignore
      }

      const href = btn.getAttribute('data-site-search-copy-link');
      if (!href) return;

      // Build absolute URL from origin + path.
      let absolute = null;
      try {
        const origin = location?.origin || (location?.href ? new URL(location.href).origin : '');
        absolute = new URL(String(href), origin || 'https://example.invalid').href;
      } catch {
        absolute = String(href);
      }

      const langMode = resolveLangMode(document);
      const copiedText = langMode === 'zh' ? '已复制' : 'Copied';
      const copyTextLabel = langMode === 'zh' ? '复制链接' : 'Copy link';
      const toastCopied = langMode === 'zh' ? '链接已复制' : 'Link copied';
      const toastCopyFailed = langMode === 'zh' ? '复制失败，请手动复制' : 'Copy failed, please copy manually';

      try {
        await copyText({ text: absolute, navigator, document });
        showToast({ toast, message: toastCopied, window });

        // Transient button feedback.
        const prev = btn.textContent;
        btn.textContent = copiedText;
        window?.setTimeout?.(() => {
          try {
            // If user already changed language, reflect it.
            const lang2 = resolveLangMode(document);
            btn.textContent = lang2 === 'zh' ? '复制链接' : 'Copy link';
          } catch {
            btn.textContent = prev || copyTextLabel;
          }
        }, 1200);
      } catch {
        showToast({ toast, message: toastCopyFailed, window });
      }
    });
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

    try {
      saveLastQuery(storageRef, input?.value || '');
    } catch {
      // ignore
    }
    closeDialog(dialog);
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
      const placeholder = langMode === 'zh' ? '搜索标题 / 标签 / 分类…' : 'Search titles / tags / categories...';
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
    bindCopyLinkButtons({ root, document: root, window: win, navigator: win?.navigator, location });

    let cachedDb = null;
    let dbLoading = null;
    let cachedTopTags = null;
    let cachedAllTags = null;

    async function ensureDb() {
      if (cachedDb) return cachedDb;
      if (dbLoading) return dbLoading;
      dbLoading = fetchDbJson()
        .then((db) => {
          cachedDb = db;
          try {
            const posts = extractPostsFromDb(db);
            cachedTopTags = getTopTags(posts, { limit: 10, minCount: 2 });
            cachedAllTags = getAllTags(posts);
          } catch {
            cachedTopTags = null;
            cachedAllTags = null;
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

      const lastQuery = loadLastQuery(storageRef);
      input.value = lastQuery || '';

      renderResults({
        root,
        query: input.value,
        results: [],
        suggestions: {
          topTags: cachedTopTags || [],
          recentQueries: loadRecentQueries(storageRef)
        },
        storage: storageRef
      });
      resetSelection();

      // If we have a persisted query, trigger a best-effort search render.
      // This reuses the existing input handler (incl. ensureDb).
      if (input.value) {
        try {
          input.dispatchEvent(new win.Event('input', { bubbles: true }));
        } catch {

          // ignore
        }
      }
    }

    function handleClose() {
      try {
        saveLastQuery(storageRef, input?.value || '');
      } catch {
        // ignore
      }
      closeDialog(dialog);
    }

    root.querySelectorAll('[data-site-search-trigger]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        handleOpen();
        try {
          await ensureDb();
          renderResults({ root, query: '', results: [], suggestions: { topTags: cachedTopTags || [], allTags: cachedAllTags || [], recentQueries: loadRecentQueries(storageRef) }, storage: storageRef });
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
        : (mode === 'category' ? `cat:${keyword}` : keyword);

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
          },
          storage: storageRef
        });
        resetSelection();
        return;
      }

      // Clear search history.
      const clearHistory = event.target?.closest?.('[data-site-search-history-clear]');
      if (clearHistory) {
        clearSearchHistory(storageRef);
        if (input) input.value = '';
        renderResults({
          root,
          query: '',
          results: [],
          suggestions: {
            topTags: cachedTopTags || [],
            allTags: cachedAllTags || []
          },
          storage: storageRef
        });
        resetSelection();
        return;
      }

      // Click on search history item.
      const historyItem = event.target?.closest?.('[data-site-search-history-item]');
      if (historyItem) {
        try {
          event.preventDefault?.();
          event.stopPropagation?.();
        } catch {
          // ignore
        }

        const query = String(historyItem.getAttribute('data-site-search-history-item') || '').trim();
        if (query) {
          input.value = query;
          input.dispatchEvent(new win.Event('input', { bubbles: true }));
          input.focus?.();
        }
        return;
      }

      // Clicking a result link should also store the query and close the dialog.
      const resultLink = event.target?.closest?.('.site-search-link');
      if (resultLink) {
        addRecentQuery(storageRef, input?.value || '');
        handleClose();
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
          : (mode === 'category' ? `cat:${keyword}` : keyword);

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
          // Persist clear so next open doesn't restore the old query.
          saveLastQuery(storageRef, '');
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

      const key = String(event.key || '').toLowerCase();
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

      try {
        saveLastQuery(storageRef, input?.value || '');
      } catch {
        // ignore
      }
      closeDialog(dialog);
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

      const openInNewTab = !!(event.ctrlKey || event.metaKey);

      // Ctrl/Cmd+Enter: open in new tab (window.open) and close dialog.
      if (openInNewTab) {
        let href = '';

        if (selectedIndex >= 0) {
          const items = getResultItems();
          const item = items[selectedIndex];
          const link = item?.querySelector?.('.site-search-link');
          href = String(link?.href || link?.getAttribute?.('href') || '');
        } else {
          const link = dialog.querySelector?.('.site-search-link');
          href = String(link?.href || link?.getAttribute?.('href') || '');
        }

        if (!href) return;

        // Store query only when user actually opens a result.
        addRecentQuery(storageRef, input?.value || '');

        try {
          win?.open?.(href, '_blank', 'noopener');
        } catch {
          // ignore
        }

        try {
          event.preventDefault?.();
        } catch {
          // ignore
        }

        closeDialog(dialog);
        return;
      }

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
          renderResults({ root, query: '', results: [], suggestions: { topTags: cachedTopTags || [], allTags: cachedAllTags || [], recentQueries: loadRecentQueries(storageRef) }, storage: storageRef });
          resetSelection();
          return;
        }

        try {
          const db = await ensureDb();
          const posts = extractPostsFromDb(db);
          const results = searchPosts(posts, q);
          // Save to search history whenever a search is executed
          addSearchHistory(storageRef, q);
          renderResults({ root, query: q, results, suggestions: { topTags: cachedTopTags || [], allTags: cachedAllTags || [] }, storage: storageRef });
          resetSelection();
        } catch (err) {
          renderResults({ root, query: q, results: [], suggestions: { topTags: cachedTopTags || [], allTags: cachedAllTags || [] }, storage: storageRef });
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
    getAllTags,
    suggestSimilarTags,
    scorePost,
    searchPosts,
    ensureDialog,
    renderResults,
    bindCopyLinkButtons,
    computeScrollTopToReveal,
    openFirstResult,
    initSiteSearch,
    loadSearchHistory,
    addSearchHistory,
    clearSearchHistory
  };
});
