/* Relative time display for article publish/update dates.
 *
 * Shows "3 days ago", "2 hours ago", etc. Supports Chinese/English.
 *
 * Exposes window.RelativeTimeDisplay in browser; exports for Node tests.
 */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.RelativeTimeDisplay = factory();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  const SECONDS_IN_MINUTE = 60;
  const SECONDS_IN_HOUR = 60 * SECONDS_IN_MINUTE;
  const SECONDS_IN_DAY = 24 * SECONDS_IN_HOUR;
  const SECONDS_IN_MONTH = 30 * SECONDS_IN_DAY;
  const SECONDS_IN_YEAR = 365 * SECONDS_IN_DAY;

  function lang(document) {
    return document?.documentElement?.dataset?.langMode === 'zh' ? 'zh' : 'en';
  }

  function calculateRelativeTime(date, now) {
    const d = date instanceof Date ? date : new Date(date);
    const n = now instanceof Date ? now : new Date(now);

    if (Number.isNaN(d.getTime()) || Number.isNaN(n.getTime())) {
      return null;
    }

    const diffMs = n.getTime() - d.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);

    if (diffSeconds < 60) {
      return { value: 0, unit: 'just_now' };
    } else if (diffSeconds < SECONDS_IN_HOUR) {
      return { value: Math.floor(diffSeconds / SECONDS_IN_MINUTE), unit: 'minutes' };
    } else if (diffSeconds < SECONDS_IN_DAY) {
      return { value: Math.floor(diffSeconds / SECONDS_IN_HOUR), unit: 'hours' };
    } else if (diffSeconds < SECONDS_IN_MONTH) {
      return { value: Math.floor(diffSeconds / SECONDS_IN_DAY), unit: 'days' };
    } else if (diffSeconds < SECONDS_IN_YEAR) {
      return { value: Math.floor(diffSeconds / SECONDS_IN_MONTH), unit: 'months' };
    } else {
      return { value: Math.floor(diffSeconds / SECONDS_IN_YEAR), unit: 'years' };
    }
  }

  function formatRelativeTime(result, langMode = 'en') {
    if (!result || typeof result !== 'object') return '';

    const { value, unit } = result;
    const isZh = langMode === 'zh';

    if (unit === 'just_now') {
      return isZh ? '刚刚' : 'just now';
    }

    if (isZh) {
      switch (unit) {
        case 'minutes':
          return `${value}分钟前`;
        case 'hours':
          return `${value}小时前`;
        case 'days':
          return `${value}天前`;
        case 'months':
          return `${value}个月前`;
        case 'years':
          return `${value}年前`;
        default:
          return '';
      }
    } else {
      const unitText = value === 1 ? unit.slice(0, -1) : unit;
      return `${value} ${unitText} ago`;
    }
  }

  function parseIsoDate(isoString) {
    if (!isoString) return null;
    try {
      return new Date(isoString);
    } catch {
      return null;
    }
  }

  function updateRelativeTimeElements({ document } = {}) {
    if (!document?.querySelector) return;

    const langMode = lang(document);
    const now = new Date();

    // Update article publish date
    const publishEl = document.querySelector('[data-publish-date]');
    if (publishEl) {
      const isoDate = publishEl.getAttribute('data-publish-date');
      const date = parseIsoDate(isoDate);
      if (date && !Number.isNaN(date.getTime())) {
        const relative = calculateRelativeTime(date, now);
        if (relative) {
          const relativeText = formatRelativeTime(relative, langMode);
          publishEl.textContent = relativeText;
        }
      }
    }

    // Update article update date
    const updateEl = document.querySelector('[data-update-date]');
    if (updateEl) {
      const isoDate = updateEl.getAttribute('data-update-date');
      const date = parseIsoDate(isoDate);
      if (date && !Number.isNaN(date.getTime())) {
        const relative = calculateRelativeTime(date, now);
        if (relative) {
          const relativeText = formatRelativeTime(relative, langMode);
          updateEl.textContent = relativeText;
        }
      }
    }
  }

  function initRelativeTimeDisplay({ document = globalThis.document, window = globalThis.window } = {}) {
    if (!document?.querySelector || !window) return;

    // Idempotent
    if (document.querySelector('[data-relative-time-inited="1"]')) return;

    // Mark as inited
    const marker = document.createElement('span');
    marker.setAttribute('data-relative-time-inited', '1');
    marker.style.display = 'none';
    document.body?.appendChild?.(marker);

    // Initial update
    updateRelativeTimeElements({ document });

    // Update every minute
    const interval = window.setInterval(() => {
      updateRelativeTimeElements({ document });
    }, 60 * 1000);

    // Cleanup on page unload (optional)
    window.addEventListener('beforeunload', () => {
      if (interval && typeof interval.clearInterval === 'function') {
        interval.clearInterval();
      } else if (typeof window.clearInterval === 'function') {
        window.clearInterval(interval);
      }
    });
  }

  return {
    calculateRelativeTime,
    formatRelativeTime,
    parseIsoDate,
    updateRelativeTimeElements,
    initRelativeTimeDisplay,
  };
});
