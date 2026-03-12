const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const BackToTop = require('../themes/evan/source/js/back-to-top.js');

test('back-to-top button shows reading progress percent when visible', () => {
  const dom = new JSDOM('<!doctype html><html><body><main>hi</main></body></html>', {
    url: 'https://example.com/post'
  });

  global.window = dom.window;
  global.document = dom.window.document;

  // Make scroll updates synchronous.
  dom.window.requestAnimationFrame = (cb) => cb();

  // Simulate a 2000px document with a 1000px viewport => maxScroll = 1000.
  Object.defineProperty(dom.window.document.documentElement, 'scrollHeight', { value: 2000, configurable: true });
  Object.defineProperty(dom.window.document.documentElement, 'clientHeight', { value: 1000, configurable: true });

  dom.window.scrollY = 560;

  BackToTop.initBackToTop({ threshold: 0, root: dom.window.document });

  const btn = dom.window.document.querySelector('[data-back-to-top]');
  assert.ok(btn);

  // init should run an initial update.
  assert.equal(btn.hasAttribute('hidden'), false);
  assert.match(btn.textContent, /56%/);

  // Clamp to 100% when scroll exceeds max.
  dom.window.scrollY = 9999;
  dom.window.dispatchEvent(new dom.window.Event('scroll'));
  assert.match(btn.textContent, /100%/);
});
