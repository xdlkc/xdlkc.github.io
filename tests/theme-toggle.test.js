const test = require('node:test');
const assert = require('node:assert/strict');

const {
  resolveInitialTheme,
  toggleTheme,
  applyThemeToDocument,
  STORAGE_KEY,
} = require('../themes/evan/source/js/theme-toggle.js');

test('resolveInitialTheme: uses saved preference when available', () => {
  const theme = resolveInitialTheme({
    saved: 'dark',
    prefersDark: false,
  });
  assert.equal(theme, 'dark');
});

test('resolveInitialTheme: falls back to prefers-color-scheme when no saved preference', () => {
  const theme = resolveInitialTheme({
    saved: null,
    prefersDark: true,
  });
  assert.equal(theme, 'dark');
});

test('toggleTheme: flips light <-> dark', () => {
  assert.equal(toggleTheme('light'), 'dark');
  assert.equal(toggleTheme('dark'), 'light');
});

test('applyThemeToDocument: sets dataset and aria-pressed', () => {
  const documentStub = {
    documentElement: { dataset: {} },
    querySelector: (selector) => {
      if (selector !== '[data-theme-toggle]') return null;
      return {
        setAttribute: (key, value) => {
          documentStub._attrs[key] = value;
        },
      };
    },
    _attrs: {},
  };

  applyThemeToDocument({ document: documentStub, theme: 'dark' });

  assert.equal(documentStub.documentElement.dataset.theme, 'dark');
  assert.equal(documentStub._attrs['aria-pressed'], 'true');
});

test('STORAGE_KEY: remains stable', () => {
  assert.equal(STORAGE_KEY, 'xdlkc:theme');
});
