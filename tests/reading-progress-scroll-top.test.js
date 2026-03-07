const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const ReadingProgress = require('../themes/evan/source/js/reading-progress');

test('clicking .reading-progress scrolls back to top', () => {
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

  // Stub scrollTo.
  let called = false;
  let args = null;
  window.scrollTo = (...a) => {
    called = true;
    args = a;
  };

  ReadingProgress.initReadingProgress();

  const container = document.querySelector('.reading-progress');
  container.dispatchEvent(new window.Event('click', { bubbles: true }));

  assert.ok(called, 'should call window.scrollTo on click');
  assert.ok(args, 'should capture scrollTo arguments');

  // Accept either scrollTo({top:0, ...}) or scrollTo(0,0).
  if (typeof args[0] === 'object' && args[0]) {
    assert.equal(args[0].top, 0);
  } else {
    assert.equal(args[0], 0);
    assert.equal(args[1], 0);
  }

  delete global.window;
  delete global.document;
});
