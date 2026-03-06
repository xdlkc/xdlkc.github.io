const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

test('SiteSearch: no-result state shows keyword chips and clicking chip updates query', async () => {
  const SiteSearch = require('../themes/evan/source/js/site-search.js');

  const dom = new JSDOM(`<!doctype html><html><body>
    <button data-site-search-trigger>Search</button>
  </body></html>`, {
    url: 'https://example.com/',
    runScripts: 'outside-only'
  });

  dom.window.fetch = async () => ({
    ok: true,
    json: async () => ({
      posts: [
        { title: 'Alpha', path: '2026/alpha/', tags: ['intro'] }
      ]
    })
  });

  // Expose globals to match script expectations.
  global.window = dom.window;
  global.document = dom.window.document;

  // Init search.
  SiteSearch.initSiteSearch({ root: document });

  // Open dialog.
  document.querySelector('[data-site-search-trigger]').click();
  await new Promise((r) => setTimeout(r, 0));

  const dialog = document.querySelector('[data-site-search-dialog]');
  assert.ok(dialog);

  const input = dialog.querySelector('[data-site-search-input]');
  assert.ok(input);

  input.value = 'foo bar';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 250));

  const chips = [...document.querySelectorAll('[data-site-search-keyword]')].map((el) =>
    el.getAttribute('data-site-search-keyword')
  );

  assert.deepEqual(chips.sort(), ['bar', 'foo']);

  const fooChip = document.querySelector('[data-site-search-keyword="foo"]');
  fooChip.click();

  assert.equal(input.value, 'foo');

  delete global.window;
  delete global.document;
});
