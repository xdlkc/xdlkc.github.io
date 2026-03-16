const test = require('node:test');
const assert = require('node:assert/strict');

const { generateSitemapXml } = require('../scripts/helpers/sitemap');

test('generateSitemapXml: generates valid XML with single URL', () => {
  const urls = [
    {
      url: 'https://example.com/',
      lastmod: new Date('2026-03-17T02:00:00Z'),
      changefreq: 'daily',
      priority: 1.0
    }
  ];

  const xml = generateSitemapXml(urls);

  assert.match(xml, /<\?xml version="1.0" encoding="UTF-8"\?>/);
  assert.match(xml, /<urlset xmlns="http:\/\/www.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.match(xml, /<loc>https:\/\/example\.com\/<\/loc>/);
  assert.match(xml, /<lastmod>2026-03-17T02:00:00Z<\/lastmod>/);
  assert.match(xml, /<changefreq>daily<\/changefreq>/);
  assert.match(xml, /<priority>1\.0<\/priority>/);
  assert.match(xml, /<\/urlset>/);
});

test('generateSitemapXml: generates multiple URLs', () => {
  const urls = [
    {
      url: 'https://example.com/',
      lastmod: new Date('2026-03-17T02:00:00Z'),
      changefreq: 'daily',
      priority: 1.0
    },
    {
      url: 'https://example.com/2026/03/17/test-post/',
      lastmod: new Date('2026-03-17T01:00:00Z'),
      changefreq: 'monthly',
      priority: 0.8
    }
  ];

  const xml = generateSitemapXml(urls);

  assert.match(xml, /<url>[\s\S]*?<\/url>/g);
  // Should have two URL blocks
  const urlBlocks = xml.match(/<url>[\s\S]*?<\/url>/g);
  assert.equal(urlBlocks.length, 2);
});

test('generateSitemapXml: handles date formatting correctly', () => {
  const urls = [
    {
      url: 'https://example.com/test/',
      lastmod: new Date('2026-03-17T02:30:45.123Z'),
      changefreq: 'weekly',
      priority: 0.5
    }
  ];

  const xml = generateSitemapXml(urls);

  // Should format date to ISO 8601 format with milliseconds truncated
  assert.match(xml, /<lastmod>2026-03-17T02:30:45Z<\/lastmod>/);
});

test('generateSitemapXml: escapes XML special characters in URLs', () => {
  const urls = [
    {
      url: 'https://example.com/2026/03/17/test&post/',
      lastmod: new Date('2026-03-17T02:00:00Z'),
      changefreq: 'monthly',
      priority: 0.8
    }
  ];

  const xml = generateSitemapXml(urls);

  // Ampersand should be escaped
  assert.match(xml, /<loc>https:\/\/example\.com\/2026\/03\/17\/test&amp;post\/<\/loc>/);
});

test('generateSitemapXml: handles empty array gracefully', () => {
  const xml = generateSitemapXml([]);

  assert.match(xml, /<urlset xmlns="http:\/\/www.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.match(xml, /<\/urlset>/);
  // Should not contain any <url> blocks
  assert.ok(!xml.includes('<url>'));
});

test('generateSitemapXml: clamps priority to [0.0, 1.0]', () => {
  const urls = [
    {
      url: 'https://example.com/test1/',
      lastmod: new Date('2026-03-17T02:00:00Z'),
      changefreq: 'daily',
      priority: 1.5
    },
    {
      url: 'https://example.com/test2/',
      lastmod: new Date('2026-03-17T02:00:00Z'),
      changefreq: 'daily',
      priority: -0.5
    }
  ];

  const xml = generateSitemapXml(urls);

  // Priorities should be clamped to 1.0 and 0.0
  assert.match(xml, /<priority>1\.0<\/priority>/);
  assert.match(xml, /<priority>0\.0<\/priority>/);
});
