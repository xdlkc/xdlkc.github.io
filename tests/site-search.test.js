const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('layouts include site search trigger and script', () => {
  const layout = read('themes/evan/layout/layout.ejs');
  assert.match(layout, /\/js\/site-search\.js/);

  const index = read('themes/evan/layout/index.ejs');
  const post = read('themes/evan/layout/post.ejs');
  const archive = read('themes/evan/layout/archive.ejs');
  const page = read('themes/evan/layout/page.ejs');

  [index, post, archive, page].forEach((tpl) => {
    assert.match(tpl, /data-site-search-trigger/);
  });
});

test('SiteSearch highlights query and returns ordered results', () => {
  const SiteSearch = require('../themes/evan/source/js/site-search.js');

  const posts = [
    { title: 'Hello World', path: '2026/hello-world/', tags: ['intro'] },
    { title: 'World of Agents', path: '2026/agents/', tags: ['agent', 'world'] },
    { title: 'No Match Here', path: '2026/none/', tags: ['misc'] }
  ];

  const results = SiteSearch.searchPosts(posts, 'world');
  assert.equal(results.length, 2);
  assert.equal(results[0].title, 'World of Agents');

  const highlighted = SiteSearch.highlightText('Hello World', 'world');
  assert.match(highlighted, /<mark>World<\/mark>/i);
});

test('SiteSearch multi-keyword query highlights each keyword and ranks by matched keywords', () => {
  const SiteSearch = require('../themes/evan/source/js/site-search.js');

  const posts = [
    { title: 'Hello World', path: '2026/hello-world/', tags: ['intro'] },
    { title: 'World of Agents', path: '2026/agents/', tags: ['agent', 'world'] },
    { title: 'Agent Notes', path: '2026/agent-notes/', tags: ['notes'] }
  ];

  const results = SiteSearch.searchPosts(posts, 'world agent');
  assert.equal(results.length, 3);
  assert.equal(results[0].title, 'World of Agents');

  const highlighted = SiteSearch.highlightText('World of Agents', 'world agent');
  assert.match(highlighted, /<mark>World<\/mark>/i);
  assert.match(highlighted, /<mark>Agent(s)?<\/mark>/i);
});

test('SiteSearch renders empty state with Archives suggestion', () => {
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
    query: 'notfound',
    results: []
  });

  const empty = root.querySelector('[data-site-search-empty]');
  assert.ok(empty);
  assert.match(empty.textContent, /(无结果|No results)/);

  const archivesLink = root.querySelector('[data-site-search-empty] a[href="/archives/"]');
  assert.ok(archivesLink);
  assert.equal(archivesLink.getAttribute('href'), '/archives/');

  delete global.window;
  delete global.document;
});
