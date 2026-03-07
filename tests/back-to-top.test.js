const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const BackToTop = require('../themes/evan/source/js/back-to-top.js');

test('shouldShowBackToTop respects threshold', () => {
  assert.equal(BackToTop.shouldShowBackToTop({ scrollY: 0, threshold: 420 }), false);
  assert.equal(BackToTop.shouldShowBackToTop({ scrollY: 419, threshold: 420 }), false);
  assert.equal(BackToTop.shouldShowBackToTop({ scrollY: 420, threshold: 420 }), true);
  assert.equal(BackToTop.shouldShowBackToTop({ scrollY: 999, threshold: 420 }), true);
});

test('initBackToTop injects an accessible button and toggles visibility', () => {
  const dom = new JSDOM('<!doctype html><html><body><main>hi</main></body></html>', {
    url: 'https://example.com/'
  });

  global.window = dom.window;
  global.document = dom.window.document;

  // Start at top -> hidden
  dom.window.scrollY = 0;
  BackToTop.initBackToTop({ threshold: 420 });

  const btn = dom.window.document.querySelector('[data-back-to-top]');
  assert.ok(btn, 'button should exist');
  assert.equal(btn.tagName, 'BUTTON');
  assert.equal(btn.getAttribute('type'), 'button');
  assert.equal(btn.getAttribute('aria-label'), '返回顶部');
  assert.equal(btn.hasAttribute('hidden'), true);

  // Force show by calling exported helper
  BackToTop.applyBackToTopVisibility(btn, true);
  assert.equal(btn.hasAttribute('hidden'), false);
});

test('clicking back-to-top triggers smooth scroll when available', async () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'https://example.com/'
  });

  global.window = dom.window;
  global.document = dom.window.document;

  let called = null;
  dom.window.scrollTo = (arg1, arg2) => {
    called = [arg1, arg2];
  };

  BackToTop.initBackToTop({ threshold: 0 });
  const btn = dom.window.document.querySelector('[data-back-to-top]');
  assert.ok(btn);

  btn.click();

  // Either modern signature or fallback signature is accepted.
  assert.ok(called, 'scrollTo should be called');
});
