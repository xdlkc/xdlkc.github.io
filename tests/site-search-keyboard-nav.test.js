const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const SiteSearch = require('../themes/evan/source/js/site-search');

test('site search: ArrowUp/Down selects results and Enter opens selected', async () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <button data-site-search-trigger>open</button>
  </body></html>`, { url: 'https://example.com/' });

  const { window } = dom;
  const { document } = window;

  // Mock fetch /db.json
  const posts = [
    { title: 'Hello World', path: '2026/hello-world/', tags: ['intro'] },
    { title: 'Hello Agent', path: '2026/hello-agent/', tags: ['agent'] }
  ];

  window.fetch = async () => ({
    ok: true,
    json: async () => ({ posts })
  });

  // jsdom doesn't automatically expose fetch on globalThis used in code.
  global.fetch = window.fetch;

  const assigned = [];
  const location = {
    assign: (href) => assigned.push(href)
  };

  SiteSearch.initSiteSearch({ root: document, location });

  // Open dialog
  document.querySelector('[data-site-search-trigger]').click();

  const dialog = document.querySelector('[data-site-search-dialog]');
  const input = dialog.querySelector('[data-site-search-input]');

  // Type query
  input.value = 'hello';
  input.dispatchEvent(new window.Event('input', { bubbles: true }));

  // Wait for debounce + render
  await new Promise((r) => window.setTimeout(r, 200));

  const items = Array.from(dialog.querySelectorAll('.site-search-item'));
  assert.equal(items.length, 2);

  // ArrowDown selects first
  input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  assert.ok(items[0].classList.contains('is-selected'));
  assert.ok(!items[1].classList.contains('is-selected'));

  // ArrowDown selects second
  input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  assert.ok(!items[0].classList.contains('is-selected'));
  assert.ok(items[1].classList.contains('is-selected'));

  // ArrowUp back to first
  input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
  assert.ok(items[0].classList.contains('is-selected'));
  assert.ok(!items[1].classList.contains('is-selected'));

  // Enter opens selected
  input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  assert.equal(assigned.length, 1);
  assert.ok(String(assigned[0]).includes('hello-agent'));
});
