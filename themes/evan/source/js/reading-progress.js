(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ReadingProgress = factory();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  /**
   * Compute reading progress percentage.
   * - For non-scrollable pages (docHeight <= winHeight): return 100.
   * - Otherwise: round to integer and clamp to [0, 100].
   */
  function computeReadingProgressPercent({ scrollY, docHeight, winHeight }) {
    const totalScrollable = docHeight - winHeight;
    if (!Number.isFinite(totalScrollable) || totalScrollable <= 0) return 100;

    const raw = (scrollY / totalScrollable) * 100;
    return clamp(Math.round(raw), 0, 100);
  }

  /**
   * Given a target percent (0-100) and page dimensions, compute scrollTop to reach.
   * For non-scrollable pages, returns 0.
   */
  function computeScrollTopForPercent({ percent, docHeight, winHeight }) {
    const totalScrollable = Number(docHeight) - Number(winHeight);
    if (!Number.isFinite(totalScrollable) || totalScrollable <= 0) return 0;

    const p = clamp(Number(percent) || 0, 0, 100) / 100;
    return clamp(Math.round(totalScrollable * p), 0, Math.round(totalScrollable));
  }

  /**
   * Compute percent (0-100) from a pointer position.
   * `clientX` is the pointer's x in viewport coordinates.
   * `left` and `width` are the bar's boundingClientRect values.
   */
  function computePercentFromPointer({ clientX, left, width }) {
    const w = Number(width);
    if (!Number.isFinite(w) || w <= 0) return 0;

    const x = (Number(clientX) - Number(left)) / w;
    return clamp(Math.round(x * 100), 0, 100);
  }

  function initReadingProgress({
    containerSelector = '.reading-progress',
    barSelector = '.reading-progress-bar',
    labelSelector = '.reading-progress-label'
  } = {}) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    const bar = container.querySelector(barSelector) || document.querySelector(barSelector);
    if (!bar) return;

    // Ensure an always-visible percent label for better UX.
    let label = container.querySelector(labelSelector);
    if (!label) {
      label = document.createElement('span');
      label.className = labelSelector.replace(/^\./, '');
      label.setAttribute('aria-hidden', 'true');
      container.appendChild(label);
    }

    let scheduled = false;

    const update = () => {
      scheduled = false;
      const percent = computeReadingProgressPercent({
        scrollY: window.scrollY || window.pageYOffset || 0,
        docHeight: document.documentElement.scrollHeight || document.body.scrollHeight || 0,
        winHeight: window.innerHeight || document.documentElement.clientHeight || 0
      });
      bar.style.width = percent + '%';
      container.setAttribute('aria-valuenow', String(percent));
      container.setAttribute('aria-valuetext', `阅读进度 ${percent}%`);
      label.textContent = `${percent}%`;
    };

    const onScroll = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    // Seek-bar behavior: click jumps to the clicked progress position.
    // Keep the old "back to top" behavior on double click.
    container.addEventListener('click', (event) => {
      if (typeof window.scrollTo !== 'function') return;

      const rect = container.getBoundingClientRect?.();
      const percent = rect
        ? computePercentFromPointer({
          clientX: event?.clientX,
          left: rect.left,
          width: rect.width
        })
        : 0;

      const scrollTop = computeScrollTopForPercent({
        percent,
        docHeight: document.documentElement.scrollHeight || document.body.scrollHeight || 0,
        winHeight: window.innerHeight || document.documentElement.clientHeight || 0
      });

      try {
        window.scrollTo({ top: scrollTop, behavior: 'smooth' });
      } catch {
        window.scrollTo(0, scrollTop);
      }
    });

    container.addEventListener('dblclick', () => {
      if (typeof window.scrollTo !== 'function') return;
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        window.scrollTo(0, 0);
      }
    });

    update();
  }

  return {
    computeReadingProgressPercent,
    computeScrollTopForPercent,
    computePercentFromPointer,
    initReadingProgress
  };
});
