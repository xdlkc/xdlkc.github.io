const test = require('node:test');
const assert = require('node:assert/strict');

const { absolutizeRssXml } = require('../scripts/rss-absolutize-links');

test('absolutizeRssXml: rewrites root-relative href/src to absolute URLs', () => {
  const xml = `<?xml version="1.0"?>
<rss><channel>
  <item>
    <description><![CDATA[
      <p><a href="/2026/hello/">link</a></p>
      <p><img src="/images/a.png" /></p>
    ]]></description>
  </item>
</channel></rss>`;

  const out = absolutizeRssXml(xml, 'https://example.com');

  assert.match(out, /href="https:\/\/example\.com\/2026\/hello\/"/);
  assert.match(out, /src="https:\/\/example\.com\/images\/a\.png"/);
});

test('absolutizeRssXml: keeps absolute URLs and other schemes unchanged', () => {
  const xml = `<rss><channel><item>
    <description><![CDATA[
      <a href="https://x.com/a">x</a>
      <a href="mailto:test@example.com">m</a>
      <img src="data:image/png;base64,AAA" />
    ]]></description>
  </item></channel></rss>`;

  const out = absolutizeRssXml(xml, 'https://example.com');

  assert.match(out, /href="https:\/\/x\.com\/a"/);
  assert.match(out, /href="mailto:test@example\.com"/);
  assert.match(out, /src="data:image\/png;base64,AAA"/);
});
