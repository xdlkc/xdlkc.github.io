const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const {
  computeNextPercentFromKey,
  computeScrollTopForPercent,
  initReadingProgress,
} = require('../themes/evan/source/js/reading-progress');

test('computeNextPercentFromKey: ArrowLeft/ArrowRight step and clamp', () => {
  assert.equal(computeNextPercentFromKey({ key: 'ArrowRight', currentPercent: 0 }), 5);
  assert.equal(computeNextPercentFromKey({ key: 'ArrowLeft', currentPercent: 0 }), 0);
  assert.equal(computeNextPercentFromKey({ key: 'ArrowRight', currentPercent: 98 }), 100);
  assert.equal(computeNextPercentFromKey({ key: 'ArrowLeft', currentPercent: 3 }), 0);
});

test('computeNextPercentFromKey: Home/End', () => {
  assert.equal(computeNextPercentFromKey({ key: 'Home', currentPercent: 50 }), 0);
  assert.equal(computeNextPercentFromKey({ key: 'End', currentPercent: 50 }), 100);
});

test('reading progress bar: keydown seeks page via scrollTo', async () => {
  const dom = new JSDOM(
    `<!doctype html><html><body>
      <div class="reading-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
        <div class="reading-progress-bar"></div>
      </div>
    </body></html>`,
    { url: 'https://example.com/post/' }
  );

  const { window } = dom;
  const { document } = window;

  // Provide the globals expected by the module.
  global.window = window;
  global.document = document;
  global.navigator = window.navigator;

  // Make page scrollable.
  Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true });
  Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, configurable: true });

  // Start at 50% (scrollY=500 of totalScrollable=1000).
  Object.defineProperty(window, 'scrollY', { value: 500, configurable: true });
  Object.defineProperty(window, 'pageYOffset', { value: 500, configurable: true });

  let lastScrollTop = null;
  window.scrollTo = (optsOrX, y) => {
    if (typeof optsOrX === 'object' && optsOrX) lastScrollTop = optsOrX.top;
    else lastScrollTop = y;
  };

  initReadingProgress();

  const container = document.querySelector('.reading-progress');
  assert.ok(container, 'progress container exists');

  // ArrowRight => +5% => 55% => scrollTop 550
  container.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

  const expected = computeScrollTopForPercent({ percent: 55, docHeight: 2000, winHeight: 1000 });
  assert.equal(lastScrollTop, expected);
});
