const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const ReadingProgress = require('../themes/evan/source/js/reading-progress');

test('reading progress updates document.title with a single [NN%] prefix (no stacking)', () => {
  const dom = new JSDOM(`<!doctype html><html><head><title>My Post | xdlkc</title></head><body>
    <div class="reading-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
      <div class="reading-progress-bar"></div>
    </div>
    <div style="height: 2000px"></div>
  </body></html>`, { url: 'https://example.com/post/hello' });

  global.window = dom.window;
  global.document = dom.window.document;

  // Make updates synchronous.
  window.requestAnimationFrame = (fn) => fn();

  Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true });

  // First update: 50%
  Object.defineProperty(window, 'scrollY', { value: 500, configurable: true });
  ReadingProgress.initReadingProgress();
  assert.equal(document.title, '[50%] My Post | xdlkc');

  // Second update: 60% (should not stack prefixes)
  Object.defineProperty(window, 'scrollY', { value: 600, configurable: true });
  window.dispatchEvent(new window.Event('scroll'));

  assert.equal(document.title, '[60%] My Post | xdlkc');

  delete global.window;
  delete global.document;
});
