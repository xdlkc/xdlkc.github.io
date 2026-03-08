const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

test('SiteSearch restores focus to trigger after closing (button click)', () => {
  const SiteSearch = require('../themes/evan/source/js/site-search.js');

  const dom = new JSDOM(`<!doctype html><html><body>
    <button id="trigger" data-site-search-trigger>搜索</button>
  </body></html>`, { url: 'https://example.com/' });

  global.window = dom.window;
  global.document = dom.window.document;

  SiteSearch.initSiteSearch({ root: document });

  const trigger = document.getElementById('trigger');
  trigger.focus();
  assert.equal(document.activeElement, trigger);

  trigger.click();

  const dialog = document.querySelector('[data-site-search-dialog]');
  const input = dialog.querySelector('[data-site-search-input]');
  assert.equal(document.activeElement, input);

  const closeBtn = dialog.querySelector('[data-site-search-close]');
  closeBtn.click();

  assert.equal(dialog.getAttribute('aria-hidden'), 'true');
  assert.ok(!dialog.classList.contains('is-open'));

  // Expect focus restored to the trigger.
  assert.equal(document.activeElement, trigger);

  delete global.window;
  delete global.document;
});

test('SiteSearch restores focus to trigger after closing (Escape)', () => {
  const SiteSearch = require('../themes/evan/source/js/site-search.js');

  const dom = new JSDOM(`<!doctype html><html><body>
    <button id="trigger" data-site-search-trigger>搜索</button>
  </body></html>`, { url: 'https://example.com/' });

  global.window = dom.window;
  global.document = dom.window.document;

  SiteSearch.initSiteSearch({ root: document });

  const trigger = document.getElementById('trigger');
  trigger.focus();
  trigger.click();

  const dialog = document.querySelector('[data-site-search-dialog]');
  assert.ok(dialog.classList.contains('is-open'));

  const esc = new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
  document.dispatchEvent(esc);

  assert.equal(dialog.getAttribute('aria-hidden'), 'true');
  assert.ok(!dialog.classList.contains('is-open'));

  assert.equal(document.activeElement, trigger);

  delete global.window;
  delete global.document;
});
