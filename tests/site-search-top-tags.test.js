const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

test('SiteSearch.getTopTags aggregates tags case-insensitively and sorts by count desc then name', () => {
  const SiteSearch = require('../themes/evan/source/js/site-search.js');

  const posts = [
    { title: 'A', path: 'a/', tags: ['AI', 'Agent'] },
    { title: 'B', path: 'b/', tags: ['ai', 'Tools'] },
    { title: 'C', path: 'c/', tags: ['tools', 'Misc'] },
    { title: 'D', path: 'd/', tags: ['misc'] }
  ];

  const top = SiteSearch.getTopTags(posts, { limit: 10, minCount: 2 });

  // ai:2, misc:2, tools:2 -> tie by name asc
  assert.deepEqual(top, ['ai', 'misc', 'tools']);
});

test('SiteSearch renders top tag chips when query is empty', () => {
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
    query: '',
    results: [],
    suggestions: {
      topTags: ['ai', 'tools']
    }
  });

  const container = root.querySelector('[data-site-search-top-tags]');
  assert.ok(container);

  const chips = Array.from(container.querySelectorAll('[data-site-search-keyword]'));
  assert.equal(chips.length, 2);
  assert.equal(chips[0].getAttribute('data-site-search-keyword'), 'ai');

  delete global.window;
  delete global.document;
});
