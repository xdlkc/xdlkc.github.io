const test = require('node:test');
const assert = require('node:assert/strict');

const { buildSocialMeta } = require('../scripts/helpers/social-meta');

test('buildSocialMeta: falls back og image alt to post title for article pages when missing', () => {
  const result = buildSocialMeta({
    page: {
      title: 'An Accessible Post',
      layout: 'post',
      cover: '/images/post-cover.png'
    },
    site: {
      title: 'Site title',
      description: 'Site desc',
      language: 'en-US',
      url: 'https://xdlkc.github.io'
    },
    canonicalUrl: 'https://xdlkc.github.io/2026/03/10/a11y/'
  });

  assert.equal(result.type, 'article');
  assert.equal(result.image, 'https://xdlkc.github.io/images/post-cover.png');
  assert.equal(result.imageAlt, 'An Accessible Post');
});

test('buildSocialMeta: falls back og image alt to site title for non-article pages when missing', () => {
  const result = buildSocialMeta({
    page: {
      title: ''
    },
    site: {
      title: 'Evan Zhang',
      description: 'Site desc',
      language: 'zh-CN',
      url: 'https://xdlkc.github.io'
    },
    canonicalUrl: 'https://xdlkc.github.io/'
  });

  assert.equal(result.type, 'website');
  assert.equal(result.image, 'https://xdlkc.github.io/images/avatar.jpg');
  assert.equal(result.imageAlt, 'Evan Zhang');
});

test('buildSocialMeta: keeps explicit og image alt and does not override', () => {
  const result = buildSocialMeta({
    page: {
      title: 'Post title',
      layout: 'post',
      cover: '/images/post-cover.png',
      og_image_alt: '  Diagram preview  '
    },
    site: {
      title: 'Site title',
      description: 'Site desc',
      language: 'en-US',
      url: 'https://xdlkc.github.io'
    },
    canonicalUrl: 'https://xdlkc.github.io/2026/03/10/demo/'
  });

  assert.equal(result.imageAlt, 'Diagram preview');
});
