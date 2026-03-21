const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Helper to load a script into the JSDOM context
function loadScriptInto(dom, filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  const context = dom.getInternalVMContext();
  vm.runInContext(code, context, { filename: filePath });
}

// Mock localStorage
let mockLocalStorage = {};
function setupLocalStorageMock(window) {
  window.localStorage = {
    getItem: (key) => mockLocalStorage[key] || null,
    setItem: (key, value) => { mockLocalStorage[key] = String(value); },
    removeItem: (key) => { delete mockLocalStorage[key]; },
    clear: () => { mockLocalStorage = {}; }
  };
}

// Setup JSDOM with necessary globals and mock Date for time control
function setupDom(hour, minute, config) {
  const mockDate = new Date(2026, 2, 21, hour, minute, 0); // Year, Month (0-11), Day, Hour, Minute, Second
  const originalDate = global.Date;
  global.Date = class extends originalDate {
    constructor(dateString) {
      if (dateString) {
        return new originalDate(dateString);
      }
      return mockDate;
    }
  };
  global.Date.now = () => mockDate.getTime();

  const dom = new JSDOM(`<!doctype html><html data-theme="light"><body></body></html>`, {
    runScripts: 'outside-only',
    url: `http://localhost/?theme=${config.urlThemeOverride || ''}`
  });

  const { window } = dom;
  const { document } = window;

  // Set CONFIG
  window.CONFIG = {
    root: '/',
    path: 'search.json',
    localsearch: { trigger: 'auto', preload: false, unescape: false, top_n_per_article: 1 },
    ...config
  };

  setupLocalStorageMock(window);

  // Re-define matchMedia mock for consistent system preference
  window.matchMedia = (query) => ({
    matches: query === '(prefers-color-scheme: dark)' ? (config.prefersDark || false) : !(config.prefersDark || false),
    addEventListener: () => {},
    removeEventListener: () => {},
  });


  // Load the main theme toggle script
  const scriptPath = path.resolve(__dirname, '../themes/evan/source/js/theme-toggle.js');
  loadScriptInto(dom, scriptPath);

  // Directly call initThemeToggle instead of relying on DOMContentLoaded for testing
  window.ThemeToggle.init({ window, document, storage: window.localStorage, matchMedia: window.matchMedia });

  return { dom, window, document };
}

test('ThemeAutoSwitcher: should apply dark theme automatically at night when enabled', async () => {
  mockLocalStorage = {}; // Clear localStorage for each test

  // Simulate 9 PM (night time)
  const { document } = setupDom(21, 0, {
    auto_dark_mode: {
      enable: true,
      sunrise_hour: 8,
      sunset_hour: 18
    }
  });

  // Since theme-toggle.js runs on DOMContentLoaded, we expect the theme to be applied immediately.
  // Give a small delay for any potential async operations (though theme-toggle is mostly sync on init).
  await new Promise(resolve => setTimeout(resolve, 10));

  assert.equal(document.documentElement.dataset.theme, 'dark', 'Theme should be dark at 9 PM');
});

test('ThemeAutoSwitcher: should apply light theme automatically during day when enabled', async () => {
  mockLocalStorage = {}; // Clear localStorage for each test

  // Simulate 9 AM (day time)
  const { document } = setupDom(9, 0, {
    auto_dark_mode: {
      enable: true,
      sunrise_hour: 8,
      sunset_hour: 18
    }
  });

  await new Promise(resolve => setTimeout(resolve, 10));
  console.log('DEBUG: document.documentElement.dataset.theme just before assertion:', document.documentElement.dataset.theme);
  assert.equal(document.documentElement.dataset.theme, 'light', 'Theme should be light at 9 AM');
});

test('ThemeAutoSwitcher: should not auto-switch when disabled', async () => {
  mockLocalStorage = {}; // Clear localStorage for each test
  // Simulate 9 PM, but auto_dark_mode is disabled
  const { document } = setupDom(21, 0, {
    auto_dark_mode: {
      enable: false,
      sunrise_hour: 8,
      sunset_hour: 18
    },
    prefersDark: false // Assume system prefers light
  });

  await new Promise(resolve => setTimeout(resolve, 10));

  assert.equal(document.documentElement.dataset.theme, 'light', 'Theme should remain light if auto-switch is disabled');
});

test('ThemeAutoSwitcher: manual selection overrides auto-switch for the current period', async () => {
  mockLocalStorage = {}; // Clear localStorage for each test

  // Simulate 9 PM (night), auto-switch would make it dark
  const { window, document } = setupDom(21, 0, {
    auto_dark_mode: {
      enable: true,
      sunrise_hour: 8,
      sunset_hour: 18
    }
  });

  // Manually set to light mode
  window.localStorage.setItem('xdlkc:theme', 'light');

  // Re-initialize or trigger theme logic (e.g., a page reload would re-run init)
  // For this test, we simulate a manual toggle in a separate test, but here we just check persistence.
  // The theme-toggle.js script runs on DOMContentLoaded, which is done in setupDom.
  // It should read localStorage and apply that.
  await new Promise(resolve => setTimeout(resolve, 10));

  assert.equal(document.documentElement.dataset.theme, 'light', 'Manual selection (light) should override auto-switch (dark)');
});

// Test for priority: URL param > Manual > Auto > System
test('ThemeAutoSwitcher: URL param should override auto-switch', async () => {
  mockLocalStorage = {}; // Clear localStorage for each test

  // Simulate 9 PM (night), auto-switch would make it dark
  const { document } = setupDom(21, 0, {
    auto_dark_mode: {
      enable: true,
      sunrise_hour: 8,
      sunset_hour: 18
    },
    urlThemeOverride: 'light' // URL parameter set to light
  });

  await new Promise(resolve => setTimeout(resolve, 10));

  assert.equal(document.documentElement.dataset.theme, 'light', 'URL param (light) should override auto-switch (dark)');
});

test('ThemeAutoSwitcher: system preference should be fallback when no manual or auto-switch', async () => {
  mockLocalStorage = {}; // Clear localStorage for each test

  // Simulate 9 AM (day), auto_dark_mode disabled, no manual preference
  const { document } = setupDom(9, 0, {
    auto_dark_mode: {
      enable: false, // Auto-switch disabled
      sunrise_hour: 8,
      sunset_hour: 18
    },
    prefersDark: true // System prefers dark
  });

  await new Promise(resolve => setTimeout(resolve, 10));

  assert.equal(document.documentElement.dataset.theme, 'dark', 'System preference (dark) should be applied');
});
