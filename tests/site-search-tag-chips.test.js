const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const SiteSearch = require('../themes/evan/source/js/site-search');

function createStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    }
  };
}

test('SiteSearch: clicking tag chips fills #tag and triggers input', async () => {
  const dom = new JSDOM(`<!doctype html><html data-lang-mode="zh"><body>
    <button data-site-search-trigger>Search</button>
  </body></html>`, { url: 'https://example.com/' });

  const { document, Event } = dom.window;

  // Stub fetch so initSiteSearch can prefetch without failing.
  dom.window.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ posts: [] })
  });

  const storage = createStorage();

  SiteSearch.initSiteSearch({ root: document, storage, location: { assign() {} } });

  // Open dialog.
  document.querySelector('[data-site-search-trigger]').click();

  const input = document.querySelector('[data-site-search-input]');
  assert.ok(input);

  let inputEvents = 0;
  input.addEventListener('input', () => { inputEvents += 1; });

  // Render a result with tags.
  SiteSearch.renderResults({
    root: document,
    query: 'hello',
    results: [{ title: 'Hello', path: '2026/01/01/hello/', tags: ['AI'] }],
    suggestions: { topTags: ['AI'] }
  });

  const tagChip = document.querySelector('.site-search-tag');
  assert.ok(tagChip, 'expected a tag chip to be rendered');

  tagChip.click();

  assert.equal(input.value, '#AI');
  assert.ok(inputEvents >= 1, 'expected clicking a tag chip to trigger input event');
});

test('SiteSearch: top tag chips in empty-query state fills #tag', () => {
  const dom = new JSDOM(`<!doctype html><html data-lang-mode="zh"><body>
    <button data-site-search-trigger>Search</button>
  </body></html>`, { url: 'https://example.com/' });

  const { document } = dom.window;

  dom.window.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ posts: [] })
  });

  const storage = createStorage();

  SiteSearch.initSiteSearch({ root: document, storage, location: { assign() {} } });

  document.querySelector('[data-site-search-trigger]').click();

  const input = document.querySelector('[data-site-search-input]');
  assert.ok(input);

  // Render empty query suggestions.
  SiteSearch.renderResults({
    root: document,
    query: '',
    results: [],
    suggestions: { topTags: ['AI'], recentQueries: [] }
  });

  const topTagChip = document.querySelector('[data-site-search-top-tags] [data-site-search-keyword]');
  assert.ok(topTagChip);

  topTagChip.click();

  assert.equal(input.value, '#AI');
});
