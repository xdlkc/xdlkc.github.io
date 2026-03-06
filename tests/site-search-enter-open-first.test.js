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

test('SiteSearch: Enter opens the first result when dialog is open', () => {
  const { window, document } = setupDom();

  let assigned = null;
  const locationStub = { assign: (href) => { assigned = href; } };

  SiteSearch.initSiteSearch({ root: document, location: locationStub });

  const dialog = document.querySelector('[data-site-search-dialog]');
  assert.ok(dialog, 'dialog should be created');

  dialog.classList.add('is-open');
  dialog.setAttribute('aria-hidden', 'false');

  SiteSearch.renderResults({
    root: document,
    query: 'hello',
    results: [{ title: 'Hello World', path: '2026/03/01/hello', tags: ['test'] }]
  });

  const input = dialog.querySelector('[data-site-search-input]');
  assert.ok(input, 'input should exist');

  input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

  assert.equal(assigned, 'https://example.com/2026/03/01/hello');
});

test('SiteSearch: Enter does nothing when no results', () => {
  const { window, document } = setupDom();

  let called = false;
  const locationStub = { assign: () => { called = true; } };

  SiteSearch.initSiteSearch({ root: document, location: locationStub });

  const dialog = document.querySelector('[data-site-search-dialog]');
  dialog.classList.add('is-open');
  dialog.setAttribute('aria-hidden', 'false');

  SiteSearch.renderResults({ root: document, query: 'nope', results: [] });

  const input = dialog.querySelector('[data-site-search-input]');
  input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

  assert.equal(called, false);
});

test('SiteSearch: composing Enter does not navigate', () => {
  const { window, document } = setupDom();

  let called = false;
  const locationStub = { assign: () => { called = true; } };

  SiteSearch.initSiteSearch({ root: document, location: locationStub });

  const dialog = document.querySelector('[data-site-search-dialog]');
  dialog.classList.add('is-open');
  dialog.setAttribute('aria-hidden', 'false');

  SiteSearch.renderResults({
    root: document,
    query: 'hello',
    results: [{ title: 'Hello World', path: '2026/03/01/hello', tags: [] }]
  });

  const input = dialog.querySelector('[data-site-search-input]');
  const event = new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
  Object.defineProperty(event, 'isComposing', { value: true });
  input.dispatchEvent(event);

  assert.equal(called, false);
});
