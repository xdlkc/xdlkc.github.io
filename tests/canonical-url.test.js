const test = require('node:test');
const assert = require('node:assert/strict');

const { buildCanonicalUrl } = require('../scripts/helpers/canonical-url');

test('buildCanonicalUrl: builds absolute canonical URL from relative path', () => {
  const result = buildCanonicalUrl({
    siteUrl: 'https://xdlkc.com',
    pagePath: '/posts/hello-world/'
  });

  assert.equal(result, 'https://xdlkc.com/posts/hello-world/');
});

test('buildCanonicalUrl: strips query and hash', () => {
  const result = buildCanonicalUrl({
    siteUrl: 'https://xdlkc.com/',
    pagePath: '/posts/hello-world/?utm_source=foo#section-1'
  });

  assert.equal(result, 'https://xdlkc.com/posts/hello-world/');
});

test('buildCanonicalUrl: keeps absolute URL and strips query/hash', () => {
  const result = buildCanonicalUrl({
    siteUrl: 'https://xdlkc.com/',
    pagePath: 'https://blog.xdlkc.com/page/?a=1#top'
  });

  assert.equal(result, 'https://blog.xdlkc.com/page/');
});

test('buildCanonicalUrl: falls back to site root when path missing', () => {
  const result = buildCanonicalUrl({
    siteUrl: 'https://xdlkc.com',
    pagePath: ''
  });

  assert.equal(result, 'https://xdlkc.com/');
});
