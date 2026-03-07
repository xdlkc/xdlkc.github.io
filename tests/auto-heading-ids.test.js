const test = require('node:test');
const assert = require('node:assert/strict');

const { addHeadingIds } = require('../scripts/filters/auto-heading-ids');

test('addHeadingIds: adds ids to headings that lack id', () => {
  const html = '<h2>My Title</h2><p>x</p><h3>Sub Title</h3>';
  const out = addHeadingIds(html);

  assert.match(out, /<h2 id="my-title">My Title<\/h2>/);
  assert.match(out, /<h3 id="sub-title">Sub Title<\/h3>/);
});

test('addHeadingIds: preserves existing ids', () => {
  const html = '<h2 id="keep">Keep</h2><h2>New</h2>';
  const out = addHeadingIds(html);

  assert.match(out, /<h2 id="keep">Keep<\/h2>/);
  assert.match(out, /<h2 id="new">New<\/h2>/);
});

test('addHeadingIds: de-dupes duplicate slugs with numeric suffixes', () => {
  const html = '<h2>Same</h2><h3>Same</h3><h4>Same</h4>';
  const out = addHeadingIds(html);

  assert.match(out, /<h2 id="same">Same<\/h2>/);
  assert.match(out, /<h3 id="same-2">Same<\/h3>/);
  assert.match(out, /<h4 id="same-3">Same<\/h4>/);
});

test('addHeadingIds: keeps CJK characters while slugifying', () => {
  const html = '<h2>量化 交易：入门</h2>';
  const out = addHeadingIds(html);

  // whitespace -> -, punctuation removed, CJK kept
  assert.match(out, /<h2 id="量化-交易-入门">量化 交易：入门<\/h2>/);
});
