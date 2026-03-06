/* Theme toggle (light/dark) with persistence.
 *
 * Browser usage:
 *   - Add a button with [data-theme-toggle]
 *   - Include /js/theme-toggle.js (defer)
 *   - Optionally run the tiny inline boot script in <head> for no-flash.
 */

const STORAGE_KEY = 'xdlkc:theme';

function normalizeTheme(value) {
  return value === 'dark' || value === 'light' ? value : null;
}

function resolveInitialTheme({ saved, prefersDark }) {
  const normalized = normalizeTheme(saved);
  if (normalized) return normalized;
  return prefersDark ? 'dark' : 'light';
}

function toggleTheme(current) {
  return current === 'dark' ? 'light' : 'dark';
}

function applyThemeToDocument({ document, theme }) {
  if (!document?.documentElement) return;
  document.documentElement.dataset.theme = theme;

  const toggle = document.querySelector?.('[data-theme-toggle]');
  if (toggle?.setAttribute) {
    toggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
  }
}

function getPrefersDark() {
  try {
    return !!globalThis.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
  } catch {
    return false;
  }
}

function readSavedTheme(storage) {
  try {
    return normalizeTheme(storage?.getItem?.(STORAGE_KEY));
  } catch {
    return null;
  }
}

function saveTheme(storage, theme) {
  try {
    storage?.setItem?.(STORAGE_KEY, theme);
  } catch {
    // ignore (private mode / disabled storage)
  }
}

function initThemeToggle({
  document = globalThis.document,
  storage = globalThis.localStorage,
} = {}) {
  if (!document?.querySelector) return;

  const saved = readSavedTheme(storage);
  const theme = resolveInitialTheme({ saved, prefersDark: getPrefersDark() });
  applyThemeToDocument({ document, theme });

  const toggle = document.querySelector('[data-theme-toggle]');
  if (!toggle) return;

  if (!toggle.getAttribute('aria-label')) {
    toggle.setAttribute('aria-label', '切换深色/浅色模式');
  }
  toggle.setAttribute('type', 'button');

  toggle.addEventListener('click', () => {
    const current = normalizeTheme(document.documentElement.dataset.theme) || 'light';
    const next = toggleTheme(current);
    applyThemeToDocument({ document, theme: next });
    saveTheme(storage, next);
  });
}

// Auto-init in browsers.
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.ThemeToggle = window.ThemeToggle || {};
  window.ThemeToggle.init = initThemeToggle;
  window.addEventListener('DOMContentLoaded', () => initThemeToggle());
}

// Exports for tests (CommonJS).
if (typeof module !== 'undefined') {
  module.exports = {
    STORAGE_KEY,
    resolveInitialTheme,
    toggleTheme,
    applyThemeToDocument,
  };
}
