const test = require('node:test');
const assert = require('node:assert/strict');

const { computeScrollTopForPercent, computePercentFromPointer } = require('../themes/evan/source/js/reading-progress.js');

test('computeScrollTopForPercent clamps percent and maps to scrollTop within scrollable range', () => {
  const docHeight = 3000;
  const winHeight = 1000;
  // totalScrollable = 2000

  assert.equal(computeScrollTopForPercent({ percent: 0, docHeight, winHeight }), 0);
  assert.equal(computeScrollTopForPercent({ percent: 50, docHeight, winHeight }), 1000);
  assert.equal(computeScrollTopForPercent({ percent: 100, docHeight, winHeight }), 2000);

  // clamp
  assert.equal(computeScrollTopForPercent({ percent: -10, docHeight, winHeight }), 0);
  assert.equal(computeScrollTopForPercent({ percent: 999, docHeight, winHeight }), 2000);
});

test('computeScrollTopForPercent returns 0 when page is not scrollable', () => {
  assert.equal(computeScrollTopForPercent({ percent: 50, docHeight: 900, winHeight: 1000 }), 0);
  assert.equal(computeScrollTopForPercent({ percent: 50, docHeight: 1000, winHeight: 1000 }), 0);
});

test('computePercentFromPointer maps clientX to 0-100 percent and clamps out-of-range', () => {
  const left = 100;
  const width = 200;

  assert.equal(computePercentFromPointer({ clientX: 100, left, width }), 0);
  assert.equal(computePercentFromPointer({ clientX: 200, left, width }), 50);
  assert.equal(computePercentFromPointer({ clientX: 300, left, width }), 100);

  assert.equal(computePercentFromPointer({ clientX: 50, left, width }), 0);
  assert.equal(computePercentFromPointer({ clientX: 350, left, width }), 100);
});
