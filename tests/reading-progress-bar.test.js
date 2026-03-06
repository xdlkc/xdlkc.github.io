const test = require('node:test');
const assert = require('node:assert/strict');

const { computeReadingProgressPercent } = require('../themes/evan/source/js/reading-progress');

test('computeReadingProgressPercent: returns 0 at top of a scrollable page', () => {
  const percent = computeReadingProgressPercent({
    scrollY: 0,
    docHeight: 2000,
    winHeight: 1000
  });
  assert.equal(percent, 0);
});

test('computeReadingProgressPercent: returns 100 at bottom of a scrollable page', () => {
  const percent = computeReadingProgressPercent({
    scrollY: 1000,
    docHeight: 2000,
    winHeight: 1000
  });
  assert.equal(percent, 100);
});

test('computeReadingProgressPercent: clamps to [0, 100]', () => {
  assert.equal(
    computeReadingProgressPercent({ scrollY: -10, docHeight: 2000, winHeight: 1000 }),
    0
  );
  assert.equal(
    computeReadingProgressPercent({ scrollY: 999999, docHeight: 2000, winHeight: 1000 }),
    100
  );
});

test('computeReadingProgressPercent: returns 100 for non-scrollable pages', () => {
  const percent = computeReadingProgressPercent({
    scrollY: 0,
    docHeight: 800,
    winHeight: 1000
  });
  assert.equal(percent, 100);
});
