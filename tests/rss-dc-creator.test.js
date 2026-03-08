const test = require('node:test');
const assert = require('node:assert/strict');

const { injectDcCreator } = require('../scripts/rss-dc-creator');

test('injectDcCreator: adds dc namespace and creator when missing', () => {
  const input = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Demo</title>
    <item>
      <title>Hello</title>
      <link>https://example.com/hello</link>
    </item>
  </channel>
</rss>`;

  const out = injectDcCreator(input, { author: 'Evan Zhang' });

  assert.match(out, /<rss[^>]*\sxmlns:dc="http:\/\/purl\.org\/dc\/elements\/1\.1\/"/);
  assert.match(out, /<item>[\s\S]*<dc:creator><!\[CDATA\[Evan Zhang\]\]><\/dc:creator>[\s\S]*<\/item>/);
});

test('injectDcCreator: idempotent when creator already exists', () => {
  const input = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <item>
      <title>Hello</title>
      <dc:creator><![CDATA[Evan Zhang]]></dc:creator>
    </item>
  </channel>
</rss>`;

  const out = injectDcCreator(input, { author: 'Evan Zhang' });

  const matches = out.match(/<dc:creator>/g) || [];
  assert.equal(matches.length, 1);
});

test('injectDcCreator: no-op when author missing', () => {
  const input = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Hello</title>
    </item>
  </channel>
</rss>`;

  const out = injectDcCreator(input, { author: '' });
  assert.equal(out, input);
});
