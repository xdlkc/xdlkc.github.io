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

test('SiteSearch: renders category chips and clicking fills cat:<category>', async () => {
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

  let inputEvents = 0;
  input.addEventListener('input', () => { inputEvents += 1; });

  SiteSearch.renderResults({
    root: document,
    query: 'hello',
    results: [{ title: 'Hello', path: '2026/01/01/hello/', tags: ['AI'], categories: ['Life'] }],
    suggestions: { topTags: ['AI'] }
  });

  const catChip = document.querySelector('.site-search-category');
  assert.ok(catChip, 'expected a category chip to be rendered');

  catChip.click();

  assert.equal(input.value, 'cat:Life');
  assert.ok(inputEvents >= 1, 'expected clicking a category chip to trigger input event');
});
