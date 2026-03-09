const test = require('node:test');
const assert = require('node:assert/strict');

const {
  resolveInitialTheme,
  toggleThemeMode,
  applyThemeToDocument,
  STORAGE_KEY,
} = require('../themes/evan/source/js/theme-toggle.js');

test('resolveInitialTheme: uses saved preference when available (light/dark)', () => {
  const theme = resolveInitialTheme({
    savedMode: 'dark',
    prefersDark: false,
  });
  assert.equal(theme, 'dark');
});

test('resolveInitialTheme: savedMode=system falls back to prefers-color-scheme', () => {
  assert.equal(
    resolveInitialTheme({ savedMode: 'system', prefersDark: true }),
    'dark'
  );
  assert.equal(
    resolveInitialTheme({ savedMode: 'system', prefersDark: false }),
    'light'
  );
});

test('resolveInitialTheme: falls back to prefers-color-scheme when no saved mode', () => {
  const theme = resolveInitialTheme({
    savedMode: null,
    prefersDark: true,
  });
  assert.equal(theme, 'dark');
});

test('toggleThemeMode: cycles system -> light -> dark -> system', () => {
  assert.equal(toggleThemeMode('system'), 'light');
  assert.equal(toggleThemeMode('light'), 'dark');
  assert.equal(toggleThemeMode('dark'), 'system');
});

test('applyThemeToDocument: sets dataset theme + themeMode, updates aria-pressed and label', () => {
  const buttonStub = {
    textContent: '',
    getAttribute: () => null,
    setAttribute: function(key, value) {
      this._attrs[key] = value;
    },
    _attrs: {},
  };

  const documentStub = {
    documentElement: { dataset: {} },
    querySelector: (selector) => {
      if (selector !== '[data-theme-toggle]') return null;
      return buttonStub;
    },
  };

  applyThemeToDocument({
    document: documentStub,
    theme: 'dark',
    mode: 'system',
  });

  assert.equal(documentStub.documentElement.dataset.theme, 'dark');
  assert.equal(documentStub.documentElement.dataset.themeMode, 'system');
  assert.equal(buttonStub._attrs['aria-pressed'], 'true');
  assert.match(buttonStub.textContent, /(主题：|Theme: )/);
});

test('STORAGE_KEY: remains stable', () => {
  assert.equal(STORAGE_KEY, 'xdlkc:theme');
});
