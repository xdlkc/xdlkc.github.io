const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('layout loads lang-toggle script and templates include toggle button', () => {
  const layout = read('themes/evan/layout/layout.ejs');
  assert.match(layout, /\/js\/lang-toggle\.js/);

  const templates = [
    'themes/evan/layout/post.ejs',
    'themes/evan/layout/page.ejs',
    'themes/evan/layout/index.ejs',
    'themes/evan/layout/archive.ejs',
    'themes/evan/layout/news.ejs',
  ];

  templates.forEach((file) => {
    const content = read(file);
    assert.match(content, /data-lang-toggle/);
  });
});

test('LangToggle: defaults to en and toggles to zh', () => {
  const LangToggle = require('../themes/evan/source/js/lang-toggle.js');
  const dom = new JSDOM(
    '<!doctype html><html><body><button data-lang-toggle></button><a data-i18n-key="nav.news">News</a></body></html>',
    { url: 'https://example.com/' }
  );

  const storage = {
    _data: new Map(),
    getItem(key) { return this._data.get(key) || null; },
    setItem(key, value) { this._data.set(key, String(value)); },
  };

  LangToggle.initLangToggle({ document: dom.window.document, storage });
  assert.equal(dom.window.document.documentElement.dataset.langMode, 'en');
  assert.equal(dom.window.document.querySelector('[data-i18n-key="nav.news"]').textContent, 'News');

  dom.window.document.querySelector('[data-lang-toggle]').click();
  assert.equal(dom.window.document.documentElement.dataset.langMode, 'zh');
  assert.equal(dom.window.document.querySelector('[data-i18n-key="nav.news"]').textContent, '新闻');
});
