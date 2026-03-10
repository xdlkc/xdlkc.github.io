const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

function makeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
    removeItem(key) {
      map.delete(key);
    },
    _dump() {
      return Object.fromEntries(map.entries());
    }
  };
}

test('SiteSearch shows clear-recent button and clears history on click', () => {
  const SiteSearch = require('../themes/evan/source/js/site-search.js');

  const dom = new JSDOM(`<!doctype html><html data-lang-mode="zh"><body></body></html>`, {
    url: 'https://example.com/'
  });

  global.window = dom.window;
  global.document = dom.window.document;

  const storage = makeStorage({
    'xdlkc:site-search:recent': JSON.stringify(['alpha', 'beta'])
  });

  const root = document;

  SiteSearch.initSiteSearch({ root, storage });
  SiteSearch.ensureDialog({ root });
  SiteSearch.renderResults({
    root,
    query: '',
    results: [],
    suggestions: {
      topTags: ['tag1'],
      recentQueries: ['alpha', 'beta']
    }
  });

  const clearBtn = root.querySelector('[data-site-search-clear-recent]');
  assert.ok(clearBtn, 'expected clear recent button');

  clearBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

  const raw = storage.getItem('xdlkc:site-search:recent');
  assert.equal(raw, JSON.stringify([]));

  const recent = root.querySelector('[data-site-search-recent]');
  assert.equal(recent, null);

  delete global.window;
  delete global.document;
});
