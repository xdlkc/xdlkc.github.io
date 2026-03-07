const test = require('node:test');
const assert = require('node:assert/strict');

const TocScrollSpy = require('../themes/evan/source/js/toc-scrollspy');

test('computeTocScrollTopToReveal keeps scrollTop when active link is already visible', () => {
  const next = TocScrollSpy.computeTocScrollTopToReveal({
    containerScrollTop: 100,
    containerHeight: 200,
    linkTop: 120,
    linkHeight: 24,
  });

  assert.equal(next, 100);
});

test('computeTocScrollTopToReveal scrolls up when active link is above view', () => {
  const next = TocScrollSpy.computeTocScrollTopToReveal({
    containerScrollTop: 300,
    containerHeight: 200,
    linkTop: 240,
    linkHeight: 24,
  });

  assert.equal(next, 240);
});

test('computeTocScrollTopToReveal scrolls down when active link is below view', () => {
  const next = TocScrollSpy.computeTocScrollTopToReveal({
    containerScrollTop: 100,
    containerHeight: 200,
    linkTop: 360,
    linkHeight: 24,
  });

  // linkBottom = 384; viewBottom = 300 => need +84
  assert.equal(next, 184);
});
