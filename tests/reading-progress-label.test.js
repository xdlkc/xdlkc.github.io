const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const ReadingProgress = require('../themes/evan/source/js/reading-progress');

test('initReadingProgress injects percent label and updates aria-valuetext', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <div class="reading-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
      <div class="reading-progress-bar"></div>
    </div>
    <div style="height: 2000px"></div>
  </body></html>`, { url: 'https://example.com/' });

  global.window = dom.window;
  global.document = dom.window.document;

  // Make updates synchronous for test.
  window.requestAnimationFrame = (fn) => fn();

  // Simulate scrollable page.
  Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true });
  Object.defineProperty(window, 'scrollY', { value: 500, configurable: true });

  ReadingProgress.initReadingProgress();

  const label = document.querySelector('.reading-progress-label');
  assert.ok(label, 'should inject .reading-progress-label');
  assert.equal(label.textContent.trim(), '50%');

  const container = document.querySelector('.reading-progress');
  assert.equal(container.getAttribute('aria-valuenow'), '50');
  assert.equal(container.getAttribute('aria-valuetext'), '阅读进度 50%');

  delete global.window;
  delete global.document;
});
