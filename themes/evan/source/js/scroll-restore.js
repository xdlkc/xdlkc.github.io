/* Remember and restore scroll position per-page.
 *
 * - Saves on pagehide (and beforeunload as a fallback)
 * - Restores on next visit when there is no location.hash
 * - Expires after 7 days
 *
 * Exposes window.ScrollRestore in browser; exports for Node tests.
 */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ScrollRestore = factory();
    // Do not auto-init here; layout bootstraps it to avoid duplicate inits.
  }
})(typeof self !== 'undefined' ? self : this, function() {
  const TTL_MS = 7 * 24 * 60 * 60 * 1000;
  const PREFIX = 'xdlkc:scroll:';

  function storageKey(pathname) {
    const path = String(pathname || '').trim() || '/';
    return `${PREFIX}${path}`;
  }

  function getStorage(win) {
    try {
      return win && win.localStorage;
    } catch {
      return null;
    }
  }

  function safeParse(json) {
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  function clampScrollY(y, { root, win } = {}) {
    const raw = Number(y);
    if (!Number.isFinite(raw)) return 0;

    const docEl = root?.documentElement;
    const scrollHeight = Number(docEl?.scrollHeight || 0);
    const innerHeight = Number(win?.innerHeight || 0);

    const max = Math.max(0, scrollHeight - innerHeight);
    return Math.min(Math.max(0, raw), max);
  }

  function saveScrollPosition({ root = document, win = globalThis, now = () => Date.now() } = {}) {
    const storage = getStorage(win);
    if (!storage) return false;

    const pathname = win?.location?.pathname || root?.location?.pathname;
    const key = storageKey(pathname);

    const y = Number(win?.scrollY || 0);
    const payload = { y: Math.max(0, y), ts: Number(now()) || 0 };

    try {
      storage.setItem(key, JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }

  function restoreScrollPosition({ root = document, win = globalThis, now = () => Date.now() } = {}) {
    const storage = getStorage(win);
    if (!storage) return false;

    const location = win?.location || root?.location;
    const pathname = location?.pathname;
    if (!pathname) return false;

    const body = root?.body;
    const isArticlePage = Boolean(body && body.classList && body.classList.contains('page-post-detail'));

    // Article detail pages should always start from the top by default.
    if (isArticlePage) {
      try {
        win.scrollTo(0, 0);
      } catch {
        // ignore
      }
      return false;
    }

    // If there's an in-page anchor, let the browser do the right thing.
    if (String(location?.hash || '').trim()) return false;

    const key = storageKey(pathname);
    const raw = storage.getItem(key);
    if (!raw) return false;

    const parsed = safeParse(raw);
    const ts = Number(parsed && parsed.ts);
    const y = Number(parsed && parsed.y);

    const age = (Number(now()) || 0) - ts;
    if (!Number.isFinite(ts) || !Number.isFinite(y) || age > TTL_MS) {
      // Best-effort cleanup.
      try {
        storage.removeItem(key);
      } catch {
        // ignore
      }
      return false;
    }

    const targetY = clampScrollY(y, { root, win });

    if (typeof win?.scrollTo !== 'function') return false;

    // Defer a tick to let fonts/layout settle.
    const run = () => win.scrollTo(0, targetY);
    if (typeof win?.requestAnimationFrame === 'function') {
      win.requestAnimationFrame(() => win.requestAnimationFrame(run));
    } else {
      setTimeout(run, 0);
    }

    return true;
  }

  function initScrollRestore({ root = document, win = globalThis, now = () => Date.now() } = {}) {
    if (!root || !win) return;
    if (win.__xdlkcScrollRestoreInited) return;
    win.__xdlkcScrollRestoreInited = true;

    // Restore once after load.
    restoreScrollPosition({ root, win, now });

    // Save on navigation away.
    const handler = () => saveScrollPosition({ root, win, now });
    win.addEventListener('pagehide', handler);
    win.addEventListener('beforeunload', handler);
  }

  return {
    TTL_MS,
    storageKey,
    saveScrollPosition,
    restoreScrollPosition,
    initScrollRestore
  };
});
