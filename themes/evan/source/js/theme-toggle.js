/* Theme toggle & multi-palette theme system with persistence.
 *
 * Supports:
 *   - Core modes (100% compatible with existing unit tests): system | light | dark
 *   - Rich palettes: emerald (default light) | sepia | ocean | dark | midnight
 */

const STORAGE_KEY = 'xdlkc:theme';
const PALETTE_STORAGE_KEY = 'xdlkc:theme-palette';

const THEME_PRESETS = [
  { id: 'system', mode: 'system', palette: 'auto', swatch: 'linear-gradient(135deg, #0f766e 50%, #0f172a 50%)', zh: '跟随系统', en: 'System' },
  { id: 'light', mode: 'light', palette: 'emerald', swatch: '#0f766e', zh: '松石青', en: 'Emerald' },
  { id: 'sepia', mode: 'light', palette: 'sepia', swatch: '#b45309', zh: '羊皮卷', en: 'Sepia' },
  { id: 'ocean', mode: 'light', palette: 'ocean', swatch: '#1d4ed8', zh: '极地蓝', en: 'Ocean' },
  { id: 'dark', mode: 'dark', palette: 'dark', swatch: '#111827', zh: '极夜黑', en: 'Dark' },
  { id: 'midnight', mode: 'dark', palette: 'midnight', swatch: '#6d28d9', zh: '星云紫', en: 'Midnight' },
];

function normalizeThemeMode(value) {
  if (value === 'dark' || value === 'light' || value === 'system') return value;
  if (value === 'sepia' || value === 'ocean' || value === 'emerald') return 'light';
  if (value === 'midnight') return 'dark';
  return null;
}

function normalizePalette(value) {
  if (value === 'emerald' || value === 'sepia' || value === 'ocean' || value === 'dark' || value === 'midnight') {
    return value;
  }
  if (value === 'light') return 'emerald';
  return null;
}

function normalizeTheme(value) {
  return value === 'dark' || value === 'light' ? value : null;
}

function resolveInitialTheme({ savedMode, prefersDark }) {
  const mode = normalizeThemeMode(savedMode);
  if (mode === 'dark' || mode === 'light') return mode;
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

function modeLabel(mode, { lang = 'en', palette = null } = {}) {
  if (palette && palette !== 'auto') {
    const preset = THEME_PRESETS.find((p) => p.palette === palette && p.id !== 'system');
    if (preset) {
      return lang === 'zh' ? preset.zh : preset.en;
    }
  }
  if (lang === 'zh') {
    if (mode === 'dark') return '深色';
    if (mode === 'light') return '浅色';
    return '跟随系统';
  }
  if (mode === 'dark') return 'Dark';
  if (mode === 'light') return 'Light';
  return 'System';
}

function applyThemeToDocument({ document, theme, mode, palette }) {
  if (!document?.documentElement) return;
  const t = normalizeTheme(theme) || 'light';
  const m = normalizeThemeMode(mode) || 'system';
  const resolvedPalette = normalizePalette(palette) || (t === 'dark' ? 'dark' : 'emerald');

  document.documentElement.dataset.theme = t;
  document.documentElement.dataset.themeMode = m;
  document.documentElement.dataset.themePalette = m === 'system'
    ? (t === 'dark' ? 'dark' : 'emerald')
    : resolvedPalette;

  const toggle = document.querySelector?.('[data-theme-toggle]');
  if (toggle) {
    const lang = resolveLang(document);
    if (toggle.setAttribute) {
      toggle.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
      toggle.setAttribute('aria-label', lang === 'zh' ? '切换主题' : 'Theme mode');
      toggle.setAttribute('type', 'button');
    }

    const activePaletteForLabel = m === 'system' ? null : normalizePalette(palette);
    try {
      toggle.textContent = lang === 'zh'
        ? `主题：${modeLabel(m, { lang, palette: activePaletteForLabel })}`
        : `Theme: ${modeLabel(m, { lang, palette: activePaletteForLabel })}`;
    } catch {
      // ignore
    }
  }

  // Sync active state on palette menu items if mounted
  const menuItems = document.querySelectorAll?.('[data-theme-preset]');
  if (menuItems) {
    const activeId = m === 'system'
      ? 'system'
      : (resolvedPalette === 'emerald' ? 'light' : resolvedPalette);
    menuItems.forEach((btn) => {
      const isCurrent = btn.getAttribute('data-theme-preset') === activeId;
      btn.classList.toggle('is-active', isCurrent);
      btn.setAttribute('aria-checked', isCurrent ? 'true' : 'false');
    });
  }
}

function ensureThemeToast({ document } = {}) {
  if (!document?.querySelector || !document?.createElement) return null;
  const existing = document.querySelector('.theme-toggle-toast');
  if (existing) return existing;

  const toast = document.createElement('div');
  toast.className = 'theme-toggle-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  document.body?.appendChild?.(toast);
  return toast;
}

function showThemeToast(toast, message, { window } = {}) {
  if (!toast) return;
  toast.textContent = String(message || '').trim();
  toast.classList.add('is-visible');

  const w = window || globalThis.window;
  try {
    w?.clearTimeout?.(showThemeToast.timer);
    showThemeToast.timer = w?.setTimeout?.(() => {
      toast.classList.remove('is-visible');
    }, 1400);
  } catch {
    // ignore
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

function readSavedPalette(storage) {
  try {
    return normalizePalette(storage?.getItem?.(PALETTE_STORAGE_KEY));
  } catch {
    return null;
  }
}

function saveMode(storage, mode, palette) {
  try {
    storage?.setItem?.(STORAGE_KEY, mode);
    if (palette) {
      storage?.setItem?.(PALETTE_STORAGE_KEY, palette);
    } else {
      storage?.removeItem?.(PALETTE_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

function readUrlThemeOverride(location) {
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

function getAutoTheme({ hour, config }) {
  if (!config?.auto_dark_mode?.enable) return null;

  const sunriseHour = config.auto_dark_mode.sunrise_hour;
  const sunsetHour = config.auto_dark_mode.sunset_hour;

  if (hour >= sunsetHour || hour < sunriseHour) {
    return 'dark';
  } else {
    return 'light';
  }
}

function mountThemePalettePopover({ document, toggle, onSelectPreset }) {
  if (!document?.createElement || !toggle?.parentElement) return;
  if (toggle.parentElement.classList?.contains('theme-picker-wrap')) return;

  const parent = toggle.parentElement;
  const wrap = document.createElement('div');
  wrap.className = 'theme-picker-wrap';
  parent.insertBefore(wrap, toggle);
  wrap.appendChild(toggle);

  const menu = document.createElement('div');
  menu.className = 'theme-picker-menu';
  menu.setAttribute('role', 'menu');
  menu.setAttribute('aria-label', 'Theme presets');

  const lang = resolveLang(document);
  THEME_PRESETS.forEach((preset) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'theme-picker-item';
    item.setAttribute('role', 'menuitemradio');
    item.setAttribute('data-theme-preset', preset.id);

    const dot = document.createElement('span');
    dot.className = 'theme-picker-swatch';
    dot.style.background = preset.swatch;

    const label = document.createElement('span');
    label.className = 'theme-picker-label';
    label.textContent = lang === 'zh' ? preset.zh : preset.en;

    item.appendChild(dot);
    item.appendChild(label);
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      onSelectPreset(preset);
      wrap.classList.remove('is-open');
    });
    menu.appendChild(item);
  });

  wrap.appendChild(menu);

  // Open on hover/focus, and close on outside click
  wrap.addEventListener('mouseenter', () => wrap.classList.add('is-open'));
  wrap.addEventListener('mouseleave', () => wrap.classList.remove('is-open'));
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
  const savedPalette = readSavedPalette(storage);
  const overrideMode = readUrlThemeOverride(window?.location);

  const currentHour = new Date().getHours();
  const autoThemeResult = getAutoTheme({ hour: currentHour, config: window?.CONFIG });

  let effectiveMode;
  let finalTheme;

  if (overrideMode) {
    effectiveMode = overrideMode;
  } else if (savedMode) {
    effectiveMode = savedMode;
  } else if (window?.CONFIG?.auto_dark_mode?.enable && autoThemeResult) {
    effectiveMode = 'system';
  } else {
    effectiveMode = 'system';
  }

  if (effectiveMode === 'dark' || effectiveMode === 'light') {
    finalTheme = effectiveMode;
  } else if (effectiveMode === 'system') {
    if (window?.CONFIG?.auto_dark_mode?.enable && autoThemeResult) {
      finalTheme = autoThemeResult;
    } else {
      finalTheme = prefersDark ? 'dark' : 'light';
    }
  } else {
    finalTheme = 'light';
  }

  const toggle = document.querySelector('[data-theme-toggle]');

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
        applyThemeToDocument({ document, theme, mode: 'system', palette: null });
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

  if (toggle) {
    mountThemePalettePopover({
      document,
      toggle,
      onSelectPreset: (preset) => {
        if (preset.mode === 'system') {
          attachSystemListener();
        } else {
          detachSystemListener();
        }
        const nextTheme = preset.mode === 'system'
          ? (getPrefersDark(matchMedia) ? 'dark' : 'light')
          : preset.mode;
        const nextPalette = preset.mode === 'system' ? null : preset.palette;
        applyThemeToDocument({
          document,
          theme: nextTheme,
          mode: preset.mode,
          palette: nextPalette,
        });
        saveMode(storage, preset.mode, nextPalette);
        const toast = ensureThemeToast({ document });
        const message = String(toggle.textContent || '').trim();
        if (message) showThemeToast(toast, message, { window });
      },
    });
  }

  applyThemeToDocument({
    document,
    theme: finalTheme,
    mode: effectiveMode,
    palette: overrideMode ? null : savedPalette,
  });

  if (!toggle) return;
  if (toggle.dataset?.themeBound === '1') return;
  if (toggle.dataset) toggle.dataset.themeBound = '1';

  if (window?.addEventListener && document?.documentElement?.dataset) {
    if (document.documentElement.dataset.themeShortcutBound !== '1') {
      document.documentElement.dataset.themeShortcutBound = '1';

      window.addEventListener('keydown', (event) => {
        if (!event) return;
        if (event.defaultPrevented) return;
        if (event.repeat) return;
        if (event.metaKey || event.ctrlKey || event.altKey) return;

        const key = String(event.key || '').toLowerCase();
        if (key !== 'd') return;
        if (isTypingTarget(event.target) || isTypingTarget(document?.activeElement)) return;

        try {
          toggle.click();
        } catch {
          // ignore
        }
      });
    }
  }

  if (effectiveMode === 'system') attachSystemListener();

  if (window?.addEventListener) {
    window.addEventListener('storage', (event) => {
      if (!event || (event.key !== STORAGE_KEY && event.key !== PALETTE_STORAGE_KEY)) return;
      if (readUrlThemeOverride(window?.location)) return;

      const mode = normalizeThemeMode(readSavedMode(storage)) || 'system';
      const palette = readSavedPalette(storage);

      if (mode === 'system') attachSystemListener();
      else detachSystemListener();

      const theme = mode === 'system'
        ? (getPrefersDark(matchMedia) ? 'dark' : 'light')
        : mode;

      applyThemeToDocument({ document, theme, mode, palette });
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
      const palette = normalizePalette(document.documentElement.dataset.themePalette);
      applyThemeToDocument({ document, theme, mode, palette });

      const lang = resolveLang(document);
      document.querySelectorAll?.('[data-theme-preset]').forEach((item) => {
        const id = item.getAttribute('data-theme-preset');
        const preset = THEME_PRESETS.find((p) => p.id === id);
        const label = item.querySelector?.('.theme-picker-label');
        if (preset && label) {
          label.textContent = lang === 'zh' ? preset.zh : preset.en;
        }
      });
    });
  }

  toggle.addEventListener('click', () => {
    const currentMode = normalizeThemeMode(document.documentElement.dataset.themeMode)
      || readUrlThemeOverride(window?.location)
      || normalizeThemeMode(readSavedMode(storage))
      || 'system';

    const nextMode = toggleThemeMode(currentMode);

    if (nextMode === 'system') {
      attachSystemListener();
    } else {
      detachSystemListener();
    }

    const nextTheme = nextMode === 'system'
      ? (getPrefersDark(matchMedia) ? 'dark' : 'light')
      : nextMode;
    const nextPalette = nextMode === 'system' ? null : (nextTheme === 'dark' ? 'dark' : 'emerald');

    applyThemeToDocument({ document, theme: nextTheme, mode: nextMode, palette: nextPalette });
    saveMode(storage, nextMode, nextPalette);

    const toast = ensureThemeToast({ document });
    const message = String(toggle.textContent || '').trim();
    if (message) showThemeToast(toast, message, { window });
  });
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.ThemeToggle = window.ThemeToggle || {};
  window.ThemeToggle.init = initThemeToggle;
  window.addEventListener('DOMContentLoaded', () => initThemeToggle());
}

if (typeof module !== 'undefined') {
  module.exports = {
    STORAGE_KEY,
    PALETTE_STORAGE_KEY,
    THEME_PRESETS,
    resolveInitialTheme,
    toggleThemeMode,
    applyThemeToDocument,
    initThemeToggle,
    ensureThemeToast,
    showThemeToast,
    getAutoTheme,
  };
}
