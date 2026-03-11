const test = require('node:test');
const assert = require('node:assert/strict');

const { buildRelatedPostsExcerpt } = require('../scripts/helpers/related-posts-excerpt');

test('buildRelatedPostsExcerpt prefers excerpt, strips HTML, collapses whitespace and truncates', () => {
  const out = buildRelatedPostsExcerpt({
    excerpt: 'Hello <b>world</b>\n\nthis is a   test',
    content: 'fallback content',
    maxLength: 12
  });

  assert.equal(out, 'Hello world');
});

test('buildRelatedPostsExcerpt falls back to content when excerpt is empty', () => {
  const out = buildRelatedPostsExcerpt({
    excerpt: '   ',
    content: '<p>Content only</p>'
  });

  assert.equal(out, 'Content only');
});

test('buildRelatedPostsExcerpt returns empty string when nothing usable', () => {
  const out = buildRelatedPostsExcerpt({ excerpt: '', content: '   ' });
  assert.equal(out, '');
});
