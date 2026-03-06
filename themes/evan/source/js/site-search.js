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
    const qEscaped = escapeHtml(q);

    // Highlight on escaped strings to avoid XSS.
    const re = new RegExp(qEscaped.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig');
    return escaped.replace(re, (match) => `<mark>${match}</mark>`);
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

  function scorePost(post, queryLower) {
    const title = (post.title || '').toLowerCase();
    const tags = (post.tags || []).map((t) => String(t).toLowerCase());

    let score = 0;
    if (title.includes(queryLower)) score += 10;
    tags.forEach((t) => {
      if (t.includes(queryLower)) score += 3;
    });

    // Tie-breaker: more occurrences in title gets slightly higher.
    if (score > 0) {
      const titleMatches = title.split(queryLower).length - 1;
      score += Math.min(5, titleMatches);
    }

    return score;
  }

  function searchPosts(posts, query) {
    const q = String(query || '').trim();
    if (!q) return [];

    const queryLower = q.toLowerCase();

    const normalized = (posts || [])
      .map(normalizePost)
      .filter(Boolean);

    const scored = normalized
      .map((post) => ({ post, score: scorePost(post, queryLower) }))
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
      container.innerHTML = `
        <div class="site-search-empty" data-site-search-empty>
          <p>无结果：<strong>${escapeHtml(q)}</strong></p>
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

  function initSiteSearch({ root = document } = {}) {
    if (!root?.querySelectorAll) return;

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
      if (event.target === dialog) handleClose();
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

    let debounce = null;
    input?.addEventListener('input', () => {
      window.clearTimeout(debounce);
      debounce = window.setTimeout(async () => {
        const q = String(input.value || '').trim();
        if (!q) {
          renderResults({ root, query: '', results: [] });
          return;
        }

        try {
          const db = await ensureDb();
          const posts = extractPostsFromDb(db);
          const results = searchPosts(posts, q);
          renderResults({ root, query: q, results });
        } catch (err) {
          renderResults({ root, query: q, results: [] });
        }
      }, 120);
    });
  }

  return {
    escapeHtml,
    highlightText,
    searchPosts,
    ensureDialog,
    renderResults,
    initSiteSearch
  };
});
