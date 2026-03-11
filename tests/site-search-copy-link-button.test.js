const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

test('SiteSearch renders a copy-link button for each result and copies absolute URL on click', async () => {
  const SiteSearch = require('../themes/evan/source/js/site-search.js');

  const dom = new JSDOM(`<!doctype html><html><body></body></html>`, {
    url: 'https://example.com/'
  });

  dom.window.navigator.clipboard = {
    writeText: async (text) => {
      dom.window.__copied = text;
    }
  };

  const root = dom.window.document;
  SiteSearch.ensureDialog({ root });

  SiteSearch.renderResults({
    root,
    query: 'hello',
    results: [
      { title: 'Hello World', path: '2026/hello-world/', tags: ['intro'], date: '2026-03-01' }
    ]
  });

  // Bind interactions (new feature)
  SiteSearch.bindCopyLinkButtons({
    root,
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    location: dom.window.location,
  });

  const btn = root.querySelector('[data-site-search-copy-link]');
  assert.ok(btn, 'should render copy link button');

  btn.click();
  await new Promise(resolve => dom.window.setTimeout(resolve, 0));

  assert.equal(dom.window.__copied, 'https://example.com/2026/hello-world/');

  const toast = root.querySelector('.code-copy-toast');
  assert.ok(toast, 'should reuse code-copy-toast for feedback');
  assert.match(toast.textContent, /(链接已复制|Link copied)/);
});
