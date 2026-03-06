const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

test('SiteSearch opens dialog with / shortcut when not typing', () => {
  const SiteSearch = require('../themes/evan/source/js/site-search.js');

  const dom = new JSDOM(`<!doctype html><html><body>
    <button data-site-search-trigger>搜索</button>
  </body></html>`, { url: 'https://example.com/' });

  global.window = dom.window;
  global.document = dom.window.document;

  SiteSearch.initSiteSearch({ root: document });

  const event = new window.KeyboardEvent('keydown', { key: '/', bubbles: true });
  document.dispatchEvent(event);

  const dialog = document.querySelector('[data-site-search-dialog]');
  assert.ok(dialog);
  assert.equal(dialog.getAttribute('aria-hidden'), 'false');
  assert.ok(dialog.classList.contains('is-open'));

  const input = dialog.querySelector('[data-site-search-input]');
  assert.ok(input);
  assert.equal(document.activeElement, input);

  delete global.window;
  delete global.document;
});

test('SiteSearch does not open dialog with / shortcut while typing in input', () => {
  const SiteSearch = require('../themes/evan/source/js/site-search.js');

  const dom = new JSDOM(`<!doctype html><html><body>
    <input id="outside" />
    <button data-site-search-trigger>搜索</button>
  </body></html>`, { url: 'https://example.com/' });

  global.window = dom.window;
  global.document = dom.window.document;

  SiteSearch.initSiteSearch({ root: document });

  const outside = document.getElementById('outside');
  outside.focus();

  const event = new window.KeyboardEvent('keydown', { key: '/', bubbles: true });
  outside.dispatchEvent(event);

  const dialog = document.querySelector('[data-site-search-dialog]');
  assert.ok(dialog);
  assert.equal(dialog.getAttribute('aria-hidden'), 'true');
  assert.ok(!dialog.classList.contains('is-open'));

  delete global.window;
  delete global.document;
});
