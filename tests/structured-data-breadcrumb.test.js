const assert = require('assert');
const { JSDOM } = require('jsdom');
const { buildStructuredData } = require('../scripts/helpers/structured-data');
const { buildSocialMeta } = require('../scripts/helpers/social-meta');
const { toAbsoluteUrl } = require('../scripts/helpers/social-meta');

// Mock Hexo `this` context for helpers.
function mockHexoContext({ page, config, canonicalUrl, urlFor, postWordCount }) {
  const ctx = {
    page: page,
    config: config,
    canonical_url: () => canonicalUrl,
    url_for: urlFor || ((p) => toAbsoluteUrl(p, config.url)), // Ensure absolute URLs for categories
    post_word_count: postWordCount || (() => 100), // Default word count
  };
  // Mock social_meta to be callable within the context
  ctx.social_meta = () => buildSocialMeta({
    page: page,
    site: config,
    canonicalUrl: canonicalUrl,
    rootDir: process.cwd() // Mock rootDir for image resolution
  });
  return ctx;
}

// Helper to extract JSON-LD from HTML string (not used directly in this test, but good for reference)
function getJsonLd(html, type) {
  const dom = new JSDOM(html);
  const script = Array.from(dom.window.document.querySelectorAll('script[type="application/ld+json"]'))
    .map(s => JSON.parse(s.textContent));
  return script.find(item => item['@type'] === type);
}

test('structured_data helper should include BreadcrumbList for post pages with category', () => {
  const page = {
    layout: 'post',
    title: 'Test Post Title',
    date: new Date('2026-03-19T12:00:00Z'),
    content: 'Some post content here.',
    categories: [{ name: 'Test Category', path: 'categories/test-category/' }],
  };
  const config = {
    title: 'My Blog',
    url: 'https://example.com',
    author: 'Test Author',
    language: 'en-US',
  };
  const canonicalUrl = 'https://example.com/2026/03/19/test-post-title/';

  const ctx = mockHexoContext({ page, config, canonicalUrl });
  // Call the helper directly on the mocked context
  const result = buildStructuredData({
    page: ctx.page,
    site: ctx.config,
    canonicalUrl: ctx.canonical_url(),
    image: ctx.social_meta().image,
    wordCount: ctx.post_word_count(ctx.page && ctx.page.content),
    helperContext: ctx // Pass the entire context for url_for
  });

  assert.ok(result, 'Structured data should not be null');
  assert.strictEqual(result['@type'], 'BlogPosting', 'Main type should be BlogPosting');

  const breadcrumb = result.breadcrumbList || null;

  assert.ok(breadcrumb, 'Should contain a BreadcrumbList object');
  assert.strictEqual(breadcrumb['@context'], 'https://schema.org', 'BreadcrumbList context should be correct');
  assert.strictEqual(breadcrumb.itemListElement.length, 3, 'BreadcrumbList should have 3 elements');

  // Home
  assert.strictEqual(breadcrumb.itemListElement[0]['@type'], 'ListItem');
  assert.strictEqual(breadcrumb.itemListElement[0].position, 1);
  assert.strictEqual(breadcrumb.itemListElement[0].name, config.title);
  assert.strictEqual(breadcrumb.itemListElement[0].item, config.url);

  // Category
  assert.strictEqual(breadcrumb.itemListElement[1]['@type'], 'ListItem');
  assert.strictEqual(breadcrumb.itemListElement[1].position, 2);
  assert.strictEqual(breadcrumb.itemListElement[1].name, page.categories[0].name);
  assert.strictEqual(breadcrumb.itemListElement[1].item, toAbsoluteUrl(ctx.url_for(page.categories[0].path), config.url));

  // Post
  assert.strictEqual(breadcrumb.itemListElement[2]['@type'], 'ListItem');
  assert.strictEqual(breadcrumb.itemListElement[2].position, 3);
  assert.strictEqual(breadcrumb.itemListElement[2].name, page.title);
  assert.strictEqual(breadcrumb.itemListElement[2].item, canonicalUrl);
});

test('structured_data helper should include BreadcrumbList for post pages without category', () => {
  const page = {
    layout: 'post',
    title: 'Another Test Post',
    date: new Date('2026-03-19T12:00:00Z'),
    content: 'Some content.',
    categories: [], // No category
  };
  const config = {
    title: 'My Blog',
    url: 'https://example.com',
    author: 'Test Author',
    language: 'en-US',
  };
  const canonicalUrl = 'https://example.com/2026/03/19/another-test-post/';

  const ctx = mockHexoContext({ page, config, canonicalUrl });
  const result = buildStructuredData({
    page: ctx.page,
    site: ctx.config,
    canonicalUrl: ctx.canonical_url(),
    image: ctx.social_meta().image,
    wordCount: ctx.post_word_count(ctx.page && ctx.page.content),
    helperContext: ctx
  });

  assert.ok(result, 'Structured data should not be null');
  assert.strictEqual(result['@type'], 'BlogPosting', 'Main type should be BlogPosting');

  const breadcrumb = result.breadcrumbList || null;

  assert.ok(breadcrumb, 'Should contain a BreadcrumbList object');
  assert.strictEqual(breadcrumb['@context'], 'https://schema.org', 'BreadcrumbList context should be correct');
  assert.strictEqual(breadcrumb.itemListElement.length, 2, 'BreadcrumbList should have 2 elements'); // Home + Post

  // Home
  assert.strictEqual(breadcrumb.itemListElement[0]['@type'], 'ListItem');
  assert.strictEqual(breadcrumb.itemListElement[0].position, 1);
  assert.strictEqual(breadcrumb.itemListElement[0].name, config.title);
  assert.strictEqual(breadcrumb.itemListElement[0].item, config.url);

  // Post
  assert.strictEqual(breadcrumb.itemListElement[1]['@type'], 'ListItem');
  assert.strictEqual(breadcrumb.itemListElement[1].position, 2);
  assert.strictEqual(breadcrumb.itemListElement[1].name, page.title);
  assert.strictEqual(breadcrumb.itemListElement[1].item, canonicalUrl);
});

test('structured_data helper should not include BreadcrumbList for non-post pages', () => {
  const page = {
    layout: 'page', // Not a post page
    title: 'About Us',
    content: 'About page content.',
  };
  const config = {
    title: 'My Blog',
    url: 'https://example.com',
    author: 'Test Author',
    language: 'en-US',
  };
  const canonicalUrl = 'https://example.com/about/';

  const ctx = mockHexoContext({ page, config, canonicalUrl });
  // For non-post pages, buildStructuredData returns null
  const result = buildStructuredData({
    page: ctx.page,
    site: ctx.config,
    canonicalUrl: ctx.canonical_url(),
    image: ctx.social_meta().image,
    wordCount: 0,
    helperContext: ctx
  });

  // Non-post pages should return null
  assert.strictEqual(result, null, 'Structured data should be null for non-post pages');
});

// Temporarily disable the third test as buildStructuredData returns null for non-post pages by design.
// This means structured_data helper for non-post pages would return null, and not a BlogPosting.
// I will re-enable and adjust this test after implementing the BreadcrumbList logic to ensure
// it only applies to post pages.
