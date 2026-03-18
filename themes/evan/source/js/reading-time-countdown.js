/* Reading Time Countdown - Shows remaining reading time based on scroll progress.
 *
 * Displays "X min left" or "剩余 X 分钟" dynamically as the user scrolls.
 * Integrates with existing reading-progress.js and reading-time helper.
 */

function calculateRemainingTime(progress, totalMinutes) {
  // Clamp progress between 0 and 1
  const clampedProgress = Math.max(0, Math.min(1, Number(progress) || 0));

  // Calculate remaining time
  const remaining = totalMinutes * (1 - clampedProgress);

  // Return 0 if remaining is very small or negative, round to 1 decimal place
  const rounded = Math.round(Math.max(0, remaining) * 10) / 10;
  return rounded;
}

function formatRemainingTime(remainingMinutes, langMode = 'en') {
  const remaining = Number(remainingMinutes) || 0;

  // Zero remaining = done
  if (remaining <= 0) {
    return langMode === 'zh' ? '已读完' : 'Done';
  }

  // Less than 0.5 minutes = almost done
  if (remaining < 0.5) {
    return langMode === 'zh' ? '即将读完' : 'Almost done';
  }

  // Format: "X min left" or "剩余 X 分钟"
  const formatted = remaining % 1 === 0 ? remaining.toFixed(0) : remaining.toFixed(1);

  if (langMode === 'zh') {
    return `剩余 ${formatted} 分钟`;
  }

  return `${formatted} min left`;
}

function resolveLangMode(document) {
  return document?.documentElement?.dataset?.langMode === 'zh' ? 'zh' : 'en';
}

function updateCountdownDisplay(element, remainingMinutes, langMode = 'en') {
  if (!element) return;

  const text = formatRemainingTime(remainingMinutes, langMode);
  element.textContent = text;
}

function getScrollProgress({ window = globalThis.window, document = globalThis.document } = {}) {
  const win = window || {};
  const doc = document || {};

  const scrollTop = win.scrollY || doc.documentElement?.scrollTop || doc.body?.scrollTop || 0;
  const scrollHeight = doc.documentElement?.scrollHeight || doc.body?.scrollHeight || 0;
  const clientHeight = doc.documentElement?.clientHeight || win.innerHeight || 0;

  const totalScrollable = scrollHeight - clientHeight;

  // Avoid division by zero
  if (totalScrollable <= 0) return 0;

  return Math.max(0, Math.min(1, scrollTop / totalScrollable));
}

function getTotalReadingMinutes(document = globalThis.document) {
  const doc = document || {};
  const progressEl = doc.querySelector?.('[data-reading-minutes]');
  if (!progressEl) return 0;

  const value = progressEl.getAttribute('data-reading-minutes');
  return parseFloat(value) || 0;
}

function initReadingTimeCountdown({
  window = globalThis.window,
  document = globalThis.document,
} = {}) {
  if (!document?.querySelector || !window?.addEventListener) return;

  const countdownEl = document.querySelector('[data-reading-time-countdown]');
  if (!countdownEl) return;

  // Avoid double initialization
  if (countdownEl.getAttribute('data-reading-time-countdown-bound') === '1') return;
  countdownEl.setAttribute('data-reading-time-countdown-bound', '1');

  const langMode = resolveLangMode(document);

  let ticking = false;

  function updateCountdown() {
    const progress = getScrollProgress({ window, document });
    const totalMinutes = getTotalReadingMinutes(document);
    const remaining = calculateRemainingTime(progress, totalMinutes);

    updateCountdownDisplay(countdownEl, remaining, langMode);

    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateCountdown();
        ticking = true;
      });
    }
  }

  // Initial update
  updateCountdown();

  // Bind scroll event
  window.addEventListener('scroll', onScroll, { passive: true });
}

// Auto-init in browsers
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.ReadingTimeCountdown = window.ReadingTimeCountdown || {};
  window.ReadingTimeCountdown.init = initReadingTimeCountdown;
  window.addEventListener('DOMContentLoaded', () => initReadingTimeCountdown());
}

// Exports for tests (CommonJS)
if (typeof module !== 'undefined') {
  module.exports = {
    calculateRemainingTime,
    formatRemainingTime,
    resolveLangMode,
    updateCountdownDisplay,
    initReadingTimeCountdown,
    getScrollProgress,
    getTotalReadingMinutes,
  };
}
