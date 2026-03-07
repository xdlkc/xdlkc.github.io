/* Back to top floating button.
 *
 * - Injects a fixed-position button at bottom-right.
 * - Hidden until scrollY >= threshold (default 420px).
 * - Click scrolls smoothly to top when supported.
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

  function initBackToTop({ threshold = DEFAULT_THRESHOLD, root = document } = {}) {
    if (!root?.querySelector) return;

    const win = root.defaultView || globalThis;
    const btn = ensureButton({ root });

    const update = () => {
      const y = win?.scrollY ?? win?.pageYOffset ?? 0;
      const show = shouldShowBackToTop({ scrollY: y, threshold });
      applyBackToTopVisibility(btn, show);
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
    initBackToTop
  };
});
