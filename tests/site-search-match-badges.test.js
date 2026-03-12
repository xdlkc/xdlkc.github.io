const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

test('SiteSearch renders match reason badges for tag/title/category matches', () => {
  const SiteSearch = require('../themes/evan/source/js/site-search.js');

  const dom = new JSDOM(`<!doctype html><html><body></body></html>`, {
    url: 'https://example.com/'
  });

  const { document } = dom.window;
  document.documentElement.dataset.langMode = 'en';

  SiteSearch.ensureDialog({ root: document });

  SiteSearch.renderResults({
    root: document,
    query: 'agent',
    results: [
      {
        title: 'Hello',
        path: '2026/hello/',
        tags: ['agent'],
        categories: ['notes']
      },
      {
        title: 'Agent Notes',
        path: '2026/agent-notes/',
        tags: ['misc'],
        categories: []
      }
    ]
  });

  const items = Array.from(document.querySelectorAll('.site-search-item'));
  assert.equal(items.length, 2);

  const badges1 = items[0].querySelector('.site-search-match-badges');
  assert.ok(badges1, 'should render match badges row');
  assert.match(badges1.textContent, /#agent/i);

  const badges2 = items[1].querySelector('.site-search-match-badges');
  assert.ok(badges2, 'should render match badges row');
  assert.match(badges2.textContent, /title/i);
});

test('SiteSearch category-only query does not render title/tag match badges', () => {
  const SiteSearch = require('../themes/evan/source/js/site-search.js');

  const dom = new JSDOM(`<!doctype html><html><body></body></html>`, {
    url: 'https://example.com/'
  });

  const { document } = dom.window;
  document.documentElement.dataset.langMode = 'en';

  SiteSearch.ensureDialog({ root: document });

  SiteSearch.renderResults({
    root: document,
    query: 'cat:notes',
    results: [
      {
        title: 'Notes about Agents',
        path: '2026/notes-agents/',
        tags: ['agent'],
        categories: ['notes']
      }
    ]
  });

  const badges = document.querySelector('.site-search-match-badges');
  assert.ok(badges, 'should render match badges row');
  assert.doesNotMatch(badges.textContent, /title/i);
  assert.doesNotMatch(badges.textContent, /#agent/i);
});
