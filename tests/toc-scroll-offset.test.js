const test = require('node:test');
const assert = require('node:assert/strict');

const { computeScrollTop } = require('../themes/evan/source/js/toc-scrollspy');

test('computeScrollTop: subtracts header height and margin, clamps to 0', () => {
  assert.equal(computeScrollTop({ targetTop: 500, headerHeight: 80, margin: 12 }), 408);
  assert.equal(computeScrollTop({ targetTop: 50, headerHeight: 80, margin: 12 }), 0);
});

test('computeScrollTop: defaults margin to 12 and ignores invalid numbers', () => {
  assert.equal(computeScrollTop({ targetTop: 500, headerHeight: 80 }), 408);
  assert.equal(computeScrollTop({ targetTop: '500', headerHeight: '80' }), 408);
});
