const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const path = require('path');

// Load the font-size-toggle.js module
const fontSizeTogglePath = path.join(__dirname, '../themes/evan/source/js/font-size-toggle.js');

function setupDom() {
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="utf-8">
      <title>Test</title>
    </head>
    <body>
      <article class="article-content">
        <p>Test article content</p>
      </article>
      <button class="font-size-toggle" data-font-size-toggle>Font</button>
    </body>
    </html>
  `, { url: 'https://example.com/test' });

  const { window } = dom;
  global.window = window;
  global.document = window.document;

  return dom;
}

function setupMockLocalStorage() {
  const mockLocalStorage = {
    data: {},
    getItem(key) {
      return this.data[key] || null;
    },
    setItem(key, value) {
      this.data[key] = String(value);
    },
    removeItem(key) {
      delete this.data[key];
    },
    clear() {
      this.data = {};
    }
  };
  global.localStorage = mockLocalStorage;
  return mockLocalStorage;
}

test('Font Size Levels: should define all font size levels', (t) => {
  // Reload module for each test
  delete require.cache[require.resolve(fontSizeTogglePath)];
  const FontSizeToggle = require(fontSizeTogglePath);

  assert.ok(FontSizeToggle.FONT_SIZES);
  assert.strictEqual(FontSizeToggle.FONT_SIZES.small, '14px');
  assert.strictEqual(FontSizeToggle.FONT_SIZES.medium, '16px');
  assert.strictEqual(FontSizeToggle.FONT_SIZES.large, '18px');
  assert.strictEqual(FontSizeToggle.FONT_SIZES['extra-large'], '20px');
});

test('Font Size Levels: should have correct mapping between level and size', (t) => {
  const FontSizeToggle = require(fontSizeTogglePath);

  assert.strictEqual(FontSizeToggle.getFontSizeByLevel('small'), '14px');
  assert.strictEqual(FontSizeToggle.getFontSizeByLevel('medium'), '16px');
  assert.strictEqual(FontSizeToggle.getFontSizeByLevel('large'), '18px');
  assert.strictEqual(FontSizeToggle.getFontSizeByLevel('extra-large'), '20px');
  assert.strictEqual(FontSizeToggle.getFontSizeByLevel('invalid'), '16px'); // fallback to medium
});

test('Font Size Levels: should cycle through font size levels', (t) => {
  const FontSizeToggle = require(fontSizeTogglePath);

  assert.strictEqual(FontSizeToggle.getNextFontSizeLevel('medium'), 'large');
  assert.strictEqual(FontSizeToggle.getNextFontSizeLevel('large'), 'extra-large');
  assert.strictEqual(FontSizeToggle.getNextFontSizeLevel('extra-large'), 'small');
  assert.strictEqual(FontSizeToggle.getNextFontSizeLevel('small'), 'medium');
});

test('LocalStorage: should save font size level to localStorage', (t) => {
  delete require.cache[require.resolve(fontSizeTogglePath)];
  const FontSizeToggle = require(fontSizeTogglePath);
  const storage = setupMockLocalStorage();
  // console.log('FontSizeToggle exports in LocalStorage test:', Object.keys(FontSizeToggle));

  FontSizeToggle.saveFontSizeLevel(storage, 'large');

  assert.strictEqual(storage.getItem('xdlkc:font-size'), 'large');
});

test('LocalStorage: should load font size level from localStorage', (t) => {
  delete require.cache[require.resolve(fontSizeTogglePath)];
  const FontSizeToggle = require(fontSizeTogglePath);
  const storage = setupMockLocalStorage();

  storage.setItem('xdlkc:font-size', 'small'); // Use storage.setItem directly as saveFontSizeLevel relies on load
  const level = FontSizeToggle.loadFontSizeLevel(storage);

  assert.strictEqual(level, 'small');
});

test('LocalStorage: should return medium as default when localStorage is empty', (t) => {
  const FontSizeToggle = require(fontSizeTogglePath);
  const storage = setupMockLocalStorage();

  const level = FontSizeToggle.loadFontSizeLevel(storage);

  assert.strictEqual(level, 'medium');
});

test('LocalStorage: should return medium as default when localStorage has invalid value', (t) => {
  const FontSizeToggle = require(fontSizeTogglePath);
  const storage = setupMockLocalStorage();

  storage.setItem('xdlkc:font-size', 'invalid');
  const level = FontSizeToggle.loadFontSizeLevel(storage);

  assert.strictEqual(level, 'medium');
});

test('CSS Variable: should set CSS variable on article content', (t) => {
  setupDom();
  const FontSizeToggle = require(fontSizeTogglePath);
  const document = global.document;
  const articleContent = document.querySelector('.article-content');

  FontSizeToggle.applyFontSizeToDocument({ document, level: 'large' });

  assert.strictEqual(articleContent.style.getPropertyValue('--article-font-size'), '18px');
});

test('CSS Variable: should update CSS variable when font size changes', (t) => {
  setupDom();
  const FontSizeToggle = require(fontSizeTogglePath);
  const document = global.document;
  const articleContent = document.querySelector('.article-content');

  FontSizeToggle.applyFontSizeToDocument({ document, level: 'small' });
  assert.strictEqual(articleContent.style.getPropertyValue('--article-font-size'), '14px');

  FontSizeToggle.applyFontSizeToDocument({ document, level: 'extra-large' });
  assert.strictEqual(articleContent.style.getPropertyValue('--article-font-size'), '20px');
});

test('CSS Variable: should use medium as default when level is invalid', (t) => {
  setupDom();
  const FontSizeToggle = require(fontSizeTogglePath);
  const document = global.document;
  const articleContent = document.querySelector('.article-content');

  FontSizeToggle.applyFontSizeToDocument({ document, level: 'invalid' });

  assert.strictEqual(articleContent.style.getPropertyValue('--article-font-size'), '16px');
});

test('Toggle Button: should update button text when font size changes', (t) => {
  setupDom();
  const FontSizeToggle = require(fontSizeTogglePath);
  const document = global.document;
  const button = document.querySelector('[data-font-size-toggle]');

  FontSizeToggle.updateButtonText({ button, level: 'medium', lang: 'en' });
  assert.strictEqual(button.textContent, 'Font: Medium');

  FontSizeToggle.updateButtonText({ button, level: 'large', lang: 'zh' });
  assert.strictEqual(button.textContent, '字体：大号');
});

test('Toggle Button: should cycle through font sizes when button is clicked', (t) => {
  setupDom();
  const FontSizeToggle = require(fontSizeTogglePath);
  const storage = setupMockLocalStorage();
  const document = global.document;
  const button = document.querySelector('[data-font-size-toggle]');

  // Initialize with medium
  FontSizeToggle.initFontSizeToggle({ document, storage });

  assert.ok(button.textContent.includes('Medium'));

  // Click button
  button.click();

  // Should change to large
  assert.ok(button.textContent.includes('Large'));
});

test('Initialization: should restore saved font size on initialization', (t) => {
  setupDom();
  const storage = setupMockLocalStorage();
  storage.setItem('xdlkc:font-size', 'large');

  const FontSizeToggle = require(fontSizeTogglePath);
  const document = global.document;
  const articleContent = document.querySelector('.article-content');

  FontSizeToggle.initFontSizeToggle({ document, storage });

  assert.strictEqual(articleContent.style.getPropertyValue('--article-font-size'), '18px');
});

test('Initialization: should use medium as default when no saved font size', (t) => {
  setupDom();
  const storage = setupMockLocalStorage();

  const FontSizeToggle = require(fontSizeTogglePath);
  const document = global.document;
  const articleContent = document.querySelector('.article-content');

  FontSizeToggle.initFontSizeToggle({ document, storage });

  assert.strictEqual(articleContent.style.getPropertyValue('--article-font-size'), '16px');
});

test('Cross-tab Sync: should update font size when another tab changes localStorage', (t) => {
  setupDom();
  const storage = setupMockLocalStorage();

  const FontSizeToggle = require(fontSizeTogglePath);
  const document = global.document;
  const articleContent = document.querySelector('.article-content');
  const window = global.window;

  FontSizeToggle.initFontSizeToggle({ document, storage });

  // Simulate storage event from another tab
  const event = new window.StorageEvent('storage', {
    key: 'xdlkc:font-size',
    newValue: 'extra-large',
    oldValue: 'medium'
  });

  window.dispatchEvent(event);

  assert.strictEqual(articleContent.style.getPropertyValue('--article-font-size'), '20px');
});

test('Language Support: should display Chinese labels when langMode is zh', (t) => {
  setupDom();
  const FontSizeToggle = require(fontSizeTogglePath);
  const document = global.document;
  const button = document.querySelector('[data-font-size-toggle]');

  document.documentElement.dataset.langMode = 'zh';
  FontSizeToggle.updateButtonText({ button, level: 'medium', lang: 'zh' });
  assert.strictEqual(button.textContent, '字体：中号');
});

test('Language Support: should display English labels when langMode is en', (t) => {
  setupDom();
  const FontSizeToggle = require(fontSizeTogglePath);
  const document = global.document;
  const button = document.querySelector('[data-font-size-toggle]');

  document.documentElement.dataset.langMode = 'en';
  FontSizeToggle.updateButtonText({ button, level: 'medium', lang: 'en' });
  assert.strictEqual(button.textContent, 'Font: Medium');
});
