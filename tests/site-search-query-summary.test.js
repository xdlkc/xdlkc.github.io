const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

function setup() {
  const SiteSearch = require('../themes/evan/source/js/site-search.js');
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'https://example.com/'
  });
  const { document } = dom.window;
  document.documentElement.dataset.langMode = 'zh';
  SiteSearch.ensureDialog({ root: document });
  return { SiteSearch, document };
}

test('SiteSearch renders query summary for tag search results', () => {
  const { SiteSearch, document } = setup();

  SiteSearch.renderResults({
    root: document,
    query: '#AI',
    results: [
      { title: 'AI Notes', path: '2026/ai-notes/', tags: ['AI'], categories: ['notes'] }
    ]
  });

  const summary = document.querySelector('[data-site-search-summary]');
  assert.ok(summary, 'should render query summary');
  assert.match(summary.textContent, /标签/);
  assert.match(summary.textContent, /AI/);
  assert.match(summary.textContent, /找到 1 篇/);
});

test('SiteSearch renders query summary for no-result category search', () => {
  const { SiteSearch, document } = setup();

  SiteSearch.renderResults({
    root: document,
    query: 'cat:notes',
    results: [],
    suggestions: { topTags: ['AI'] }
  });

  const summary = document.querySelector('[data-site-search-summary]');
  assert.ok(summary, 'should render query summary even when empty');
  assert.match(summary.textContent, /分类/);
  assert.match(summary.textContent, /notes/);
  assert.match(summary.textContent, /找到 0 篇/);
});
