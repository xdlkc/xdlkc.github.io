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

test('SiteSearch: clicking page keyword chip opens modal and fills query', async () => {
  const dom = new JSDOM(`<!doctype html><html data-lang-mode="zh"><body>
    <button data-site-search-trigger>Search</button>
    <button type="button" class="related-posts-tag" data-site-search-open data-site-search-keyword="AI" data-site-search-keyword-mode="tag">AI</button>
  </body></html>`, { url: 'https://example.com/' });

  const { document } = dom.window;

  dom.window.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ posts: [] })
  });

  const storage = createStorage();

  SiteSearch.initSiteSearch({ root: document, storage, location: { assign() {} } });

  const chip = document.querySelector('[data-site-search-open][data-site-search-keyword]');
  assert.ok(chip);

  chip.click();

  const dialog = document.querySelector('[data-site-search-dialog]');
  assert.ok(dialog, 'expected search dialog to exist');
  assert.ok(dialog.classList.contains('is-open'), 'expected search dialog to be opened');

  const input = document.querySelector('[data-site-search-input]');
  assert.ok(input);
  assert.equal(input.value, '#AI');
});
