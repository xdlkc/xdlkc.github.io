const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  parseFeedXml,
  normalizeUrl,
  parseJsonFromLlm,
  buildNewsItem,
  mergeNewsLists,
} = require('../tools/aihot-sync.js');

test('aihot-sources.json contains 18 valid RSS/Atom sources with tiers', () => {
  const raw = fs.readFileSync(
    path.join(__dirname, '..', 'source', '_data', 'aihot-sources.json'),
    'utf8'
  );
  const data = JSON.parse(raw);
  assert.equal(data.sources.length, 18);
  data.sources.forEach((src) => {
    assert.ok(src.id && src.name);
    assert.match(src.feedUrl, /^https:\/\//);
    assert.ok(src.tier === 'T1' || src.tier === 'T2');
  });
});

test('parseFeedXml parses RSS 2.0 and Atom entries with CDATA and entities', () => {
  const rss = `<?xml version="1.0"?>
  <rss version="2.0"><channel>
    <item>
      <title><![CDATA[OpenAI launches &amp; tests Agent SDK]]></title>
      <link>https://openai.com/news/agent-sdk/?utm_source=rss</link>
      <pubDate>Sun, 22 Nov 2026 08:00:00 GMT</pubDate>
      <description><![CDATA[<p>New SDK for <b>agents</b>.</p>]]></description>
    </item>
  </channel></rss>`;

  const rssItems = parseFeedXml(rss, { id: 'rss-openai-news', name: 'OpenAI News', tier: 'T1', tags: ['官方'] });
  assert.equal(rssItems.length, 1);
  assert.equal(rssItems[0].title, 'OpenAI launches & tests Agent SDK');
  assert.equal(rssItems[0].snippet, 'New SDK for agents.');
  assert.equal(rssItems[0].tier, 'T1');

  const atom = `<?xml version="1.0"?>
  <feed xmlns="http://www.w3.org/2005/Atom">
    <entry>
      <title>Simon Willison on LLM tools</title>
      <link rel="alternate" href="https://simonwillison.net/2026/Nov/22/llm/"/>
      <updated>2026-11-22T09:00:00Z</updated>
      <summary>Hands-on notes.</summary>
    </entry>
  </feed>`;

  const atomItems = parseFeedXml(atom, { id: 'rss-simon-willison', name: 'Simon Willison', tier: 'T2', tags: ['个人'] });
  assert.equal(atomItems.length, 1);
  assert.equal(atomItems[0].url, 'https://simonwillison.net/2026/Nov/22/llm/');
  assert.equal(atomItems[0].publishedAt, '2026-11-22T09:00:00.000Z');
});

test('buildNewsItem enforces AIHOT T1 (60) and T2 (76) selection thresholds', () => {
  const t1Candidate = {
    sourceId: 'rss-openai-news',
    source: 'OpenAI News',
    tier: 'T1',
    sourceTags: ['官方'],
    title: 'Raw Title',
    url: 'https://openai.com/news/demo',
    publishedAt: '2026-11-22T08:00:00.000Z',
    snippet: 'Details',
  };
  const t2Candidate = {
    ...t1Candidate,
    sourceId: 'rss-the-verge-ai',
    source: 'The Verge · AI',
    tier: 'T2',
    sourceTags: ['媒体'],
    url: 'https://www.theverge.com/ai/demo',
  };

  assert.equal(buildNewsItem(t1Candidate, { score: 59, title: 'A', summary: 'B' }), null);
  const keptT1 = buildNewsItem(t1Candidate, {
    score: 62,
    title: 'OpenAI 发布演示',
    summary: 'OpenAI 发布新能力。',
    context: '值得关注。',
    tags: ['OpenAI', 'Agent'],
  });
  assert.ok(keptT1);
  assert.deepEqual(keptT1.region, ['AI精选', '官方']);
  assert.equal(keptT1.score, 62);

  assert.equal(buildNewsItem(t2Candidate, { score: 75, title: 'A', summary: 'B' }), null);
  assert.ok(buildNewsItem(t2Candidate, { score: 78, title: '媒体深度', summary: '答案前置摘要。' }));
});

test('parseJsonFromLlm extracts fenced JSON and mergeNewsLists deduplicates and caps', () => {
  const parsed = parseJsonFromLlm('```json\n{"score": 82, "title": "测试", "summary": "摘要"}\n```');
  assert.equal(parsed.score, 82);

  assert.equal(
    normalizeUrl('https://openai.com/news/post/?utm_source=rss&a=1#top'),
    'https://openai.com/news/post?a=1'
  );

  const existing = [
    { id: '1', title: 'Old Post', url: 'https://example.com/a', publishedAt: '2026-11-20T00:00:00Z' },
    { id: '2', title: 'Older Post', url: 'https://example.com/b', publishedAt: '2026-11-19T00:00:00Z' },
  ];
  const incoming = [
    { id: '3', title: 'Duplicate URL', url: 'https://example.com/a/?utm_medium=social', publishedAt: '2026-11-22T00:00:00Z' },
    { id: '4', title: 'Brand New', url: 'https://example.com/c', publishedAt: '2026-11-22T01:00:00Z' },
  ];

  const merged = mergeNewsLists(existing, incoming, 2);
  assert.equal(merged.length, 2);
  assert.equal(merged[0].id, '4');
  assert.equal(merged[1].id, '3');
});
