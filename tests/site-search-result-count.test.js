const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

function setupDom({ lang = 'en' } = {}) {
  const dom = new JSDOM(`<!doctype html><html><body></body></html>`, {
    url: 'https://example.com/'
  });
  const { document } = dom.window;
  document.documentElement.dataset.langMode = lang;
  return dom;
}

test('SiteSearch renders result count in zh mode', () => {
  const SiteSearch = require('../themes/evan/source/js/site-search.js');

  const dom = setupDom({ lang: 'zh' });
  global.window = dom.window;
  global.document = dom.window.document;

  const root = document;
  SiteSearch.ensureDialog({ root });

  SiteSearch.renderResults({
    root,
    query: 'agent',
    results: [
      { title: 'Agent 1', path: '2026/a/', tags: [] },
      { title: 'Agent 2', path: '2026/b/', tags: [] },
      { title: 'Agent 3', path: '2026/c/', tags: [] }
    ]
  });

  const count = root.querySelector('[data-site-search-count]');
  assert.ok(count);
  assert.match(count.textContent, /找到\s*3\s*篇/);

  delete global.window;
  delete global.document;
});

test('SiteSearch renders singular result count in en mode', () => {
  const SiteSearch = require('../themes/evan/source/js/site-search.js');

  const dom = setupDom({ lang: 'en' });
  global.window = dom.window;
  global.document = dom.window.document;

  const root = document;
  SiteSearch.ensureDialog({ root });

  SiteSearch.renderResults({
    root,
    query: 'agent',
    results: [{ title: 'Agent 1', path: '2026/a/', tags: [] }]
  });

  const count = root.querySelector('[data-site-search-count]');
  assert.ok(count);
  assert.match(count.textContent, /Found\s*1\s*result\b/);

  delete global.window;
  delete global.document;
});

test('SiteSearch does not render result count for empty query or empty results', () => {
  const SiteSearch = require('../themes/evan/source/js/site-search.js');

  const dom = setupDom({ lang: 'zh' });
  global.window = dom.window;
  global.document = dom.window.document;

  const root = document;
  SiteSearch.ensureDialog({ root });

  SiteSearch.renderResults({ root, query: '', results: [] });
  assert.equal(root.querySelector('[data-site-search-count]'), null);

  SiteSearch.renderResults({ root, query: 'notfound', results: [] });
  assert.equal(root.querySelector('[data-site-search-count]'), null);

  delete global.window;
  delete global.document;
});
