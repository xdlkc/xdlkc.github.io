/* Theme toggle (system/light/dark) with persistence.
 *
 * Browser usage:
 *   - Add a button with [data-theme-toggle]
 *   - Include /js/theme-toggle.js (defer)
 *   - Optionally run the tiny inline boot script in <head> for no-flash.
 */

const STORAGE_KEY = 'xdlkc:theme';

function normalizeThemeMode(value) {
  return value === 'dark' || value === 'light' || value === 'system' ? value : null;
}

function normalizeTheme(value) {
  return value === 'dark' || value === 'light' ? value : null;
}

function resolveInitialTheme({ savedMode, prefersDark }) {
  const mode = normalizeThemeMode(savedMode);
  if (mode === 'dark' || mode === 'light') return mode;
  // system or null
  return prefersDark ? 'dark' : 'light';
}

function toggleThemeMode(currentMode) {
  const mode = normalizeThemeMode(currentMode) || 'system';
  if (mode === 'system') return 'light';
  if (mode === 'light') return 'dark';
  return 'system';
}

function modeLabel(mode) {
  if (mode === 'dark') return '深色';
  if (mode === 'light') return '浅色';
  return '跟随系统';
}

function applyThemeToDocument({ document, theme, mode }) {
  if (!document?.documentElement) return;
  const t = normalizeTheme(theme) || 'light';
  const m = normalizeThemeMode(mode) || 'system';

  document.documentElement.dataset.theme = t;
  document.documentElement.dataset.themeMode = m;

  const toggle = document.querySelector?.('[data-theme-toggle]');
  if (toggle) {
    if (toggle.setAttribute) {
      toggle.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
      if (!toggle.getAttribute?.('aria-label')) {
        toggle.setAttribute('aria-label', '切换主题（跟随系统/浅色/深色）');
      }
      toggle.setAttribute('type', 'button');
    }

    // Visible label (user-perceivable).
    try {
      toggle.textContent = `主题：${modeLabel(m)}`;
    } catch {
      // ignore
    }
  }
}

function getPrefersDark() {
  try {
    return !!globalThis.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
  } catch {
    return false;
  }
}

function readSavedMode(storage) {
  try {
    return normalizeThemeMode(storage?.getItem?.(STORAGE_KEY));
  } catch {
    return null;
  }
}

function saveMode(storage, mode) {
  try {
    storage?.setItem?.(STORAGE_KEY, mode);
  } catch {
    // ignore (private mode / disabled storage)
  }
}

function initThemeToggle({
  document = globalThis.document,
  storage = globalThis.localStorage,
  matchMedia = globalThis.matchMedia,
} = {}) {
  if (!document?.querySelector) return;

  const prefersDark = getPrefersDark();
  const savedMode = readSavedMode(storage);
  const initialTheme = resolveInitialTheme({ savedMode, prefersDark });
  const initialMode = normalizeThemeMode(savedMode) || 'system';

  applyThemeToDocument({ document, theme: initialTheme, mode: initialMode });

  const toggle = document.querySelector('[data-theme-toggle]');
  if (!toggle) return;

  let mql = null;
  let onSystemChange = null;

  function attachSystemListener() {
    if (!matchMedia) return;
    try {
      mql = matchMedia('(prefers-color-scheme: dark)');
      onSystemChange = () => {
        const mode = normalizeThemeMode(readSavedMode(storage)) || (document.documentElement.dataset.themeMode || 'system');
        if (mode !== 'system') return;
        const theme = mql.matches ? 'dark' : 'light';
        applyThemeToDocument({ document, theme, mode: 'system' });
      };

      if (mql.addEventListener) mql.addEventListener('change', onSystemChange);
      else if (mql.addListener) mql.addListener(onSystemChange);
    } catch {
      // ignore
    }
  }

  function detachSystemListener() {
    if (!mql || !onSystemChange) return;
    try {
      if (mql.removeEventListener) mql.removeEventListener('change', onSystemChange);
      else if (mql.removeListener) mql.removeListener(onSystemChange);
    } catch {
      // ignore
    }
    mql = null;
    onSystemChange = null;
  }

  if (initialMode === 'system') attachSystemListener();

  toggle.addEventListener('click', () => {
    const currentMode = normalizeThemeMode(readSavedMode(storage))
      || normalizeThemeMode(document.documentElement.dataset.themeMode)
      || 'system';

    const nextMode = toggleThemeMode(currentMode);

    // Update listener binding.
    if (nextMode === 'system') {
      attachSystemListener();
    } else {
      detachSystemListener();
    }

    const nextTheme = nextMode === 'system'
      ? (getPrefersDark() ? 'dark' : 'light')
      : nextMode;

    applyThemeToDocument({ document, theme: nextTheme, mode: nextMode });
    saveMode(storage, nextMode);
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
    toggleThemeMode,
    applyThemeToDocument,
  };
}
