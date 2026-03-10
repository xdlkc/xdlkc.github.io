const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

test('SiteSearch: Escape clears input first, then closes dialog', async () => {
  const SiteSearch = require('../themes/evan/source/js/site-search.js');

  const dom = new JSDOM(`<!doctype html><html><body>
    <button data-site-search-trigger>Search</button>
  </body></html>`, {
    url: 'https://example.com/',
    runScripts: 'outside-only'
  });

  dom.window.fetch = async () => ({
    ok: true,
    json: async () => ({ posts: [] })
  });

  global.window = dom.window;
  global.document = dom.window.document;

  SiteSearch.initSiteSearch({ root: document });

  document.querySelector('[data-site-search-trigger]').click();
  await new Promise((r) => setTimeout(r, 0));

  const dialog = document.querySelector('[data-site-search-dialog]');
  assert.ok(dialog);
  assert.ok(dialog.classList.contains('is-open'));

  const input = dialog.querySelector('[data-site-search-input]');
  input.value = 'something';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 250));

  // First Escape: clear input, keep open.
  const esc = new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
  document.dispatchEvent(esc);

  assert.ok(dialog.classList.contains('is-open'));
  assert.equal(input.value, '');

  // Second Escape: close.
  document.dispatchEvent(esc);
  assert.ok(!dialog.classList.contains('is-open'));

  delete global.window;
  delete global.document;
});
