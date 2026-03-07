const test = require('node:test');
const assert = require('node:assert/strict');

const {
  resolveFeedImage,
  applyFeedImageToPost
} = require('../scripts/filters/feed-image');

test('resolveFeedImage: prefers explicit image', () => {
  const post = { image: '/images/a.png', ogImage: '/images/b.png' };
  assert.equal(resolveFeedImage(post), '/images/a.png');
});

test('resolveFeedImage: falls back to ogImage/og_image', () => {
  assert.equal(resolveFeedImage({ ogImage: '/images/og.png' }), '/images/og.png');
  assert.equal(resolveFeedImage({ og_image: '/images/og2.png' }), '/images/og2.png');
});

test('resolveFeedImage: supports cover/banner/thumbnail', () => {
  assert.equal(resolveFeedImage({ cover: '/images/c.png' }), '/images/c.png');
  assert.equal(resolveFeedImage({ banner: '/images/d.png' }), '/images/d.png');
  assert.equal(resolveFeedImage({ thumbnail: '/images/e.png' }), '/images/e.png');
});

test('resolveFeedImage: supports photos[0]', () => {
  assert.equal(resolveFeedImage({ photos: ['/images/p.png'] }), '/images/p.png');
});

test('resolveFeedImage: trims and ignores empty values', () => {
  assert.equal(resolveFeedImage({ ogImage: '   ' }), null);
  assert.equal(resolveFeedImage({ image: '' }), null);
});

test('applyFeedImageToPost: fills post.image when missing', () => {
  const post = { ogImage: '/images/og.png' };
  applyFeedImageToPost(post);
  assert.equal(post.image, '/images/og.png');
});

test('applyFeedImageToPost: does not override existing post.image', () => {
  const post = { image: '/images/a.png', ogImage: '/images/og.png' };
  applyFeedImageToPost(post);
  assert.equal(post.image, '/images/a.png');
});
