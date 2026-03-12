/* Back to top floating button.
 *
 * - Injects a fixed-position button at bottom-right.
 * - Hidden until scrollY >= threshold (default 420px).
 * - Click scrolls smoothly to top when supported.
 *
 * Enhancement:
 * - When visible, show reading progress percent in the button label.
 *
 * Exposes window.BackToTop in browser; exports for Node tests.
 */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.BackToTop = factory();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  const DEFAULT_THRESHOLD = 420;

  function shouldShowBackToTop({ scrollY, threshold = DEFAULT_THRESHOLD } = {}) {
    const y = Number(scrollY);
    const t = Number(threshold);
    if (!Number.isFinite(y) || !Number.isFinite(t)) return false;
    return y >= t;
  }

  function applyBackToTopVisibility(button, show) {
    if (!button?.setAttribute) return;
    if (show) button.removeAttribute('hidden');
    else button.setAttribute('hidden', 'hidden');
  }

  function ensureButton({ root = document } = {}) {
    const existing = root.querySelector?.('[data-back-to-top]');
    if (existing) return existing;

    const btn = root.createElement('button');
    btn.type = 'button';
    btn.className = 'back-to-top';
    btn.setAttribute('data-back-to-top', '');
    btn.setAttribute('aria-label', '返回顶部');
    btn.textContent = '↑';
    btn.setAttribute('hidden', 'hidden');

    root.body?.appendChild(btn);
    return btn;
  }

  function scrollToTop(win = globalThis) {
    try {
      if (typeof win?.scrollTo === 'function') {
        // Prefer smooth scroll; fall back if the browser rejects the options object.
        try {
          win.scrollTo({ top: 0, behavior: 'smooth' });
        } catch {
          win.scrollTo(0, 0);
        }
      }
    } catch {
      // ignore
    }
  }

  function clampNumber(value, { min = 0, max = 100 } = {}) {
    const n = Number(value);
    if (!Number.isFinite(n)) return min;
    return Math.min(max, Math.max(min, n));
  }

  function computeReadingPercent({ scrollY = 0, scrollHeight = 0, clientHeight = 0 } = {}) {
    const y = Math.max(0, Number(scrollY) || 0);
    const sh = Math.max(0, Number(scrollHeight) || 0);
    const ch = Math.max(0, Number(clientHeight) || 0);

    const maxScroll = sh - ch;
    if (maxScroll <= 0) return 0;

    const percent = Math.round((y / maxScroll) * 100);
    return clampNumber(percent, { min: 0, max: 100 });
  }

  function applyBackToTopProgressLabel(button, percent) {
    if (!button) return;
    const p = clampNumber(percent, { min: 0, max: 100 });
    try {
      button.textContent = `↑ ${p}%`;
    } catch {
      // ignore
    }
  }

  function initBackToTop({ threshold = DEFAULT_THRESHOLD, root = document } = {}) {
    if (!root?.querySelector) return;

    const win = root.defaultView || globalThis;
    const btn = ensureButton({ root });

    const update = () => {
      const y = win?.scrollY ?? win?.pageYOffset ?? 0;
      const show = shouldShowBackToTop({ scrollY: y, threshold });
      applyBackToTopVisibility(btn, show);

      if (!show) {
        // Keep it minimal while hidden.
        try { btn.textContent = '↑'; } catch { /* ignore */ }
        return;
      }

      // Compute reading progress percent from document metrics.
      const doc = root;
      const de = doc.documentElement;
      const body = doc.body;
      const scrollHeight = Math.max(
        Number(de?.scrollHeight || 0),
        Number(body?.scrollHeight || 0)
      );
      const clientHeight = Number(de?.clientHeight || win?.innerHeight || 0);
      const percent = computeReadingPercent({ scrollY: y, scrollHeight, clientHeight });
      applyBackToTopProgressLabel(btn, percent);
    };

    btn.addEventListener('click', () => scrollToTop(win));

    let scheduled = false;
    const onScroll = () => {
      if (scheduled) return;
      scheduled = true;
      (win.requestAnimationFrame || win.setTimeout)(() => {
        scheduled = false;
        update();
      }, 16);
    };

    win.addEventListener?.('scroll', onScroll, { passive: true });
    win.addEventListener?.('resize', onScroll, { passive: true });

    update();
  }

  return {
    DEFAULT_THRESHOLD,
    shouldShowBackToTop,
    applyBackToTopVisibility,
    scrollToTop,
    computeReadingPercent,
    applyBackToTopProgressLabel,
    initBackToTop
  };
});
