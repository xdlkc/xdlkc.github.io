const test = require('node:test');
const assert = require('node:assert/strict');

const { buildSocialMeta } = require('../scripts/helpers/social-meta');

test('buildSocialMeta: uses cover image and large twitter card', () => {
  const result = buildSocialMeta({
    page: {
      title: 'Post title',
      description: 'Post description',
      cover: '/images/post-cover.png',
      layout: 'post'
    },
    site: {
      title: 'Site title',
      description: 'Site desc',
      url: 'https://xdlkc.github.io'
    },
    canonicalUrl: 'https://xdlkc.github.io/2026/03/06/demo/'
  });

  assert.equal(result.image, 'https://xdlkc.github.io/images/post-cover.png');
  assert.equal(result.twitterCard, 'summary_large_image');
  assert.equal(result.type, 'article');
});

test('buildSocialMeta: extracts first image from content when cover is missing', () => {
  const result = buildSocialMeta({
    page: {
      title: 'Post title',
      content: '<p>hello</p><img src="/images/inline.jpg" /><p>end</p>'
    },
    site: {
      title: 'Site title',
      description: 'Site desc',
      url: 'https://xdlkc.github.io'
    },
    canonicalUrl: 'https://xdlkc.github.io/2026/03/06/demo/'
  });

  assert.equal(result.image, 'https://xdlkc.github.io/images/inline.jpg');
  assert.equal(result.twitterCard, 'summary_large_image');
});

test('buildSocialMeta: falls back to default avatar image and summary card', () => {
  const result = buildSocialMeta({
    page: {
      title: 'Home'
    },
    site: {
      title: 'Site title',
      description: 'Site desc',
      url: 'https://xdlkc.github.io'
    },
    canonicalUrl: 'https://xdlkc.github.io/'
  });

  assert.equal(result.image, 'https://xdlkc.github.io/images/avatar.jpg');
  assert.equal(result.twitterCard, 'summary');
  assert.equal(result.type, 'website');
});
