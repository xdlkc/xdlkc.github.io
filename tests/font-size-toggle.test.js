const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const {
  STORAGE_KEY,
  toggleFontSizeMode,
  applyFontSizeToDocument,
  initFontSizeToggle,
} = require('../themes/evan/source/js/font-size-toggle.js');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('STORAGE_KEY remains stable', () => {
  assert.equal(STORAGE_KEY, 'xdlkc:font-size');
});

test('toggleFontSizeMode cycles normal -> lg -> sm -> normal', () => {
  assert.equal(toggleFontSizeMode('normal'), 'lg');
  assert.equal(toggleFontSizeMode('lg'), 'sm');
  assert.equal(toggleFontSizeMode('sm'), 'normal');
});

test('applyFontSizeToDocument sets dataset.fontSize and button label', () => {
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
      if (selector !== '[data-font-size-toggle]') return null;
      return buttonStub;
    },
  };

  applyFontSizeToDocument({ document: documentStub, mode: 'lg' });

  assert.equal(documentStub.documentElement.dataset.fontSize, 'lg');
  assert.match(buttonStub.textContent, /(字号：|Font: )/);
});

test('initFontSizeToggle wires click handler and persists to storage', () => {
  const dom = new JSDOM(
    '<!doctype html><html><body><button data-font-size-toggle></button><article class="article-content"><p>hi</p></article></body></html>',
    { url: 'https://example.com/' }
  );

  const storage = {
    _data: new Map(),
    getItem(key) {
      return this._data.get(key) || null;
    },
    setItem(key, value) {
      this._data.set(key, String(value));
    },
  };

  initFontSizeToggle({ document: dom.window.document, storage });

  const button = dom.window.document.querySelector('[data-font-size-toggle]');
  assert.ok(button);

  // default should be normal
  assert.equal(dom.window.document.documentElement.dataset.fontSize, 'normal');

  button.click();
  assert.equal(dom.window.document.documentElement.dataset.fontSize, 'lg');
  assert.equal(storage.getItem(STORAGE_KEY), 'lg');
});

test('layout loads font-size-toggle script and templates include the toggle button', () => {
  const layout = read('themes/evan/layout/layout.ejs');
  assert.match(layout, /\/js\/font-size-toggle\.js/);

  const templates = [
    'themes/evan/layout/post.ejs',
    'themes/evan/layout/page.ejs',
    'themes/evan/layout/index.ejs',
    'themes/evan/layout/archive.ejs',
    'themes/evan/layout/news.ejs',
  ];

  templates.forEach((file) => {
    const content = read(file);
    assert.match(content, /data-font-size-toggle/);
  });
});
