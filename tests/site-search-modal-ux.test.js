const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const SiteSearch = require('../themes/evan/source/js/site-search.js');

function setupDom({ lang = 'en' } = {}) {
  const dom = new JSDOM(`<!doctype html><html data-lang-mode="${lang}"><body>
    <button id="trigger" data-site-search-trigger>Search</button>
  </body></html>`, { url: 'https://example.com/' });
  global.window = dom.window;
  global.document = dom.window.document;
  return dom;
}

function teardownDom() {
  delete global.window;
  delete global.document;
}

test('SiteSearch does not duplicate "Found N results" status text', () => {
  const dom = setupDom({ lang: 'en' });
  try {
    const root = dom.window.document;
    const dialog = SiteSearch.ensureDialog({ root });

    SiteSearch.renderResults({
      root,
      query: 'agent',
      results: [
        { title: 'Agent 1', path: '2026/a/', tags: ['agent'] },
        { title: 'Agent 2', path: '2026/b/', tags: ['agent'] }
      ]
    });

    const matches = (dialog.textContent || '').match(/Found\s+2\s+results/g) || [];
    assert.equal(matches.length, 1, 'Found N results should appear exactly once');
    assert.equal(dialog.querySelectorAll('[data-site-search-count]').length, 1);
  } finally {
    teardownDom();
  }
});

test('SiteSearch hides "Type to start searching" hint during query/no-results and restores when empty', () => {
  const dom = setupDom({ lang: 'en' });
  try {
    const root = dom.window.document;
    const dialog = SiteSearch.ensureDialog({ root });
    const hint = dialog.querySelector('[data-site-search-hint]');
    assert.ok(hint);

    // Results state: hint hidden.
    SiteSearch.renderResults({
      root,
      query: 'agent',
      results: [{ title: 'Agent 1', path: '2026/a/', tags: [] }]
    });
    assert.equal(hint.hidden, true);
    assert.equal(hint.style.display, 'none');

    // No-results state: hint still hidden.
    SiteSearch.renderResults({
      root,
      query: 'nothing-matches',
      results: []
    });
    assert.equal(hint.hidden, true);
    assert.equal(hint.style.display, 'none');

    // Empty query (no suggestions): hint restored.
    SiteSearch.renderResults({
      root,
      query: '',
      results: [],
      suggestions: { topTags: [], recentQueries: [] }
    });
    assert.equal(hint.hidden, false);
    assert.equal(hint.style.display, '');
    assert.match(hint.textContent, /Type to start searching/);
  } finally {
    teardownDom();
  }
});

test('SiteSearch Escape reliably closes dialog from input, close button, or dialog body', () => {
  const dom = setupDom({ lang: 'en' });
  try {
    const root = dom.window.document;
    SiteSearch.initSiteSearch({ root });

    const trigger = root.getElementById('trigger');
    const dialog = root.querySelector('[data-site-search-dialog]');
    const input = dialog.querySelector('[data-site-search-input]');
    const closeBtn = dialog.querySelector('[data-site-search-close]');

    // 1. Escape with focus inside search input and non-empty query.
    trigger.click();
    input.value = 'claude';
    input.focus();
    input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(dialog.classList.contains('is-open'), false);
    assert.equal(dialog.getAttribute('aria-hidden'), 'true');

    // 2. Escape with focus on another element inside the dialog.
    trigger.click();
    closeBtn.focus();
    closeBtn.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(dialog.classList.contains('is-open'), false);
    assert.equal(dialog.getAttribute('aria-hidden'), 'true');
  } finally {
    teardownDom();
  }
});

test('SiteSearch rendered result cards expose clean semantic classes and attributes', () => {
  const dom = setupDom({ lang: 'en' });
  try {
    const root = dom.window.document;
    SiteSearch.ensureDialog({ root });

    SiteSearch.renderResults({
      root,
      query: 'agent',
      results: [{ title: 'Agent Guide', path: '2026/agent-guide/', tags: ['AI'], date: '2026-03-19' }]
    });

    const list = root.querySelector('.site-search-list[role="list"]');
    assert.ok(list);

    const item = list.querySelector('.site-search-item[data-site-search-item]');
    assert.ok(item);
    assert.ok(item.querySelector('.site-search-row'));
    assert.ok(item.querySelector('.site-search-link[href="/2026/agent-guide/"]'));
    assert.ok(item.querySelector('.site-search-title'));
    assert.ok(item.querySelector('.site-search-copy-link[data-site-search-copy-link="/2026/agent-guide/"]'));
  } finally {
    teardownDom();
  }
});
