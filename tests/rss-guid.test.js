const test = require('node:test');
const assert = require('node:assert/strict');

const { enhanceRssXml } = require('../scripts/rss-enhance.js');

function sampleRssWithGuidCases() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Feed</title>
    <link>https://xdlkc.github.io/</link>
    <description>desc</description>
    <item>
      <title>Missing guid</title>
      <link>https://xdlkc.github.io/2026/03/01/a/</link>
    </item>
    <item>
      <title>Has guid</title>
      <link>https://xdlkc.github.io/2026/03/02/b/</link>
      <guid isPermaLink="false">post-b</guid>
    </item>
  </channel>
</rss>`;
}

test('enhanceRssXml ensures each item has a stable guid (permalink)', () => {
  const input = sampleRssWithGuidCases();

  const out1 = enhanceRssXml(input, {
    siteUrl: 'https://xdlkc.github.io',
    root: '/',
    feedPath: 'rss.xml',
    author: 'Evan Zhang'
  });

  // Missing guid item gets guid injected using its <link> value.
  assert.match(
    out1,
    /<title>Missing guid<\/title>[\s\S]*?<link>https:\/\/xdlkc\.github\.io\/2026\/03\/01\/a\/<\/link>[\s\S]*?<guid\s+isPermaLink="true">https:\/\/xdlkc\.github\.io\/2026\/03\/01\/a\/<\/guid>/
  );

  // Existing guid remains unchanged.
  assert.match(
    out1,
    /<title>Has guid<\/title>[\s\S]*?<guid isPermaLink="false">post-b<\/guid>/
  );

  // Idempotent.
  const out2 = enhanceRssXml(out1, {
    siteUrl: 'https://xdlkc.github.io',
    root: '/',
    feedPath: 'rss.xml',
    author: 'Evan Zhang'
  });
  assert.equal(out2, out1);
});
