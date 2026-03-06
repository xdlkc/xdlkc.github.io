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

test('local-search: show no-result suggestions and keyword chips', async () => {
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

  // Minimal CONFIG to drive local-search.js
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

  // Mock fetch for search index
  const fakeIndex = JSON.stringify([
    { title: 'Alpha', content: 'something', url: '/alpha/' }
  ]);
  dom.window.fetch = async () => ({
    text: async () => fakeIndex
  });

  // Load script
  const scriptPath = path.resolve('js/local-search.js');
  loadScriptInto(dom, scriptPath);

  // Fire DOMContentLoaded so listeners attach
  dom.window.dispatchEvent(new dom.window.Event('DOMContentLoaded'));

  // Open popup (this triggers fetch + proceedSearch)
  dom.window.document.querySelector('.popup-trigger').click();

  // Wait a tick for async fetchData() chain to finish
  await new Promise(resolve => dom.window.setTimeout(resolve, 0));

  const input = dom.window.document.getElementById('search-input');
  const result = dom.window.document.getElementById('search-result');

  input.value = 'foo bar';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));

  assert.match(result.textContent, /没有找到|No results/i);

  const chips = [...result.querySelectorAll('[data-keyword]')].map(el => el.getAttribute('data-keyword'));
  assert.deepEqual(chips.sort(), ['bar', 'foo']);

  // Clicking a chip should set input value
  const fooChip = result.querySelector('[data-keyword="foo"]');
  fooChip.click();
  assert.equal(input.value, 'foo');
});
