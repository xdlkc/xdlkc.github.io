const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const ReadingProgress = require('../themes/evan/source/js/reading-progress');

function createStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    }
  };
}

test('reading progress can be collapsed and persisted', () => {
  const storage = createStorage();

  const dom = new JSDOM(`<!doctype html><html><body>
    <div class="reading-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
      <div class="reading-progress-bar"></div>
    </div>
    <div style="height: 2000px"></div>
  </body></html>`, { url: 'https://example.com/2026/03/11/post/' });

  global.window = dom.window;
  global.document = dom.window.document;

  window.requestAnimationFrame = (fn) => fn();

  Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true });
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });

  ReadingProgress.initReadingProgress({ storage });

  const toggle = document.querySelector('.reading-progress-toggle');
  assert.ok(toggle, 'should inject a toggle button');

  const container = document.querySelector('.reading-progress');
  assert.ok(!container.classList.contains('is-collapsed'), 'default should be expanded');

  toggle.click();
  assert.ok(container.classList.contains('is-collapsed'), 'click should collapse');
  assert.equal(storage.getItem('xdlkc:reading-progress:collapsed'), '1');

  toggle.click();
  assert.ok(!container.classList.contains('is-collapsed'), 'click again should expand');
  assert.equal(storage.getItem('xdlkc:reading-progress:collapsed'), '0');

  delete global.window;
  delete global.document;
});

test('reading progress reads collapsed state from storage on init', () => {
  const storage = createStorage({ 'xdlkc:reading-progress:collapsed': '1' });

  const dom = new JSDOM(`<!doctype html><html><body>
    <div class="reading-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
      <div class="reading-progress-bar"></div>
    </div>
    <div style="height: 2000px"></div>
  </body></html>`, { url: 'https://example.com/2026/03/11/post/' });

  global.window = dom.window;
  global.document = dom.window.document;

  window.requestAnimationFrame = (fn) => fn();

  Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true });
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });

  ReadingProgress.initReadingProgress({ storage });

  const container = document.querySelector('.reading-progress');
  assert.ok(container.classList.contains('is-collapsed'), 'should be collapsed when storage says so');

  delete global.window;
  delete global.document;
});
