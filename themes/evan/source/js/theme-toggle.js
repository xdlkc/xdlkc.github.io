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

function resolveLang(document) {
  return document?.documentElement?.dataset?.langMode === 'zh' ? 'zh' : 'en';
}

function modeLabel(mode, { lang = 'en' } = {}) {
  if (lang === 'zh') {
    if (mode === 'dark') return '深色';
    if (mode === 'light') return '浅色';
    return '跟随系统';
  }
  if (mode === 'dark') return 'Dark';
  if (mode === 'light') return 'Light';
  return 'System';
}

function applyThemeToDocument({ document, theme, mode }) {
  if (!document?.documentElement) return;
  const t = normalizeTheme(theme) || 'light';
  const m = normalizeThemeMode(mode) || 'system';

  document.documentElement.dataset.theme = t;
  document.documentElement.dataset.themeMode = m;

  const toggle = document.querySelector?.('[data-theme-toggle]');
  if (toggle) {
    const lang = resolveLang(document);
    if (toggle.setAttribute) {
      toggle.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
      toggle.setAttribute('aria-label', lang === 'zh' ? '切换主题' : 'Theme mode');
      toggle.setAttribute('type', 'button');
    }

    // Visible label (user-perceivable).
    try {
      toggle.textContent = lang === 'zh'
        ? `主题：${modeLabel(m, { lang })}`
        : `Theme: ${modeLabel(m, { lang })}`;
    } catch {
      // ignore
    }
  }
}

function getPrefersDark(matchMedia = globalThis.matchMedia) {
  try {
    return !!matchMedia?.('(prefers-color-scheme: dark)')?.matches;
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

function readUrlThemeOverride(location) {
  // URL param override: ?theme=dark|light|system
  // Invalid values are ignored.
  try {
    const search = String(location?.search || '');
    if (!search) return null;
    const params = new URLSearchParams(search);
    const value = String(params.get('theme') || '').trim();
    return normalizeThemeMode(value);
  } catch {
    return null;
  }
}

function isTypingTarget(target) {
  if (!target) return false;
  const el = target;

  try {
    if (el.matches?.('input, textarea, select')) return true;
  } catch {
    // ignore
  }

  try {
    if (el.isContentEditable) return true;
  } catch {
    // ignore
  }

  try {
    if (el.closest?.('[contenteditable="true"]')) return true;
  } catch {
    // ignore
  }

  const tag = String(el.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;

  return false;
}

function initThemeToggle({
  window = globalThis.window,
  document = globalThis.document,
  storage = globalThis.localStorage,
  matchMedia = globalThis.matchMedia,
} = {}) {
  if (!document?.querySelector) return;

  const prefersDark = getPrefersDark(matchMedia);
  const savedMode = readSavedMode(storage);
  const overrideMode = readUrlThemeOverride(window?.location);

  // URL override applies to this page only; do not persist.
  const effectiveMode = overrideMode || savedMode;
  const initialTheme = resolveInitialTheme({ savedMode: effectiveMode, prefersDark });
  const initialMode = normalizeThemeMode(effectiveMode) || 'system';

  applyThemeToDocument({ document, theme: initialTheme, mode: initialMode });

  const toggle = document.querySelector('[data-theme-toggle]');
  if (!toggle) return;
  if (toggle.dataset?.themeBound === '1') return;
  if (toggle.dataset) toggle.dataset.themeBound = '1';

  // Keyboard shortcut: press `d` to cycle theme mode (system -> light -> dark -> system).
  // Bind at most once per document.
  if (window?.addEventListener && document?.documentElement?.dataset) {
    if (document.documentElement.dataset.themeShortcutBound !== '1') {
      document.documentElement.dataset.themeShortcutBound = '1';

      window.addEventListener('keydown', (event) => {
        if (!event) return;
        if (event.defaultPrevented) return;
        if (event.repeat) return;

        // Ignore modified key combos.
        if (event.metaKey || event.ctrlKey || event.altKey) return;

        const key = String(event.key || '').toLowerCase();
        if (key !== 'd') return;

        // Do not hijack typing.
        if (isTypingTarget(event.target) || isTypingTarget(document?.activeElement)) return;

        // Trigger the same behavior as click.
        try {
          toggle.click();
        } catch {
          // ignore
        }
      });
    }
  }

  let mql = null;
  let onSystemChange = null;

  function attachSystemListener() {
    if (!matchMedia) return;
    try {
      mql = matchMedia('(prefers-color-scheme: dark)');
      onSystemChange = () => {
        const mode = normalizeThemeMode(document.documentElement.dataset.themeMode)
          || normalizeThemeMode(readSavedMode(storage))
          || 'system';
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

  // Cross-tab sync: when another tab updates STORAGE_KEY, reflect it here.
  if (window?.addEventListener) {
    window.addEventListener('storage', (event) => {
      if (!event || event.key !== STORAGE_KEY) return;

      // If this page is URL-overridden, keep it stable.
      if (readUrlThemeOverride(window?.location)) return;

      const mode = normalizeThemeMode(event.newValue)
        || normalizeThemeMode(readSavedMode(storage))
        || 'system';

      // Update listener binding.
      if (mode === 'system') attachSystemListener();
      else detachSystemListener();

      const theme = mode === 'system'
        ? (getPrefersDark(matchMedia) ? 'dark' : 'light')
        : mode;

      applyThemeToDocument({ document, theme, mode });
    });
  }

  if (window?.addEventListener) {
    window.addEventListener('xdlkc:lang-change', () => {
      const mode = normalizeThemeMode(document.documentElement.dataset.themeMode)
        || readUrlThemeOverride(window?.location)
        || normalizeThemeMode(readSavedMode(storage))
        || 'system';
      const theme = normalizeTheme(document.documentElement.dataset.theme)
        || resolveInitialTheme({ savedMode: mode, prefersDark: getPrefersDark(matchMedia) });
      applyThemeToDocument({ document, theme, mode });
    });
  }

  toggle.addEventListener('click', () => {
    const currentMode = normalizeThemeMode(document.documentElement.dataset.themeMode)
      || readUrlThemeOverride(window?.location)
      || normalizeThemeMode(readSavedMode(storage))
      || 'system';

    const nextMode = toggleThemeMode(currentMode);

    // Update listener binding.
    if (nextMode === 'system') {
      attachSystemListener();
    } else {
      detachSystemListener();
    }

    const nextTheme = nextMode === 'system'
      ? (getPrefersDark(matchMedia) ? 'dark' : 'light')
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
    initThemeToggle,
  };
}
