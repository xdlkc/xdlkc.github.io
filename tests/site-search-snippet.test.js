const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

test('SiteSearch.makeSnippet strips HTML and highlights matched keywords', () => {
  const SiteSearch = require('../themes/evan/source/js/site-search.js');

  const dom = new JSDOM(`<!doctype html><html><body></body></html>`);

  const post = {
    title: 'Docker Sandbox 如何为 AI Agent 构建零信任安全网关',
    path: '2026/docker-sandbox/',
    tags: ['ai', 'docker'],
    content: '<p>Hello <strong>World</strong> &amp; Agent sandbox.</p><p>Second paragraph.</p>'
  };

  const snippet = SiteSearch.makeSnippet(post, 'agent', { document: dom.window.document });
  assert.ok(snippet, 'expected non-empty snippet');

  // Should not include HTML tags.
  assert.doesNotMatch(snippet, /<strong>|<p>/i);

  // Should highlight the query.
  assert.match(snippet, /<mark>agent<\/mark>/i);
});

test('SiteSearch.makeSnippet falls back to leading text when no keyword match', () => {
  const SiteSearch = require('../themes/evan/source/js/site-search.js');

  const dom = new JSDOM(`<!doctype html><html><body></body></html>`);

  const post = {
    title: 'Hello World',
    path: '2026/hello/',
    tags: ['intro'],
    content: '<p>Just some opening text for the article.</p><p>More content later.</p>'
  };

  const snippet = SiteSearch.makeSnippet(post, 'nonexistent', { document: dom.window.document });
  assert.ok(snippet);
  assert.match(snippet, /Just some opening text/i);
});
