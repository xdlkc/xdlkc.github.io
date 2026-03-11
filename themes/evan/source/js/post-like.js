/* Post Like button (local-only, per-pathname) with persistence.
 *
 * Usage (post.ejs):
 *   - Add a button with [data-post-like]
 *   - Include /js/post-like.js (defer)
 *   - Call window.PostLike?.initPostLike()
 */

const STORAGE_KEY = 'xdlkc:post-likes:v1';

function resolveLang(document) {
  const mode = document?.documentElement?.dataset?.langMode
    || document?.documentElement?.getAttribute?.('data-lang-mode');
  return mode === 'zh' ? 'zh' : 'en';
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function readAll(storage) {
  try {
    const raw = storage?.getItem?.(STORAGE_KEY);
    const json = raw ? safeJsonParse(raw) : null;
    return json && typeof json === 'object' ? json : {};
  } catch {
    return {};
  }
}

function writeAll(storage, data) {
  try {
    storage?.setItem?.(STORAGE_KEY, JSON.stringify(data || {}));
  } catch {
    // ignore
  }
}

function clampCount(n) {
  const x = Number.isFinite(n) ? n : 0;
  return Math.max(0, Math.round(x));
}

function ensureEntry(all, pathname) {
  if (!pathname) return { liked: false, count: 0 };
  const cur = all[pathname];
  if (!cur || typeof cur !== 'object') return { liked: false, count: 0 };
  return {
    liked: !!cur.liked,
    count: clampCount(cur.count),
  };
}

function label({ liked, count, lang }) {
  const c = clampCount(count);
  if (lang === 'zh') {
    return liked ? `👍 已赞 (${c})` : `👍 赞 (${c})`;
  }
  return liked ? `👍 Liked (${c})` : `👍 Like (${c})`;
}

function applyToButton(button, { liked, count, lang }) {
  if (!button) return;
  try {
    button.setAttribute('type', 'button');
    button.setAttribute('aria-pressed', liked ? 'true' : 'false');
    button.textContent = label({ liked, count, lang });
  } catch {
    // ignore
  }
}

function initPostLike({
  window = globalThis.window,
  document = globalThis.document,
  storage = globalThis.localStorage,
  location = globalThis.location,
} = {}) {
  if (!document?.querySelector) return;

  const btn = document.querySelector('[data-post-like]');
  if (!btn) return;
  if (btn.dataset?.postLikeBound === '1') {
    // still sync UI from storage (e.g. external mutations)
  } else {
    if (btn.dataset) btn.dataset.postLikeBound = '1';

    btn.addEventListener('click', () => {
      const pathname = location?.pathname || '/';
      const all = readAll(storage);
      const cur = ensureEntry(all, pathname);

      const nextLiked = !cur.liked;
      const nextCount = clampCount(cur.count + (nextLiked ? 1 : -1));

      all[pathname] = { liked: nextLiked, count: nextCount };
      writeAll(storage, all);

      applyToButton(btn, { liked: nextLiked, count: nextCount, lang: resolveLang(document) });
    });

    // Update labels on language change.
    window?.addEventListener?.('xdlkc:lang-change', () => {
      const pathname = location?.pathname || '/';
      const all = readAll(storage);
      const cur = ensureEntry(all, pathname);
      applyToButton(btn, { ...cur, lang: resolveLang(document) });
    });
  }

  // Initial render from storage.
  const pathname = location?.pathname || '/';
  const all = readAll(storage);
  const cur = ensureEntry(all, pathname);
  applyToButton(btn, { ...cur, lang: resolveLang(document) });
}

// Auto-expose for browsers.
if (typeof window !== 'undefined') {
  window.PostLike = window.PostLike || {};
  window.PostLike.initPostLike = initPostLike;
}

// Exports for tests.
if (typeof module !== 'undefined') {
  module.exports = {
    STORAGE_KEY,
    initPostLike,
  };
}
