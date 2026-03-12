const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const ThemeToggle = require('../themes/evan/source/js/theme-toggle');

function makeMatchMedia({ prefersDark = false } = {}) {
  return () => ({
    matches: prefersDark,
    addEventListener() {},
    removeEventListener() {},
  });
}

test('ThemeToggle: pressing d cycles theme mode and persists (when not typing)', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <button data-theme-toggle></button>
  </body></html>`, { url: 'https://example.com/' });

  const { window } = dom;

  // Start from system.
  window.localStorage.removeItem(ThemeToggle.STORAGE_KEY);

  ThemeToggle.initThemeToggle({
    window,
    document: window.document,
    storage: window.localStorage,
    matchMedia: makeMatchMedia({ prefersDark: false }),
  });

  // system -> light
  window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'd', bubbles: true }));

  assert.equal(window.localStorage.getItem(ThemeToggle.STORAGE_KEY), 'light');
  assert.equal(window.document.documentElement.dataset.themeMode, 'light');
  assert.equal(window.document.documentElement.dataset.theme, 'light');

  // light -> dark
  window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'd', bubbles: true }));

  assert.equal(window.localStorage.getItem(ThemeToggle.STORAGE_KEY), 'dark');
  assert.equal(window.document.documentElement.dataset.themeMode, 'dark');
  assert.equal(window.document.documentElement.dataset.theme, 'dark');
});

test('ThemeToggle: pressing d does not toggle while typing in input/textarea/select/contenteditable', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <input id="i" />
    <textarea id="t"></textarea>
    <select id="s"><option>1</option></select>
    <div id="ce" contenteditable="true"></div>
    <button data-theme-toggle></button>
  </body></html>`, { url: 'https://example.com/' });

  const { window } = dom;

  window.localStorage.setItem(ThemeToggle.STORAGE_KEY, 'system');

  ThemeToggle.initThemeToggle({
    window,
    document: window.document,
    storage: window.localStorage,
    matchMedia: makeMatchMedia({ prefersDark: false }),
  });

  const before = window.localStorage.getItem(ThemeToggle.STORAGE_KEY);

  // input
  window.document.getElementById('i').focus();
  window.document.getElementById('i').dispatchEvent(new window.KeyboardEvent('keydown', { key: 'd', bubbles: true }));
  assert.equal(window.localStorage.getItem(ThemeToggle.STORAGE_KEY), before);

  // textarea
  window.document.getElementById('t').focus();
  window.document.getElementById('t').dispatchEvent(new window.KeyboardEvent('keydown', { key: 'd', bubbles: true }));
  assert.equal(window.localStorage.getItem(ThemeToggle.STORAGE_KEY), before);

  // select
  window.document.getElementById('s').focus();
  window.document.getElementById('s').dispatchEvent(new window.KeyboardEvent('keydown', { key: 'd', bubbles: true }));
  assert.equal(window.localStorage.getItem(ThemeToggle.STORAGE_KEY), before);

  // contenteditable
  window.document.getElementById('ce').focus();
  window.document.getElementById('ce').dispatchEvent(new window.KeyboardEvent('keydown', { key: 'd', bubbles: true }));
  assert.equal(window.localStorage.getItem(ThemeToggle.STORAGE_KEY), before);
});

test('ThemeToggle: shortcut binding is idempotent (no double toggle on one keypress)', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <button data-theme-toggle></button>
  </body></html>`, { url: 'https://example.com/' });

  const { window } = dom;

  window.localStorage.setItem(ThemeToggle.STORAGE_KEY, 'system');

  ThemeToggle.initThemeToggle({
    window,
    document: window.document,
    storage: window.localStorage,
    matchMedia: makeMatchMedia({ prefersDark: false }),
  });

  ThemeToggle.initThemeToggle({
    window,
    document: window.document,
    storage: window.localStorage,
    matchMedia: makeMatchMedia({ prefersDark: false }),
  });

  // One keypress should advance mode by exactly one step: system -> light
  window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'd', bubbles: true }));

  assert.equal(window.localStorage.getItem(ThemeToggle.STORAGE_KEY), 'light');
});
