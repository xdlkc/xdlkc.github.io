const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const ScrollRestore = require('../themes/evan/source/js/scroll-restore');

function createDom({ url = 'https://example.com/2026/03/07/post/', bodyHeight = 5000 } = {}) {
  const dom = new JSDOM(`<!doctype html><html><body><main style="height:${bodyHeight}px"></main></body></html>`, {
    url,
    pretendToBeVisual: true
  });

  // jsdom doesn't implement layout; provide a fake scrollHeight/innerHeight.
  Object.defineProperty(dom.window.document.documentElement, 'scrollHeight', {
    value: bodyHeight,
    configurable: true
  });
  Object.defineProperty(dom.window, 'innerHeight', {
    value: 800,
    configurable: true
  });

  // Make requestAnimationFrame synchronous for deterministic tests.
  dom.window.requestAnimationFrame = (cb) => {
    cb(0);
    return 1;
  };

  return dom;
}

test('saveScrollPosition writes y+ts to localStorage on pagehide', () => {
  const dom = createDom();

  // Simulate scroll position
  Object.defineProperty(dom.window, 'scrollY', { value: 1234, configurable: true });

  ScrollRestore.initScrollRestore({
    root: dom.window.document,
    win: dom.window,
    now: () => 1000
  });

  dom.window.dispatchEvent(new dom.window.Event('pagehide'));

  const raw = dom.window.localStorage.getItem('xdlkc:scroll:/2026/03/07/post/');
  assert.ok(raw, 'expected localStorage to have saved value');
  const parsed = JSON.parse(raw);
  assert.equal(parsed.y, 1234);
  assert.equal(parsed.ts, 1000);
});

test('restoreScrollPosition scrolls to saved y when no hash', () => {
  const dom = createDom({ url: 'https://example.com/2026/03/07/post/' });

  dom.window.localStorage.setItem(
    'xdlkc:scroll:/2026/03/07/post/',
    JSON.stringify({ y: 900, ts: 1000 })
  );

  let called = null;
  dom.window.scrollTo = (x, y) => {
    called = { x, y };
  };

  ScrollRestore.initScrollRestore({
    root: dom.window.document,
    win: dom.window,
    now: () => 1000
  });

  ScrollRestore.restoreScrollPosition({
    root: dom.window.document,
    win: dom.window,
    now: () => 1000
  });

  assert.deepEqual(called, { x: 0, y: 900 });
});

test('restoreScrollPosition does not run when location.hash exists', () => {
  const dom = createDom({ url: 'https://example.com/2026/03/07/post/#section' });

  dom.window.localStorage.setItem(
    'xdlkc:scroll:/2026/03/07/post/',
    JSON.stringify({ y: 900, ts: 1000 })
  );

  let called = false;
  dom.window.scrollTo = () => {
    called = true;
  };

  ScrollRestore.restoreScrollPosition({
    root: dom.window.document,
    win: dom.window,
    now: () => 1000
  });

  assert.equal(called, false);
});

test('restoreScrollPosition ignores expired value (older than 7d)', () => {
  const dom = createDom({ url: 'https://example.com/2026/03/07/post/' });

  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  dom.window.localStorage.setItem(
    'xdlkc:scroll:/2026/03/07/post/',
    JSON.stringify({ y: 900, ts: 1000 })
  );

  let called = false;
  dom.window.scrollTo = () => {
    called = true;
  };

  ScrollRestore.restoreScrollPosition({
    root: dom.window.document,
    win: dom.window,
    now: () => 1000 + sevenDaysMs + 1
  });

  assert.equal(called, false);
});
