const test = require('node:test');
const assert = require('node:assert/strict');

const { buildMetaDescription } = require('../scripts/helpers/meta-description');

test('buildMetaDescription: prefers page description when present', () => {
  const result = buildMetaDescription({
    pageDescription: '  custom page desc  ',
    excerpt: '<p>excerpt</p>',
    content: '<p>content</p>',
    siteDescription: 'site'
  });

  assert.equal(result, 'custom page desc');
});

test('buildMetaDescription: falls back to excerpt and strips HTML', () => {
  const result = buildMetaDescription({
    excerpt: '<p>Hello <strong>world</strong></p>',
    content: '<p>content</p>',
    siteDescription: 'site'
  });

  assert.equal(result, 'Hello world');
});

test('buildMetaDescription: truncates generated text to 160 chars', () => {
  const longText = 'a'.repeat(200);
  const result = buildMetaDescription({
    content: `<p>${longText}</p>`,
    siteDescription: 'site'
  });

  assert.equal(result.length, 160);
  assert.equal(result, 'a'.repeat(160));
});

test('buildMetaDescription: falls back to site description when generated text is empty', () => {
  const result = buildMetaDescription({
    content: '<p><br/></p>',
    siteDescription: 'site default desc'
  });

  assert.equal(result, 'site default desc');
});
