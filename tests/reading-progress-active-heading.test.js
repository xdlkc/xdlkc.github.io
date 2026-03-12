const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const ReadingProgress = require('../themes/evan/source/js/reading-progress');

test('reading progress label includes active heading title when headings exist', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <div class="reading-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
      <div class="reading-progress-bar"></div>
    </div>

    <div class="article-content">
      <h2 id="a">Intro</h2>
      <p>...</p>
      <h2 id="b">Deep Dive Into Things</h2>
      <p>...</p>
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

  // Provide deterministic heading positions via getBoundingClientRect.
  // Absolute top = scrollY + rect.top.
  const h2a = document.getElementById('a');
  const h2b = document.getElementById('b');

  h2a.getBoundingClientRect = () => ({ top: -400, left: 0, width: 0, height: 0, right: 0, bottom: 0 });
  h2b.getBoundingClientRect = () => ({ top: 50, left: 0, width: 0, height: 0, right: 0, bottom: 0 });

  // Now at scrollY=500: absTop(a)=100, absTop(b)=550 => active should be b (within threshold).
  Object.defineProperty(window, 'scrollY', { value: 500, configurable: true });

  ReadingProgress.initReadingProgress();

  const label = document.querySelector('.reading-progress-label');
  assert.ok(label);
  assert.equal(label.textContent.trim(), '50% · Deep Dive Into Things');

  const container = document.querySelector('.reading-progress');
  assert.equal(container.getAttribute('aria-valuetext'), '阅读进度 50% · Deep Dive Into Things');

  delete global.window;
  delete global.document;
});

test('reading progress label stays percent-only before first heading', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <div class="reading-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
      <div class="reading-progress-bar"></div>
    </div>

    <div class="article-content">
      <h2 id="a">Intro</h2>
      <p>...</p>
    </div>

    <div style="height: 2000px"></div>
  </body></html>`, { url: 'https://example.com/' });

  global.window = dom.window;
  global.document = dom.window.document;

  window.requestAnimationFrame = (fn) => fn();

  Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true });

  const h2a = document.getElementById('a');
  // heading absTop will be 300 (below threshold), thus no active heading yet.
  h2a.getBoundingClientRect = () => ({ top: 300, left: 0, width: 0, height: 0, right: 0, bottom: 0 });

  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });

  ReadingProgress.initReadingProgress();

  const label = document.querySelector('.reading-progress-label');
  assert.ok(label);
  assert.equal(label.textContent.trim(), '0%');

  const container = document.querySelector('.reading-progress');
  assert.equal(container.getAttribute('aria-valuetext'), '阅读进度 0%');

  delete global.window;
  delete global.document;
});
