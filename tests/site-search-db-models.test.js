const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test('SiteSearch can read Hexo db.json models.Post shape', async () => {
  const SiteSearch = require('../themes/evan/source/js/site-search.js');

  const dom = new JSDOM(`<!doctype html><html><body>
    <button data-site-search-trigger type="button">Search</button>
  </body></html>`, {
    url: 'https://example.com/'
  });

  global.window = dom.window;
  global.document = dom.window.document;

  const posts = [
    { title: 'Hello World', path: '2026/hello-world/', tags: ['intro'] },
    { title: 'World of Agents', path: '2026/agents/', tags: ['agent', 'world'] }
  ];

  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      meta: { generator: 'hexo' },
      models: { Post: posts }
    })
  });

  SiteSearch.initSiteSearch({ root: document });

  // Open dialog (click trigger) and allow ensureDb() to resolve.
  document.querySelector('[data-site-search-trigger]').click();
  await sleep(0);

  const input = document.querySelector('[data-site-search-input]');
  assert.ok(input);

  input.value = 'world';
  input.dispatchEvent(new window.Event('input', { bubbles: true }));

  await sleep(180);

  const list = document.querySelector('.site-search-list');
  assert.ok(list, 'expected results list to render');

  const firstTitle = document.querySelector('.site-search-title');
  assert.ok(firstTitle);
  assert.match(firstTitle.innerHTML, /<mark>/i);

  delete global.fetch;
  delete global.window;
  delete global.document;
});
