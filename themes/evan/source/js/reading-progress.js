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

  function computeNextPercentFromKey({
    key,
    currentPercent,
    step = 5,
  } = {}) {
    const p = clamp(Number(currentPercent) || 0, 0, 100);
    const s = Math.max(1, Number(step) || 5);

    switch (String(key || '')) {
      case 'ArrowLeft':
        return clamp(p - s, 0, 100);
      case 'ArrowRight':
        return clamp(p + s, 0, 100);
      case 'Home':
        return 0;
      case 'End':
        return 100;
      default:
        return p;
    }
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

    // Make it keyboard-focusable for a11y / power users.
    try {
      if (!container.hasAttribute('tabindex')) container.setAttribute('tabindex', '0');
    } catch {
      // ignore
    }

    let scheduled = false;
    let currentPercent = 0;

    const getTotalReadingMinutes = () => {
      const raw = container.getAttribute('data-reading-minutes');
      const minutes = Number(raw);
      return Number.isFinite(minutes) && minutes > 0 ? minutes : 0;
    };

    const computeRemainingMinutes = ({ totalMinutes, percent } = {}) => {
      const total = Number(totalMinutes);
      const p = clamp(Number(percent) || 0, 0, 100);
      if (!Number.isFinite(total) || total <= 0) return 0;
      const remaining = Math.ceil(total * (1 - p / 100));
      return Math.max(0, remaining);
    };

    const formatRemainingText = (remaining) => {
      const mode = document.documentElement?.dataset?.langMode;
      const isEn = mode === 'en';
      if (isEn) return `~${remaining} min left`;
      return `剩余 ${remaining} 分钟`;
    };

    const formatValueText = ({ percent, remaining, hasEstimate }) => {
      const mode = document.documentElement?.dataset?.langMode;
      const isEn = mode === 'en';
      if (!hasEstimate) return isEn ? `Reading progress ${percent}%` : `阅读进度 ${percent}%`;
      if (isEn) return `Reading progress ${percent}%, ~${remaining} min left`;
      return `阅读进度 ${percent}%，剩余 ${remaining} 分钟`;
    };

    const update = () => {
      scheduled = false;
      const percent = computeReadingProgressPercent({
        scrollY: window.scrollY || window.pageYOffset || 0,
        docHeight: document.documentElement.scrollHeight || document.body.scrollHeight || 0,
        winHeight: window.innerHeight || document.documentElement.clientHeight || 0
      });
      currentPercent = percent;

      const totalMinutes = getTotalReadingMinutes();
      const hasEstimate = totalMinutes > 0;
      const remaining = hasEstimate
        ? computeRemainingMinutes({ totalMinutes, percent })
        : 0;

      bar.style.width = percent + '%';
      container.setAttribute('aria-valuenow', String(percent));
      container.setAttribute('aria-valuetext', formatValueText({ percent, remaining, hasEstimate }));
      label.textContent = hasEstimate
        ? `${percent}% · ${formatRemainingText(remaining)}`
        : `${percent}%`;
    };

    const onScroll = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    // Keyboard seek: ArrowLeft/ArrowRight/Home/End when the bar is focused.
    container.addEventListener('keydown', (event) => {
      const key = event?.key;
      if (!key) return;

      // Ignore when modifiers are held (avoid conflicting shortcuts).
      if (event.altKey || event.ctrlKey || event.metaKey) return;

      const next = computeNextPercentFromKey({
        key,
        currentPercent,
        step: 5,
      });

      if (next === currentPercent) return;

      // Only handle keys we support.
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(String(key))) return;

      try {
        event.preventDefault();
      } catch {
        // ignore
      }

      const scrollTop = computeScrollTopForPercent({
        percent: next,
        docHeight: document.documentElement.scrollHeight || document.body.scrollHeight || 0,
        winHeight: window.innerHeight || document.documentElement.clientHeight || 0
      });

      try {
        window.scrollTo({ top: scrollTop, behavior: 'smooth' });
      } catch {
        window.scrollTo(0, scrollTop);
      }
    });

    const seekToPointer = (event, { behavior = 'smooth' } = {}) => {
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
        window.scrollTo({ top: scrollTop, behavior });
      } catch {
        window.scrollTo(0, scrollTop);
      }
    };

    // Seek-bar behavior: click jumps to the clicked progress position.
    // Keep the old "back to top" behavior on double click.
    container.addEventListener('click', (event) => {
      seekToPointer(event, { behavior: 'smooth' });
    });

    // Drag-to-seek (desktop): hold mouse and drag to scrub.
    let isDragging = false;

    const stopDragging = () => {
      if (!isDragging) return;
      isDragging = false;
      container.classList.remove('is-dragging');

      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('blur', onWindowBlur);
    };

    const onMouseMove = (event) => {
      if (!isDragging) return;
      seekToPointer(event, { behavior: 'auto' });
    };

    const onMouseUp = () => {
      stopDragging();
    };

    const onWindowBlur = () => {
      stopDragging();
    };

    container.addEventListener('mousedown', (event) => {
      // Only left click.
      if (event && typeof event.button === 'number' && event.button !== 0) return;
      if (typeof window.scrollTo !== 'function') return;

      isDragging = true;
      container.classList.add('is-dragging');
      seekToPointer(event, { behavior: 'auto' });

      // Listen on window so dragging continues even if pointer leaves the bar.
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('blur', onWindowBlur);

      // Avoid text selection while dragging.
      try {
        event.preventDefault();
      } catch {
        // ignore
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
    computeNextPercentFromKey,
    initReadingProgress
  };
});
