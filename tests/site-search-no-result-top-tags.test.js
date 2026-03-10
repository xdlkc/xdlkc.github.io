const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

test('SiteSearch: no-result state also suggests top tags when available', async () => {
  const SiteSearch = require('../themes/evan/source/js/site-search.js');

  const dom = new JSDOM(`<!doctype html><html><body>
    <button data-site-search-trigger>Search</button>
  </body></html>`, {
    url: 'https://example.com/',
    runScripts: 'outside-only'
  });

  // Ensure top tags can be computed (minCount=2).
  dom.window.fetch = async () => ({
    ok: true,
    json: async () => ({
      posts: [
        { title: 'Alpha', path: '2026/alpha/', tags: ['agent', 'intro'] },
        { title: 'Beta', path: '2026/beta/', tags: ['agent'] },
        { title: 'Gamma', path: '2026/gamma/', tags: ['misc'] }
      ]
    })
  });

  global.window = dom.window;
  global.document = dom.window.document;
  // site-search.js fetches db via global fetch in Node test environment.
  global.fetch = dom.window.fetch;

  SiteSearch.initSiteSearch({ root: document });

  document.querySelector('[data-site-search-trigger]').click();
  await new Promise((r) => setTimeout(r, 0));

  const dialog = document.querySelector('[data-site-search-dialog]');
  assert.ok(dialog);

  const input = dialog.querySelector('[data-site-search-input]');
  assert.ok(input);

  input.value = 'zzzznotfound';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 250));

  // Should have an empty state.
  assert.ok(document.querySelector('[data-site-search-empty]'));

  // Should suggest top tags chips ("agent" is counted twice).
  const chip = document.querySelector('[data-site-search-keyword="agent"]');
  assert.ok(chip);

  // Clicking the chip should update query.
  chip.click();
  assert.equal(input.value, '#agent');

  delete global.fetch;
  delete global.window;
  delete global.document;
});
