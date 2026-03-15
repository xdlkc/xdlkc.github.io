const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

test('SiteSearch: no-result state shows external search links (Google/Bing) with site:host query', async () => {
  const SiteSearch = require('../themes/evan/source/js/site-search.js');

  const dom = new JSDOM(`<!doctype html><html><body>
    <button data-site-search-trigger>Search</button>
  </body></html>`, {
    url: 'https://example.com/',
    runScripts: 'outside-only'
  });

  dom.window.fetch = async () => ({
    ok: true,
    json: async () => ({
      posts: [
        { title: 'Alpha', path: '2026/alpha/', tags: ['intro'] }
      ]
    })
  });

  global.window = dom.window;
  global.document = dom.window.document;

  SiteSearch.initSiteSearch({ root: document });

  document.querySelector('[data-site-search-trigger]').click();
  await new Promise((r) => setTimeout(r, 0));

  const dialog = document.querySelector('[data-site-search-dialog]');
  assert.ok(dialog);

  const input = dialog.querySelector('[data-site-search-input]');
  assert.ok(input);

  input.value = 'foo bar';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 250));

  const google = document.querySelector('[data-site-search-external-link="google"]');
  const bing = document.querySelector('[data-site-search-external-link="bing"]');

  assert.ok(google);
  assert.ok(bing);

  assert.match(google.getAttribute('href') || '', /^https:\/\/www\.google\.com\/search\?q=/);
  assert.match(bing.getAttribute('href') || '', /^https:\/\/www\.bing\.com\/search\?q=/);

  const encoded = encodeURIComponent('site:example.com foo bar');
  assert.ok((google.getAttribute('href') || '').includes(encoded));
  assert.ok((bing.getAttribute('href') || '').includes(encoded));

  assert.equal(google.getAttribute('target'), '_blank');
  assert.match(google.getAttribute('rel') || '', /noopener/);

  assert.equal(bing.getAttribute('target'), '_blank');
  assert.match(bing.getAttribute('rel') || '', /noopener/);

  delete global.window;
  delete global.document;
});
