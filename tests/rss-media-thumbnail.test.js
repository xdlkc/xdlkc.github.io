const test = require('node:test');
const assert = require('node:assert/strict');

// New feature: inject media:thumbnail into rss.xml items.

test('enhanceRssXml adds xmlns:media and injects media:thumbnail from first image in content:encoded', () => {
  const { enhanceRssXml } = require('../scripts/rss-media-thumbnail');

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <item>
      <title>Hello</title>
      <content:encoded><![CDATA[<p>Hi</p><img src="https://example.com/a.png" />]]></content:encoded>
    </item>
  </channel>
</rss>`;

  const out = enhanceRssXml(xml);

  assert.match(out, /xmlns:media="http:\/\/search\.yahoo\.com\/mrss\/"/);
  assert.match(out, /<media:thumbnail\s+url="https:\/\/example\.com\/a\.png"\s*\/>/);
});

test('enhanceRssXml is idempotent (no duplicate namespace or thumbnails)', () => {
  const { enhanceRssXml } = require('../scripts/rss-media-thumbnail');

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <item>
      <title>Hello</title>
      <content:encoded><![CDATA[<p>Hi</p><img src='https://example.com/a.png' />]]></content:encoded>
      <media:thumbnail url="https://example.com/a.png" />
    </item>
  </channel>
</rss>`;

  const out = enhanceRssXml(xml);
  assert.equal(out.match(/xmlns:media=/g)?.length || 0, 1);
  assert.equal(out.match(/<media:thumbnail\b/g)?.length || 0, 1);
});

test('enhanceRssXml skips items without images', () => {
  const { enhanceRssXml } = require('../scripts/rss-media-thumbnail');

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <item>
      <title>No Image</title>
      <content:encoded><![CDATA[<p>Hi</p>]]></content:encoded>
    </item>
  </channel>
</rss>`;

  const out = enhanceRssXml(xml);
  assert.match(out, /xmlns:media="http:\/\/search\.yahoo\.com\/mrss\/"/);
  assert.doesNotMatch(out, /<media:thumbnail\b/);
});
