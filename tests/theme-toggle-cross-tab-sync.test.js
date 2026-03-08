const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const ThemeToggle = require('../themes/evan/source/js/theme-toggle.js');

function setupDom({ savedMode = 'light' } = {}) {
  const dom = new JSDOM(
    `<!doctype html><html><body><button data-theme-toggle></button></body></html>`,
    { url: 'https://example.com/' }
  );

  global.window = dom.window;
  global.document = dom.window.document;

  dom.window.localStorage.setItem(ThemeToggle.STORAGE_KEY, savedMode);

  return dom;
}

function makeMatchMedia({ prefersDark = false } = {}) {
  return () => ({
    matches: prefersDark,
    addEventListener: () => {},
    removeEventListener: () => {},
  });
}

test('ThemeToggle: storage event syncs theme mode across tabs', () => {
  const dom = setupDom({ savedMode: 'light' });

  ThemeToggle.initThemeToggle({
    window: dom.window,
    document: dom.window.document,
    storage: dom.window.localStorage,
    matchMedia: makeMatchMedia({ prefersDark: false }),
  });

  assert.equal(dom.window.document.documentElement.dataset.theme, 'light');

  dom.window.localStorage.setItem(ThemeToggle.STORAGE_KEY, 'dark');
  dom.window.dispatchEvent(
    new dom.window.StorageEvent('storage', {
      key: ThemeToggle.STORAGE_KEY,
      newValue: 'dark',
    })
  );

  assert.equal(dom.window.document.documentElement.dataset.theme, 'dark');
  assert.equal(dom.window.document.documentElement.dataset.themeMode, 'dark');
});

test('ThemeToggle: ignores unrelated storage keys', () => {
  const dom = setupDom({ savedMode: 'light' });

  ThemeToggle.initThemeToggle({
    window: dom.window,
    document: dom.window.document,
    storage: dom.window.localStorage,
    matchMedia: makeMatchMedia({ prefersDark: false }),
  });

  dom.window.dispatchEvent(
    new dom.window.StorageEvent('storage', {
      key: 'other:key',
      newValue: 'dark',
    })
  );

  assert.equal(dom.window.document.documentElement.dataset.theme, 'light');
});
