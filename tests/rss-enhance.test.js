const test = require('node:test');
const assert = require('node:assert/strict');

const { enhanceRssXml } = require('../scripts/rss-enhance.js');

function sampleRss() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Evan Zhang</title>
    <link>https://xdlkc.github.io/</link>
    <description>desc</description>
    <item>
      <title>Post A</title>
      <link>https://xdlkc.github.io/2026/03/01/a/</link>
    </item>
    <item>
      <title>Post B</title>
      <dc:creator>Someone</dc:creator>
      <link>https://xdlkc.github.io/2026/03/02/b/</link>
    </item>
  </channel>
</rss>`;
}

test('enhanceRssXml injects atom/dc namespaces + channel atom:link self + item dc:creator (idempotent)', () => {
  const input = sampleRss();

  const out1 = enhanceRssXml(input, {
    siteUrl: 'https://xdlkc.github.io',
    root: '/',
    feedPath: 'rss.xml',
    author: 'Evan Zhang'
  });

  // namespaces
  assert.match(out1, /<rss[^>]*xmlns:atom="http:\/\/www\.w3\.org\/2005\/Atom"/);
  assert.match(out1, /<rss[^>]*xmlns:dc="http:\/\/purl\.org\/dc\/elements\/1\.1\/"/);

  // channel self link (attribute order-agnostic)
  assert.match(out1, /<atom:link\b[^>]*\/>/);
  assert.match(out1, /<atom:link[^>]*rel="self"/);
  assert.match(out1, /<atom:link[^>]*type="application\/rss\+xml"/);
  assert.match(out1, /<atom:link[^>]*href="https:\/\/xdlkc\.github\.io\/rss\.xml"/);

  // item creator injection (only for missing)
  const itemACreatorCount = (out1.match(/<title>Post A<\/title>[\s\S]*?<dc:creator>/g) || []).length;
  assert.equal(itemACreatorCount, 1);

  const itemBCreatorCount = (out1.match(/<title>Post B<\/title>[\s\S]*?<dc:creator>/g) || []).length;
  assert.equal(itemBCreatorCount, 1);

  // idempotent
  const out2 = enhanceRssXml(out1, {
    siteUrl: 'https://xdlkc.github.io',
    root: '/',
    feedPath: 'rss.xml',
    author: 'Evan Zhang'
  });

  assert.equal(out2, out1);
});
