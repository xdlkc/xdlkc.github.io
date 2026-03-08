const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const ReadingProgress = require('../themes/evan/source/js/reading-progress');

test('reading progress bar supports drag-to-seek (mousedown + mousemove + mouseup)', () => {
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

  // Stub scrollTo and capture calls.
  const calls = [];
  window.scrollTo = (...args) => {
    calls.push(args);
  };

  const container = document.querySelector('.reading-progress');
  // JSDOM doesn't compute layout; stub bounding box.
  container.getBoundingClientRect = () => ({ left: 100, width: 200, top: 0, height: 8, right: 300, bottom: 8 });

  ReadingProgress.initReadingProgress();

  // Drag: start at 50% (clientX=200), move to 100% (clientX=300).
  container.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true, clientX: 200 }));
  assert.ok(container.classList.contains('is-dragging'), 'should add is-dragging on mousedown');

  window.dispatchEvent(new window.MouseEvent('mousemove', { bubbles: true, clientX: 300 }));
  window.dispatchEvent(new window.MouseEvent('mouseup', { bubbles: true }));

  assert.ok(!container.classList.contains('is-dragging'), 'should remove is-dragging on mouseup');

  // Expect at least 2 scrollTo calls (down + move). Accept both scrollTo({top}) and scrollTo(0, top).
  assert.ok(calls.length >= 2, `expected >=2 scrollTo calls, got ${calls.length}`);

  const extractTop = (args) => {
    if (typeof args[0] === 'object' && args[0]) return args[0].top;
    return args[1];
  };

  const firstTop = extractTop(calls[0]);
  const lastTop = extractTop(calls[calls.length - 1]);

  // totalScrollable = 1000
  assert.equal(firstTop, 500, 'mousedown at 50% should scroll to 500');
  assert.equal(lastTop, 1000, 'mousemove at 100% should scroll to 1000');

  // After mouseup, further moves should not scroll.
  const before = calls.length;
  window.dispatchEvent(new window.MouseEvent('mousemove', { bubbles: true, clientX: 150 }));
  assert.equal(calls.length, before, 'mousemove after mouseup should not trigger scroll');

  delete global.window;
  delete global.document;
});
