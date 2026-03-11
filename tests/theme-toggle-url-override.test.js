const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const { initThemeToggle, STORAGE_KEY } = require('../themes/evan/source/js/theme-toggle.js');

function makeMatchMedia({ prefersDark }) {
  return (query) => {
    if (query !== '(prefers-color-scheme: dark)') {
      return { matches: false, addEventListener() {}, removeEventListener() {} };
    }
    return {
      matches: !!prefersDark,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
    };
  };
}

test('ThemeToggle: URL ?theme=dark overrides saved mode (without writing to localStorage)', () => {
  const dom = new JSDOM(`<!doctype html><html><head></head><body>
    <button data-theme-toggle></button>
  </body></html>`, { url: 'https://example.com/post/?theme=dark' });

  const { window } = dom;
  window.localStorage.setItem(STORAGE_KEY, 'light');

  initThemeToggle({
    window,
    document: window.document,
    storage: window.localStorage,
    matchMedia: makeMatchMedia({ prefersDark: false }),
  });

  assert.equal(window.document.documentElement.dataset.themeMode, 'dark');
  assert.equal(window.document.documentElement.dataset.theme, 'dark');
  assert.equal(window.localStorage.getItem(STORAGE_KEY), 'light');
});

test('ThemeToggle: URL ?theme=system uses prefers-color-scheme', () => {
  const dom = new JSDOM(`<!doctype html><html><head></head><body>
    <button data-theme-toggle></button>
  </body></html>`, { url: 'https://example.com/post/?theme=system' });

  const { window } = dom;
  window.localStorage.setItem(STORAGE_KEY, 'light');

  initThemeToggle({
    window,
    document: window.document,
    storage: window.localStorage,
    matchMedia: makeMatchMedia({ prefersDark: true }),
  });

  assert.equal(window.document.documentElement.dataset.themeMode, 'system');
  assert.equal(window.document.documentElement.dataset.theme, 'dark');
  assert.equal(window.localStorage.getItem(STORAGE_KEY), 'light');
});

test('ThemeToggle: invalid URL theme param is ignored', () => {
  const dom = new JSDOM(`<!doctype html><html><head></head><body>
    <button data-theme-toggle></button>
  </body></html>`, { url: 'https://example.com/post/?theme=blue' });

  const { window } = dom;
  window.localStorage.setItem(STORAGE_KEY, 'dark');

  initThemeToggle({
    window,
    document: window.document,
    storage: window.localStorage,
    matchMedia: makeMatchMedia({ prefersDark: false }),
  });

  assert.equal(window.document.documentElement.dataset.themeMode, 'dark');
  assert.equal(window.document.documentElement.dataset.theme, 'dark');
});
