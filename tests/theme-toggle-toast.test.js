const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const { initThemeToggle } = require('../themes/evan/source/js/theme-toggle.js');

function makeDom({ langMode = 'zh' } = {}) {
  const dom = new JSDOM(`<!doctype html><html data-lang-mode="${langMode}"><head></head><body>
    <button data-theme-toggle></button>
  </body></html>`, { url: 'https://example.com/post/' });

  const { window } = dom;
  const { document } = window;

  // Keep behavior consistent with site.
  document.documentElement.dataset.langMode = langMode;

  // Stub matchMedia.
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });

  return { dom, window, document };
}

test('ThemeToggle: clicking toggle shows a toast with the updated label (single toast element)', () => {
  const { window, document } = makeDom({ langMode: 'zh' });

  // Stub timers so the toast stays visible during assertions.
  window.setTimeout = (fn, ms) => {
    window.__toastTimeout = { fn, ms };
    return 123;
  };
  window.clearTimeout = () => {};

  initThemeToggle({ window, document, storage: window.localStorage, matchMedia: window.matchMedia });

  const toggle = document.querySelector('[data-theme-toggle]');
  assert.ok(toggle);

  // Initial label should be system.
  assert.match(toggle.textContent, /主题：/);

  toggle.dispatchEvent(new window.Event('click', { bubbles: true }));

  // After click, mode cycles system -> light.
  assert.equal(document.documentElement.dataset.themeMode, 'light');
  assert.match(toggle.textContent, /主题：浅色/);

  const toasts = document.querySelectorAll('.theme-toggle-toast');
  assert.equal(toasts.length, 1);

  const toast = toasts[0];
  assert.ok(toast.classList.contains('is-visible'));
  assert.match(toast.textContent, /主题：浅色/);
});
