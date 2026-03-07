const test = require('node:test');
const assert = require('node:assert/strict');

test('enhanceRssXml prefers enclosure url (cover image) over first content image', () => {
  const { enhanceRssXml } = require('../scripts/rss-media-thumbnail');

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <item>
      <title>Hello</title>
      <enclosure url="https://example.com/cover.png" type="image/png" />
      <content:encoded><![CDATA[<p>Hi</p><img src="https://example.com/inline.png" />]]></content:encoded>
    </item>
  </channel>
</rss>`;

  const out = enhanceRssXml(xml);

  assert.match(out, /<media:thumbnail\s+url="https:\/\/example\.com\/cover\.png"\s*\/>/);
  assert.match(out, /<media:content\s+url="https:\/\/example\.com\/cover\.png"\s+medium="image"\s*\/>/);
});
