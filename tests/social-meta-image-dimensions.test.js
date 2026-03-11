const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { buildSocialMeta } = require('../scripts/helpers/social-meta');

test('buildSocialMeta: returns image type + dimensions for local /images asset when rootDir provided', () => {
  const rootDir = path.join(__dirname, '..');

  const res = buildSocialMeta({
    page: {
      title: 'Hello',
      layout: 'page',
      // root-relative local asset
      image: '/images/avatar.jpg'
    },
    site: {
      title: 'Site',
      url: 'https://xdlkc.github.io'
    },
    canonicalUrl: 'https://xdlkc.github.io/hello/',
    rootDir
  });

  assert.equal(res.image, 'https://xdlkc.github.io/images/avatar.jpg');
  assert.equal(res.imageType, 'image/jpeg');
  assert.ok(Number.isInteger(res.imageWidth) && res.imageWidth > 0);
  assert.ok(Number.isInteger(res.imageHeight) && res.imageHeight > 0);
});

test('buildSocialMeta: remote image does not attempt to read dimensions', () => {
  const res = buildSocialMeta({
    page: {
      title: 'Hello',
      layout: 'post',
      og_image: 'https://cdn.example.com/a.png'
    },
    site: {
      title: 'Site',
      url: 'https://xdlkc.github.io'
    },
    canonicalUrl: 'https://xdlkc.github.io/hello/'
  });

  assert.equal(res.image, 'https://cdn.example.com/a.png');
  // still can provide type via extension inference
  assert.equal(res.imageType, 'image/png');
  assert.equal(res.imageWidth, 0);
  assert.equal(res.imageHeight, 0);
});
