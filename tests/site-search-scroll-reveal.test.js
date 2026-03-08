const test = require('node:test');
const assert = require('node:assert/strict');

const SiteSearch = require('../themes/evan/source/js/site-search.js');

test('computeScrollTopToReveal keeps selected item visible (nearest reveal)', () => {
  assert.equal(typeof SiteSearch.computeScrollTopToReveal, 'function');

  // Item below viewport: scroll down so its bottom aligns to viewport bottom.
  assert.equal(
    SiteSearch.computeScrollTopToReveal({
      containerScrollTop: 0,
      containerHeight: 100,
      itemTop: 150,
      itemHeight: 20
    }),
    70
  );

  // Item above viewport: scroll up so its top aligns to viewport top.
  assert.equal(
    SiteSearch.computeScrollTopToReveal({
      containerScrollTop: 80,
      containerHeight: 100,
      itemTop: 40,
      itemHeight: 20
    }),
    40
  );

  // Item fully visible: no change.
  assert.equal(
    SiteSearch.computeScrollTopToReveal({
      containerScrollTop: 20,
      containerHeight: 100,
      itemTop: 50,
      itemHeight: 20
    }),
    20
  );
});
