import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function loadScriptInto(dom, filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  const context = dom.getInternalVMContext();
  vm.runInContext(code, context, { filename: filePath });
}

test('local-search: no-result panel includes external site-search links (Google/Bing/DuckDuckGo)', async () => {
  const dom = new JSDOM(
    `<!doctype html>
    <html><body>
      <a class="popup-trigger">Search</a>
      <div class="search-pop-overlay"></div>
      <div class="popup" style="display:none">
        <button class="popup-btn-close">x</button>
        <input id="search-input" />
        <div id="search-result"></div>
      </div>
    </body></html>`,
    { runScripts: 'outside-only', url: 'https://example.test/' }
  );

  dom.window.CONFIG = {
    root: '/',
    path: 'search.json',
    localsearch: {
      trigger: 'auto',
      preload: false,
      unescape: false,
      top_n_per_article: 1
    }
  };

  // Mock fetch for search index: contains one irrelevant title.
  const fakeIndex = JSON.stringify([{ title: 'Alpha', content: 'something', url: '/alpha/' }]);
  dom.window.fetch = async () => ({
    text: async () => fakeIndex
  });

  const scriptPath = path.resolve('js/local-search.js');
  loadScriptInto(dom, scriptPath);

  dom.window.dispatchEvent(new dom.window.Event('DOMContentLoaded'));

  dom.window.document.querySelector('.popup-trigger').click();
  await new Promise(resolve => dom.window.setTimeout(resolve, 0));

  const input = dom.window.document.getElementById('search-input');
  const result = dom.window.document.getElementById('search-result');

  input.value = 'foo bar';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));

  const links = [...result.querySelectorAll('[data-external-search]')];
  assert.equal(links.length, 3);

  const google = result.querySelector('[data-external-search="google"]');
  const bing = result.querySelector('[data-external-search="bing"]');
  const ddg = result.querySelector('[data-external-search="duckduckgo"]');
  assert.ok(google);
  assert.ok(bing);
  assert.ok(ddg);

  const expected = encodeURIComponent('site:example.test foo bar');
  assert.match(google.getAttribute('href'), new RegExp(expected));
  assert.match(bing.getAttribute('href'), new RegExp(expected));
  assert.match(ddg.getAttribute('href'), new RegExp(expected));

  assert.match(google.getAttribute('href') || '', /^https:\/\/www\.google\.com\/search\?q=/);
  assert.match(bing.getAttribute('href') || '', /^https:\/\/www\.bing\.com\/search\?q=/);
  assert.match(ddg.getAttribute('href') || '', /^https:\/\/duckduckgo\.com\//);

  assert.equal(google.getAttribute('target'), '_blank');
  assert.match(google.getAttribute('rel') || '', /noopener/);
  assert.equal(bing.getAttribute('target'), '_blank');
  assert.match(bing.getAttribute('rel') || '', /noopener/);
  assert.equal(ddg.getAttribute('target'), '_blank');
  assert.match(ddg.getAttribute('rel') || '', /noopener/);
});
