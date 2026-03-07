const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

test('SiteSearch renders published date (YYYY-MM-DD) in each result when available', () => {
  const SiteSearch = require('../themes/evan/source/js/site-search.js');

  const dom = new JSDOM(`<!doctype html><html><body></body></html>`, {
    url: 'https://example.com/'
  });
  global.window = dom.window;
  global.document = dom.window.document;

  const root = document;
  SiteSearch.ensureDialog({ root });

  SiteSearch.renderResults({
    root,
    query: 'agent',
    results: [
      {
        title: 'Agent Notes',
        path: '2026/agent-notes/',
        tags: ['agent'],
        date: '2026-03-01T00:00:00.000Z'
      },
      {
        title: 'No Date Post',
        path: '2026/no-date/',
        tags: ['misc']
      }
    ]
  });

  const items = root.querySelectorAll('.site-search-item');
  assert.equal(items.length, 2);

  const firstMeta = items[0].querySelector('.site-search-meta');
  assert.ok(firstMeta);
  assert.equal(firstMeta.textContent.trim(), '2026-03-01');

  const secondMeta = items[1].querySelector('.site-search-meta');
  assert.equal(secondMeta, null);

  delete global.window;
  delete global.document;
});
