const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

function mockFetchWithEmptyDb(win) {
  win.fetch = async () => ({
    ok: true,
    status: 200,
    async json() {
      return { posts: [] };
    }
  });
}

test('SiteSearch restores last query when reopening and triggers a search render', async () => {
  const SiteSearch = require('../themes/evan/source/js/site-search.js');

  const dom = new JSDOM(`<!doctype html><html><body>
    <button data-site-search-trigger>搜索</button>
  </body></html>`, { url: 'https://example.com/' });

  global.window = dom.window;
  global.document = dom.window.document;

  mockFetchWithEmptyDb(window);

  window.localStorage.setItem('xdlkc:site-search:last', 'hello');

  SiteSearch.initSiteSearch({ root: document, storage: window.localStorage });

  // Open with shortcut.
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: '/', bubbles: true }));

  const dialog = document.querySelector('[data-site-search-dialog]');
  assert.ok(dialog);
  assert.ok(dialog.classList.contains('is-open'));

  const input = dialog.querySelector('[data-site-search-input]');
  assert.ok(input);

  // Allow async search render.
  await new Promise((r) => setTimeout(r, 0));

  assert.equal(input.value, 'hello');

  const results = dialog.querySelector('[data-site-search-results]');
  assert.ok(results);
  assert.ok(String(results.textContent || '').includes('hello'));

  delete global.window;
  delete global.document;
});

test('SiteSearch ESC-clear also clears persisted last query', async () => {
  const SiteSearch = require('../themes/evan/source/js/site-search.js');

  const dom = new JSDOM(`<!doctype html><html><body>
    <button data-site-search-trigger>搜索</button>
  </body></html>`, { url: 'https://example.com/' });

  global.window = dom.window;
  global.document = dom.window.document;

  mockFetchWithEmptyDb(window);

  window.localStorage.setItem('xdlkc:site-search:last', 'hello');

  SiteSearch.initSiteSearch({ root: document, storage: window.localStorage });

  // Open dialog.
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: '/', bubbles: true }));
  await new Promise((r) => setTimeout(r, 0));

  const dialog = document.querySelector('[data-site-search-dialog]');
  const input = dialog.querySelector('[data-site-search-input]');
  assert.equal(input.value, 'hello');

  // First ESC clears input (but keeps modal open).
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(input.value, '');

  // Second ESC closes.
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

  // Reopen: should NOT restore.
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: '/', bubbles: true }));
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(input.value, '');

  delete global.window;
  delete global.document;
});
