const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const SiteSearch = require('../themes/evan/source/js/site-search.js');

function setupDom() {
  const dom = new JSDOM(`<!doctype html><html><body></body></html>`, {
    url: 'https://example.com/'
  });

  const { window } = dom;
  const { document } = window;

  // Provide trigger so initSiteSearch wires up handlers.
  const trigger = document.createElement('button');
  trigger.setAttribute('data-site-search-trigger', '');
  document.body.appendChild(trigger);

  return { window, document };
}

test('SiteSearch: clicking a result link closes the search dialog', () => {
  const { window, document } = setupDom();

  // Stub location to prevent actual navigation
  let assigned = null;
  const locationStub = { assign: (href) => { assigned = href; } };

  SiteSearch.initSiteSearch({ root: document, location: locationStub });

  const dialog = document.querySelector('[data-site-search-dialog]');
  assert.ok(dialog, 'dialog should be created');

  // Open the dialog
  dialog.classList.add('is-open');
  dialog.setAttribute('aria-hidden', 'false');

  // Render search results
  SiteSearch.renderResults({
    root: document,
    query: 'test',
    results: [
      { title: 'Test Post', path: '2026/test-post/', tags: [] }
    ]
  });

  const resultLink = dialog.querySelector('.site-search-link');
  assert.ok(resultLink, 'result link should exist');

  // Click the result link
  resultLink.click();

  // The dialog should be closed
  assert.equal(dialog.getAttribute('aria-hidden'), 'true');
  assert.ok(!dialog.classList.contains('is-open'));
});

test('SiteSearch: Enter key on first result closes the search dialog', () => {
  const { window, document } = setupDom();

  // Stub location to prevent actual navigation
  let assigned = null;
  const locationStub = { assign: (href) => { assigned = href; } };

  SiteSearch.initSiteSearch({ root: document, location: locationStub });

  const dialog = document.querySelector('[data-site-search-dialog]');
  assert.ok(dialog, 'dialog should be created');

  // Open the dialog
  dialog.classList.add('is-open');
  dialog.setAttribute('aria-hidden', 'false');

  // Render search results
  SiteSearch.renderResults({
    root: document,
    query: 'test',
    results: [
      { title: 'Test Post', path: '2026/test-post/', tags: [] }
    ]
  });

  const input = dialog.querySelector('[data-site-search-input]');
  assert.ok(input, 'input should exist');

  // Press Enter to open the first result
  input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

  // The dialog should be closed
  assert.equal(dialog.getAttribute('aria-hidden'), 'true');
  assert.ok(!dialog.classList.contains('is-open'));
});
