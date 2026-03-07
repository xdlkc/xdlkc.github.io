/* Font size toggle (normal/lg/sm) for article content with persistence.
 *
 * Browser usage:
 *   - Add a button with [data-font-size-toggle]
 *   - Include /js/font-size-toggle.js (defer)
 */

const STORAGE_KEY = 'xdlkc:font-size';

function normalizeMode(value) {
  return value === 'normal' || value === 'lg' || value === 'sm' ? value : null;
}

function toggleFontSizeMode(currentMode) {
  const mode = normalizeMode(currentMode) || 'normal';
  if (mode === 'normal') return 'lg';
  if (mode === 'lg') return 'sm';
  return 'normal';
}

function modeLabel(mode) {
  if (mode === 'lg') return '大';
  if (mode === 'sm') return '小';
  return '标准';
}

function readSavedMode(storage) {
  try {
    return normalizeMode(storage?.getItem?.(STORAGE_KEY));
  } catch {
    return null;
  }
}

function saveMode(storage, mode) {
  try {
    storage?.setItem?.(STORAGE_KEY, mode);
  } catch {
    // ignore
  }
}

function applyFontSizeToDocument({ document, mode }) {
  if (!document?.documentElement) return;
  const m = normalizeMode(mode) || 'normal';

  document.documentElement.dataset.fontSize = m;

  const toggle = document.querySelector?.('[data-font-size-toggle]');
  if (toggle) {
    if (toggle.setAttribute) {
      if (!toggle.getAttribute?.('aria-label')) {
        toggle.setAttribute('aria-label', '调整文章字号（标准/大/小）');
      }
      toggle.setAttribute('type', 'button');
    }

    try {
      toggle.textContent = `字号：${modeLabel(m)}`;
    } catch {
      // ignore
    }
  }
}

function initFontSizeToggle({
  document = globalThis.document,
  storage = globalThis.localStorage,
} = {}) {
  if (!document?.querySelector) return;

  const saved = readSavedMode(storage);
  const initialMode = saved || normalizeMode(document.documentElement?.dataset?.fontSize) || 'normal';
  applyFontSizeToDocument({ document, mode: initialMode });

  const toggle = document.querySelector('[data-font-size-toggle]');
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    const currentMode = readSavedMode(storage)
      || normalizeMode(document.documentElement.dataset.fontSize)
      || 'normal';
    const nextMode = toggleFontSizeMode(currentMode);
    applyFontSizeToDocument({ document, mode: nextMode });
    saveMode(storage, nextMode);
  });
}

// Auto-init in browsers.
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.FontSizeToggle = window.FontSizeToggle || {};
  window.FontSizeToggle.init = initFontSizeToggle;
  window.addEventListener('DOMContentLoaded', () => initFontSizeToggle());
}

// Exports for tests (CommonJS).
if (typeof module !== 'undefined') {
  module.exports = {
    STORAGE_KEY,
    toggleFontSizeMode,
    applyFontSizeToDocument,
    initFontSizeToggle,
  };
}
