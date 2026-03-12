const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

test('SiteSearch Ctrl/Cmd+Enter opens selected result in a new tab and closes dialog', () => {
  const SiteSearch = require('../themes/evan/source/js/site-search.js');

  const dom = new JSDOM(`<!doctype html><html><body>
    <button data-site-search-trigger>Search</button>
  </body></html>`, { url: 'https://example.com/' });

  global.window = dom.window;
  global.document = dom.window.document;

  let opened = null;
  dom.window.open = (href, target, features) => {
    opened = { href, target, features };
    return null;
  };

  SiteSearch.initSiteSearch({ root: document });

  // Open dialog.
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: '/', bubbles: true }));

  // Render results (bypass network fetch).
  SiteSearch.renderResults({
    root: document,
    query: 'hello',
    results: [{ title: 'Hello', path: '2026/03/hello/', tags: [], categories: [] }],
    suggestions: { topTags: [], allTags: [] }
  });

  const dialog = document.querySelector('[data-site-search-dialog]');
  const input = dialog.querySelector('[data-site-search-input]');

  // Select first item.
  input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));

  // Ctrl+Enter opens in new tab.
  input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true }));

  assert.ok(opened, 'should call window.open');
  assert.equal(opened.href, 'https://example.com/2026/03/hello/');
  assert.equal(opened.target, '_blank');
  assert.match(String(opened.features || ''), /noopener/);

  assert.equal(dialog.getAttribute('aria-hidden'), 'true');
  assert.ok(!dialog.classList.contains('is-open'));

  delete global.window;
  delete global.document;
});

test('SiteSearch Ctrl/Cmd+Enter opens first result when none selected', () => {
  const SiteSearch = require('../themes/evan/source/js/site-search.js');

  const dom = new JSDOM(`<!doctype html><html><body>
    <button data-site-search-trigger>Search</button>
  </body></html>`, { url: 'https://example.com/' });

  global.window = dom.window;
  global.document = dom.window.document;

  let openedHref = '';
  dom.window.open = (href) => {
    openedHref = String(href);
    return null;
  };

  SiteSearch.initSiteSearch({ root: document });
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: '/', bubbles: true }));

  SiteSearch.renderResults({
    root: document,
    query: 'x',
    results: [{ title: 'A', path: 'a/', tags: [], categories: [] }],
    suggestions: { topTags: [], allTags: [] }
  });

  const dialog = document.querySelector('[data-site-search-dialog]');
  const input = dialog.querySelector('[data-site-search-input]');

  input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', metaKey: true, bubbles: true }));

  assert.equal(openedHref, 'https://example.com/a/');

  delete global.window;
  delete global.document;
});
