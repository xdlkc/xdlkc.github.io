/* Font size toggle (small/medium/large/extra-large) with persistence.
 *
 * Browser usage:
 *   - Add a button with [data-font-size-toggle]
 *   - Include /js/font-size-toggle.js (defer)
 */

const STORAGE_KEY = 'xdlkc:font-size';

const FONT_SIZES = {
  small: '14px',
  medium: '16px',
  large: '18px',
  'extra-large': '20px',
};

const FONT_SIZE_LEVELS = ['small', 'medium', 'large', 'extra-large'];

function normalizeFontSizeLevel(value) {
  return FONT_SIZE_LEVELS.includes(value) ? value : 'medium';
}

function getFontSizeByLevel(level) {
  return FONT_SIZES[normalizeFontSizeLevel(level)];
}

function getNextFontSizeLevel(currentLevel) {
  const currentIndex = FONT_SIZE_LEVELS.indexOf(normalizeFontSizeLevel(currentLevel));
  const nextIndex = (currentIndex + 1) % FONT_SIZE_LEVELS.length;
  return FONT_SIZE_LEVELS[nextIndex];
}

function resolveLang(document) {
  return document?.documentElement?.dataset?.langMode === 'zh' ? 'zh' : 'en';
}

function levelLabel(level, { lang = 'en' } = {}) {
  if (lang === 'zh') {
    if (level === 'small') return '小号';
    if (level === 'medium') return '中号';
    if (level === 'large') return '大号';
    if (level === 'extra-large') return '超大号';
  }
  if (level === 'small') return 'Small';
  if (level === 'medium') return 'Medium';
  if (level === 'large') return 'Large';
  if (level === 'extra-large') return 'Extra Large';
  return 'Medium';
}

function applyFontSizeToDocument({ document, level }) {
  if (!document?.documentElement) return;
  const fontSize = getFontSizeByLevel(level);
  const articleContent = document.querySelector('.article-content');

  if (articleContent) {
    articleContent.style.setProperty('--article-font-size', fontSize);
  }

  const toggle = document.querySelector?.('[data-font-size-toggle]');
  if (toggle) {
    updateButtonText({ button: toggle, level, lang: resolveLang(document) });
  }
}

function updateButtonText({ button, level, lang }) {
  if (!button) return;
  button.textContent = lang === 'zh'
    ? `字体：${levelLabel(level, { lang })}`
    : `Font: ${levelLabel(level, { lang })}`;
  button.setAttribute('aria-label', lang === 'zh' ? '切换字体大小' : 'Toggle font size');
}

function readSavedLevel(storage) {
  try {
    return normalizeFontSizeLevel(storage?.getItem?.(STORAGE_KEY));
  } catch {
    return 'medium';
  }
}

function saveFontSizeLevel(storage, level) {
  try {
    storage?.setItem?.(STORAGE_KEY, normalizeFontSizeLevel(level));
  } catch {
    // ignore (private mode / disabled storage)
  }
}

function initFontSizeToggle({
  window = globalThis.window,
  document = globalThis.document,
  storage = globalThis.localStorage,
} = {}) {
  if (!document?.querySelector) return;

  const savedLevel = readSavedLevel(storage);
  applyFontSizeToDocument({ document, level: savedLevel });

  const toggle = document.querySelector('[data-font-size-toggle]');
  if (!toggle) return;
  if (toggle.dataset?.fontSizeBound === '1') return;
  if (toggle.dataset) toggle.dataset.fontSizeBound = '1';

  // Keyboard shortcut: press `f` to cycle font size.
  if (window?.addEventListener && document?.documentElement?.dataset) {
    if (document.documentElement.dataset.fontSizeShortcutBound !== '1') {
      document.documentElement.dataset.fontSizeShortcutBound = '1';

      window.addEventListener('keydown', (event) => {
        if (!event) return;
        if (event.defaultPrevented) return;
        if (event.repeat) return;

        // Ignore modified key combos.
        if (event.metaKey || event.ctrlKey || event.altKey) return;

        const key = String(event.key || '').toLowerCase();
        if (key !== 'f') return;

        const target = event.target;
        const isTypingTarget = !!(
          target &&
          (target.matches?.('input, textarea, select') ||
            target.isContentEditable ||
            target.closest?.('[contenteditable="true"]'))
        );
        if (isTypingTarget) return;

        // Trigger the same behavior as click.
        try {
          toggle.click();
        } catch {
          // ignore
        }
      });
    }
  }

  // Cross-tab sync: when another tab updates STORAGE_KEY, reflect it here.
  if (window?.addEventListener) {
    window.addEventListener('storage', (event) => {
      if (!event || event.key !== STORAGE_KEY) return;

      const newLevel = normalizeFontSizeLevel(event.newValue);
      applyFontSizeToDocument({ document, level: newLevel });
    });
  }

  if (window?.addEventListener) {
    window.addEventListener('xdlkc:lang-change', () => {
      const currentLevel = readSavedLevel(storage);
      updateButtonText({ button: toggle, level: currentLevel, lang: resolveLang(document) });
    });
  }

  toggle.addEventListener('click', () => {
    const currentLevel = readSavedLevel(storage);
    const nextLevel = getNextFontSizeLevel(currentLevel);

    applyFontSizeToDocument({ document, level: nextLevel });
    saveFontSizeLevel(storage, nextLevel);
  });
}

// Auto-init in browsers.
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.FontSizeToggle = window.FontSizeToggle || {};
  window.FontSizeToggle.init = initFontSizeToggle;
  window.addEventListener('DOMContentLoaded', () => initFontSizeToggle());
}

// Exports for tests (CommonJS).
module.exports = {
  STORAGE_KEY,
  FONT_SIZES,
  FONT_SIZE_LEVELS,
  normalizeFontSizeLevel,
  getFontSizeByLevel,
  getNextFontSizeLevel,
  resolveLang,
  levelLabel,
  applyFontSizeToDocument,
  updateButtonText,
  readSavedLevel,
  saveFontSizeLevel,
  initFontSizeToggle,
};

console.log('--- Debugging exports ---');
console.log('readSavedLevel:', typeof readSavedLevel);
console.log('saveFontSizeLevel:', typeof saveFontSizeLevel);
console.log('--- End Debugging exports ---');
