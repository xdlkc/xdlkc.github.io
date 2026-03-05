const test = require('node:test');
const assert = require('node:assert/strict');

const { buildStructuredData } = require('../scripts/helpers/structured-data');

test('buildStructuredData: builds BlogPosting JSON-LD for post page', () => {
  const result = buildStructuredData({
    page: {
      title: 'Structured Data in Hexo',
      description: 'How to add JSON-LD for SEO',
      layout: 'post',
      date: '2026-03-01 08:00:00',
      updated: '2026-03-05 09:30:00'
    },
    site: {
      title: 'XDLKC Blog'
    },
    canonicalUrl: 'https://xdlkc.github.io/2026/03/01/structured-data/',
    image: 'https://xdlkc.github.io/images/post-cover.png',
    wordCount: 888
  });

  assert.equal(result['@context'], 'https://schema.org');
  assert.equal(result['@type'], 'BlogPosting');
  assert.equal(result.headline, 'Structured Data in Hexo');
  assert.equal(result.description, 'How to add JSON-LD for SEO');
  assert.equal(result.url, 'https://xdlkc.github.io/2026/03/01/structured-data/');
  assert.deepEqual(result.image, ['https://xdlkc.github.io/images/post-cover.png']);
  assert.equal(result.wordCount, 888);
  assert.equal(result.mainEntityOfPage, 'https://xdlkc.github.io/2026/03/01/structured-data/');
  assert.deepEqual(result.author, {
    '@type': 'Person',
    name: 'XDLKC Blog'
  });
  assert.match(result.datePublished, /^\d{4}-\d{2}-\d{2}T/);
  assert.match(result.dateModified, /^\d{4}-\d{2}-\d{2}T/);
});

test('buildStructuredData: returns null for non-post page', () => {
  const result = buildStructuredData({
    page: {
      title: 'About',
      layout: 'page'
    },
    site: {
      title: 'XDLKC Blog'
    },
    canonicalUrl: 'https://xdlkc.github.io/about/'
  });

  assert.equal(result, null);
});

test('buildStructuredData: omits optional fields when data is missing', () => {
  const result = buildStructuredData({
    page: {
      title: 'Minimal Post',
      layout: 'post'
    },
    site: {
      title: 'XDLKC Blog'
    },
    canonicalUrl: 'https://xdlkc.github.io/2026/03/06/minimal/'
  });

  assert.equal(result.headline, 'Minimal Post');
  assert.ok(!('description' in result));
  assert.ok(!('image' in result));
  assert.ok(!('datePublished' in result));
  assert.ok(!('dateModified' in result));
  assert.ok(!('wordCount' in result));
});
