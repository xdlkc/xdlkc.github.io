const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const SiteSearch = require('../themes/evan/source/js/site-search.js');

test('site-search: #tag query highlights tags without including # prefix', () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://example.com/' });
  const { document } = dom.window;

  // Create dialog + results container.
  const dialog = document.createElement('div');
  dialog.setAttribute('data-site-search-dialog', '');
  const results = document.createElement('div');
  results.setAttribute('data-site-search-results', '');
  dialog.appendChild(results);
  document.body.appendChild(dialog);

  SiteSearch.renderResults({
    root: document,
    query: '#foo',
    results: [{ title: 'Hello', path: 'hello', tags: ['FooBar'] }],
    suggestions: { topTags: [] }
  });

  const html = results.innerHTML;
  assert.ok(html.includes('<mark>Foo</mark>') || html.includes('<mark>foo</mark>'));
});
