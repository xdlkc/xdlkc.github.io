const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const SiteSearch = require('../themes/evan/source/js/site-search');

function createStorageStub() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    _store: store
  };
}

test('SiteSearch: opening a result stores query into recent history and shows chips on next open', async () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <button data-site-search-trigger type="button">open</button>
  </body></html>`, { url: 'https://example.com/' });

  const { window } = dom;
  const { document } = window;

  global.window = window;
  global.document = document;

  // Mock fetch /db.json
  const posts = [
    { title: 'Hello Agent', path: '2026/hello-agent/', tags: ['agent'] }
  ];

  window.fetch = async () => ({ ok: true, json: async () => ({ posts }) });
  global.fetch = window.fetch;

  const assigned = [];
  const locationStub = { assign: (href) => assigned.push(href) };

  const storage = createStorageStub();

  SiteSearch.initSiteSearch({ root: document, location: locationStub, storage });

  // First open
  document.querySelector('[data-site-search-trigger]').click();
  await new Promise((r) => window.setTimeout(r, 0));

  const input = document.querySelector('[data-site-search-input]');
  input.value = 'agent';
  input.dispatchEvent(new window.Event('input', { bubbles: true }));

  await new Promise((r) => window.setTimeout(r, 200));

  // Press Enter to open first result
  input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

  assert.equal(assigned.length, 1);

  // Recent history should be stored
  const raw = storage.getItem('xdlkc:site-search:recent');
  assert.ok(raw);
  assert.match(raw, /agent/i);

  // Re-open: should show recent chips when query is empty
  document.querySelector('[data-site-search-trigger]').click();
  await new Promise((r) => window.setTimeout(r, 0));

  const recent = document.querySelector('[data-site-search-recent]');
  assert.ok(recent, 'should render recent container');

  const chip = document.querySelector('[data-site-search-recent] [data-site-search-keyword]');
  assert.ok(chip, 'should render at least one recent chip');
  assert.equal(chip.getAttribute('data-site-search-keyword').toLowerCase(), 'agent');

  delete global.fetch;
  delete global.window;
  delete global.document;
});
