const test = require('node:test');
const assert = require('node:assert/strict');

const {
  slugifyHeading,
  pickActiveHeadingId
} = require('../themes/evan/source/js/toc-scrollspy');

test('slugifyHeading: creates url-safe id', () => {
  assert.equal(slugifyHeading('Hello World'), 'hello-world');
  assert.equal(slugifyHeading('  Hello   World  '), 'hello-world');
  assert.equal(slugifyHeading('中文 标题'), '中文-标题');
  assert.equal(slugifyHeading('A/B & C'), 'a-b-c');
});

test('pickActiveHeadingId: selects first heading when above first', () => {
  const headings = [
    { id: 'h2-a', top: 200 },
    { id: 'h2-b', top: 600 }
  ];

  assert.equal(pickActiveHeadingId({ scrollY: 0, headings }), 'h2-a');
  assert.equal(pickActiveHeadingId({ scrollY: 199, headings }), 'h2-a');
});

test('pickActiveHeadingId: selects current section while scrolling down', () => {
  const headings = [
    { id: 'h2-a', top: 200 },
    { id: 'h2-b', top: 600 },
    { id: 'h2-c', top: 900 }
  ];

  assert.equal(pickActiveHeadingId({ scrollY: 200, headings }), 'h2-a');
  assert.equal(pickActiveHeadingId({ scrollY: 599, headings }), 'h2-a');
  assert.equal(pickActiveHeadingId({ scrollY: 600, headings }), 'h2-b');
  assert.equal(pickActiveHeadingId({ scrollY: 899, headings }), 'h2-b');
  assert.equal(pickActiveHeadingId({ scrollY: 900, headings }), 'h2-c');
});

test('pickActiveHeadingId: falls back to last when beyond last heading', () => {
  const headings = [
    { id: 'h2-a', top: 200 },
    { id: 'h2-b', top: 600 }
  ];

  assert.equal(pickActiveHeadingId({ scrollY: 99999, headings }), 'h2-b');
});
