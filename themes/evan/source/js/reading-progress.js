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

    // Quick "back to top" affordance.
    container.addEventListener('click', () => {
      if (typeof window.scrollTo !== 'function') return;
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        // Older browsers may not support the object form.
        window.scrollTo(0, 0);
      }
    });

    update();
  }

  return {
    computeReadingProgressPercent,
    initReadingProgress
  };
});
