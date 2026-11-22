const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  parseFeedXml,
  parseJsonFeed,
  parseWebHtml,
  filterSources,
  normalizeUrl,
  parseJsonFromLlm,
  normalizeExistingNewsItem,
  buildNewsItem,
  mergeNewsLists,
  buildHotEvents,
  parseCliArgs,
} = require('../tools/aihot-sync.js');

const VALID_KINDS = new Set(['rss', 'atom', 'json', 'web']);
const VALID_INDUSTRIES = new Set(['AI', '工程与开源', '金融与政策']);

test('aihot-sources.json contains upgraded multi-kind, multi-industry sources including all 18 AI sources', () => {
  const raw = fs.readFileSync(
    path.join(__dirname, '..', 'source', '_data', 'aihot-sources.json'),
    'utf8'
  );
  const data = JSON.parse(raw);
  assert.ok(Array.isArray(data.sources) && data.sources.length >= 25);

  const aiSources = data.sources.filter((s) => s.industry === 'AI');
  const engSources = data.sources.filter((s) => s.industry === '工程与开源');
  const finSources = data.sources.filter((s) => s.industry === '金融与政策');
  assert.equal(aiSources.length, 18);
  assert.ok(engSources.length >= 3);
  assert.ok(finSources.length >= 4);

  const seenKinds = new Set();
  data.sources.forEach((src) => {
    assert.ok(src.id && src.name);
    assert.match(src.feedUrl, /^https:\/\//);
    assert.ok(src.tier === 'T1' || src.tier === 'T2');
    assert.ok(VALID_KINDS.has(src.kind), `Invalid kind on ${src.id}: ${src.kind}`);
    assert.ok(VALID_INDUSTRIES.has(src.industry), `Invalid industry on ${src.id}: ${src.industry}`);
    assert.ok(Array.isArray(src.topics) && src.topics.length > 0, `Missing topics on ${src.id}`);
    seenKinds.add(src.kind);
  });

  assert.ok(seenKinds.has('rss'));
  assert.ok(seenKinds.has('atom'));
  assert.ok(seenKinds.has('json'));
  assert.ok(seenKinds.has('web'));
});

test('parseFeedXml parses RSS 2.0 and Atom entries with CDATA, entities, industry, and topics', () => {
  const rss = `<?xml version="1.0"?>
  <rss version="2.0"><channel>
    <item>
      <title><![CDATA[OpenAI launches &amp; tests Agent SDK]]></title>
      <link>https://openai.com/news/agent-sdk/?utm_source=rss</link>
      <pubDate>Sun, 22 Nov 2026 08:00:00 GMT</pubDate>
      <description><![CDATA[<p>New SDK for <b>agents</b>.</p>]]></description>
    </item>
  </channel></rss>`;

  const rssItems = parseFeedXml(rss, {
    id: 'rss-openai-news',
    name: 'OpenAI News',
    kind: 'rss',
    industry: 'AI',
    tier: 'T1',
    tags: ['官方'],
    topics: ['Agent 智能体'],
  });
  assert.equal(rssItems.length, 1);
  assert.equal(rssItems[0].title, 'OpenAI launches & tests Agent SDK');
  assert.equal(rssItems[0].snippet, 'New SDK for agents.');
  assert.equal(rssItems[0].tier, 'T1');
  assert.equal(rssItems[0].industry, 'AI');
  assert.deepEqual(rssItems[0].topics, ['Agent 智能体']);
  assert.equal(rssItems[0].sourceKind, 'rss');

  const atom = `<?xml version="1.0"?>
  <feed xmlns="http://www.w3.org/2005/Atom">
    <entry>
      <title>Simon Willison on LLM tools</title>
      <link rel="alternate" href="https://simonwillison.net/2026/Nov/22/llm/"/>
      <updated>2026-11-22T09:00:00Z</updated>
      <summary>Hands-on notes.</summary>
    </entry>
  </feed>`;

  const atomItems = parseFeedXml(atom, {
    id: 'rss-simon-willison',
    name: 'Simon Willison',
    kind: 'atom',
    industry: 'AI',
    tier: 'T2',
    tags: ['个人'],
    topics: ['开源生态'],
  });
  assert.equal(atomItems.length, 1);
  assert.equal(atomItems[0].url, 'https://simonwillison.net/2026/Nov/22/llm/');
  assert.equal(atomItems[0].publishedAt, '2026-11-22T09:00:00.000Z');
  assert.equal(atomItems[0].sourceKind, 'atom');
});

test('parseJsonFeed handles HN API adapter and configurable generic JSON paths/fields', () => {
  const hnStories = [
    {
      id: 42001,
      title: 'Rust 2.0 Async Runtime Benchmarks',
      url: 'https://example.org/rust-async',
      by: 'ferris',
      time: 1795257600, // 2026-11-22T10:40:00Z
      score: 312,
      descendants: 89,
    },
    {
      id: 42002,
      title: 'Ask HN: Best local LLM setup?',
      by: 'builder',
      time: 1795254000,
      score: 120,
      descendants: 45,
    },
  ];

  const hnItems = parseJsonFeed(hnStories, {
    id: 'json-hacker-news-top',
    name: 'Hacker News Top',
    kind: 'json',
    industry: '工程与开源',
    tier: 'T2',
    tags: ['社区', '工程'],
    topics: ['开源生态', '研发效能'],
    feedUrl: 'https://hacker-news.firebaseio.com/v0/topstories.json',
    jsonConfig: { adapter: 'hn-top' },
  });

  assert.equal(hnItems.length, 2);
  assert.equal(hnItems[0].title, 'Rust 2.0 Async Runtime Benchmarks');
  assert.equal(hnItems[0].url, 'https://example.org/rust-async');
  assert.equal(hnItems[0].author, 'ferris');
  assert.match(hnItems[0].snippet, /312 points/);
  assert.equal(hnItems[0].industry, '工程与开源');
  assert.equal(hnItems[0].sourceKind, 'json');
  assert.equal(hnItems[1].url, 'https://news.ycombinator.com/item?id=42002');

  const genericPayload = {
    data: {
      articles: [
        {
          headline: 'Cloudflare Workers Zero Cold Start',
          href: '/blog/workers-zero-cold-start',
          excerpt: 'New V8 isolate snapshots eliminate cold starts.',
          created: '2026-11-22T06:00:00Z',
          writer: { name: 'CF Team' },
        },
      ],
    },
  };

  const genericItems = parseJsonFeed(genericPayload, {
    id: 'json-generic',
    name: 'Generic JSON',
    kind: 'json',
    industry: '工程与开源',
    tier: 'T1',
    feedUrl: 'https://blog.cloudflare.com/api/posts.json',
    topics: ['云原生'],
    jsonConfig: {
      jsonPath: 'data.articles',
      fields: {
        title: 'headline',
        url: 'href',
        summary: 'excerpt',
        publishedAt: 'created',
        author: 'writer.name',
      },
    },
  });

  assert.equal(genericItems.length, 1);
  assert.equal(genericItems[0].url, 'https://blog.cloudflare.com/blog/workers-zero-cold-start');
  assert.equal(genericItems[0].author, 'CF Team');
  assert.equal(genericItems[0].publishedAt, '2026-11-22T06:00:00.000Z');
});

test('parseWebHtml scrapes article lists via cheerio CSS selectors and resolves relative URLs', () => {
  const html = `
    <html><body>
      <main>
        <article class="post-card">
          <h2><a href="/blog/2026/k8s-1-35/">Kubernetes 1.35 Released</a></h2>
          <time datetime="2026-11-21T12:00:00Z">Nov 21, 2026</time>
          <p class="excerpt">Improved scheduling throughput and sidecar lifecycle.</p>
          <span class="author">CNCF Editors</span>
        </article>
        <article class="post-card">
          <h2><a href="/blog/2026/k8s-1-35/">Duplicate Link Should Be Skipped</a></h2>
          <p class="excerpt">Duplicate entry.</p>
        </article>
        <article class="post-card">
          <h2><a href="https://www.cncf.io/blog/2026/ebpf-tracing/">eBPF Observability at Scale</a></h2>
          <time datetime="2026-11-22T09:30:00Z">Nov 22, 2026</time>
          <p class="excerpt">Zero-overhead kernel tracing in production.</p>
        </article>
      </main>
    </body></html>
  `;

  const items = parseWebHtml(html, {
    id: 'web-cncf-blog',
    name: 'CNCF Blog',
    kind: 'web',
    industry: '工程与开源',
    tier: 'T1',
    tags: ['官方', '云原生'],
    topics: ['云原生', '开源生态'],
    feedUrl: 'https://www.cncf.io/blog/',
    webConfig: {
      itemSelector: 'article.post-card',
      titleSelector: 'h2 a',
      linkSelector: 'h2 a',
      summarySelector: 'p.excerpt',
      dateSelector: 'time',
      authorSelector: '.author',
    },
  });

  assert.equal(items.length, 2);
  assert.equal(items[0].title, 'Kubernetes 1.35 Released');
  assert.equal(items[0].url, 'https://www.cncf.io/blog/2026/k8s-1-35/');
  assert.equal(items[0].publishedAt, '2026-11-21T12:00:00.000Z');
  assert.equal(items[0].author, 'CNCF Editors');
  assert.equal(items[0].sourceKind, 'web');
  assert.equal(items[1].url, 'https://www.cncf.io/blog/2026/ebpf-tracing/');
});

test('filterSources and parseCliArgs support industry and kind filtering', () => {
  const sources = [
    { id: '1', industry: 'AI', kind: 'rss' },
    { id: '2', industry: '工程与开源', kind: 'json' },
    { id: '3', industry: '工程与开源', kind: 'web' },
    { id: '4', industry: '金融与政策', kind: 'rss' },
  ];

  assert.deepEqual(
    filterSources(sources, { industries: ['AI', '金融与政策'] }).map((s) => s.id),
    ['1', '4']
  );
  assert.deepEqual(
    filterSources(sources, { kinds: ['json', 'web'] }).map((s) => s.id),
    ['2', '3']
  );
  assert.deepEqual(
    filterSources(sources, { industries: ['工程与开源'], kinds: ['web'] }).map((s) => s.id),
    ['3']
  );

  const cli = parseCliArgs([
    '--industry=AI,金融与政策',
    '--kind=rss,json,web',
    '--rebuild-hot',
    '--browse-floor=50',
  ]);
  assert.deepEqual(cli.industries, ['AI', '金融与政策']);
  assert.deepEqual(cli.kinds, ['rss', 'json', 'web']);
  assert.equal(cli.rebuildHot, true);
  assert.equal(cli.browseFloor, 50);
});

test('buildNewsItem tags selected=true above threshold, selected=false between browseFloor and threshold, and drops below browseFloor', () => {
  const t1Candidate = {
    sourceId: 'rss-openai-news',
    source: 'OpenAI News',
    industry: 'AI',
    topics: ['模型发布'],
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

  // Below browseFloor (45) -> dropped
  assert.equal(buildNewsItem(t1Candidate, { score: 44, title: 'Low', summary: 'Noise' }), null);
  assert.equal(buildNewsItem(t2Candidate, { score: 40, title: 'Low', summary: 'Noise' }), null);

  // Between browseFloor (45) and T1 threshold (60) -> kept with selected: false
  const browseT1 = buildNewsItem(t1Candidate, { score: 55, title: '常规更新', summary: '一般性动态。' });
  assert.ok(browseT1);
  assert.equal(browseT1.selected, false);
  assert.equal(browseT1.industry, 'AI');
  assert.ok(browseT1.topics.includes('模型发布'));

  // At/above T1 threshold (60) -> selected: true
  const keptT1 = buildNewsItem(t1Candidate, {
    score: 62,
    title: 'OpenAI 发布演示',
    summary: 'OpenAI 发布新能力。',
    context: '值得关注。',
    tags: ['OpenAI', 'Agent'],
    topics: ['Agent 智能体'],
  });
  assert.ok(keptT1);
  assert.equal(keptT1.selected, true);
  assert.deepEqual(keptT1.region, ['AI精选', '官方']);
  assert.equal(keptT1.score, 62);
  assert.ok(keptT1.topics.includes('Agent 智能体'));

  // Between browseFloor (45) and T2 threshold (76) -> selected: false
  const browseT2 = buildNewsItem(t2Candidate, { score: 70, title: '媒体快讯', summary: '快讯摘要。' });
  assert.ok(browseT2);
  assert.equal(browseT2.selected, false);

  // At/above T2 threshold (76) -> selected: true
  const keptT2 = buildNewsItem(t2Candidate, { score: 78, title: '媒体深度', summary: '答案前置摘要。' });
  assert.ok(keptT2);
  assert.equal(keptT2.selected, true);
});

test('normalizeExistingNewsItem preserves existing fields and populates industry, selected, and topics', () => {
  const legacyFin = normalizeExistingNewsItem({
    id: 'dom-20260320-003',
    title: '证监会发布关于加强上市公司分红监管的最新指引',
    summary: '证监会加强A股分红监管。',
    url: 'https://csrc.gov.cn/demo',
    source: 'csrc.gov.cn',
    publishedAt: '2026-03-20T08:00:00Z',
    region: 'domestic',
    tags: ['证监会', 'A股', '分红监管'],
  });

  assert.equal(legacyFin.industry, '金融与政策');
  assert.equal(legacyFin.selected, true);
  assert.equal(legacyFin.region, 'domestic');
  assert.ok(legacyFin.topics.includes('A股'));
  assert.ok(legacyFin.topics.includes('市场政策'));

  const aihotItem = normalizeExistingNewsItem({
    id: 'aihot-20261122-openai-1234',
    title: 'OpenAI 发布新推理模型',
    summary: '摘要。',
    url: 'https://openai.com/news/test',
    source: 'OpenAI News',
    publishedAt: '2026-11-22T08:00:00Z',
    region: ['AI精选', '官方'],
    tags: ['官方', 'OpenAI'],
  });

  assert.equal(aihotItem.industry, 'AI');
  assert.equal(aihotItem.selected, true);
  assert.ok(aihotItem.topics.includes('模型发布'));
});

test('buildHotEvents clusters related items by Jaccard similarity and applies source-count + 24h half-life decay scoring', () => {
  const nowMs = Date.parse('2026-11-22T16:00:00.000Z');
  const items = [
    // Two independent sources reporting the same Perplexity Monitor API launch (recent)
    {
      id: 'item-1',
      title: 'Perplexity launches Monitor API for continuous agent web search',
      summary: 'Perplexity released Monitor API with webhook alerts for agents.',
      url: 'https://the-decoder.com/perplexity-monitor-api',
      source: 'The Decoder',
      publishedAt: '2026-11-22T15:00:00.000Z',
      score: 82,
      industry: 'AI',
      topics: ['Agent 智能体'],
      tags: ['Perplexity', 'Monitor API'],
    },
    {
      id: 'item-2',
      title: 'Perplexity unveils Monitor API bringing continuous web search alerts to AI agents',
      summary: 'TechCrunch covers Perplexity Monitor API launch.',
      url: 'https://techcrunch.com/perplexity-monitor-api',
      source: 'TechCrunch · AI',
      publishedAt: '2026-11-22T15:30:00.000Z',
      score: 80,
      industry: 'AI',
      topics: ['Agent 智能体'],
      tags: ['Perplexity', 'Monitor API'],
    },
    // Single-source item at same recency
    {
      id: 'item-3',
      title: 'Cloudflare introduces zero-latency Rust Workers runtime',
      summary: 'Cloudflare engineering update.',
      url: 'https://blog.cloudflare.com/rust-workers',
      source: 'Cloudflare Blog',
      publishedAt: '2026-11-22T15:30:00.000Z',
      score: 82,
      industry: '工程与开源',
      topics: ['云原生', 'Rust & 系统'],
      tags: ['Cloudflare', 'Rust'],
    },
    // Same score as item-3, but 24 hours older -> should have ~half the heatScore
    {
      id: 'item-4',
      title: 'Fed signals cautious approach on US interest rate cuts amid inflation',
      summary: 'Macro policy update from Fed.',
      url: 'https://reuters.com/fed-rates',
      source: 'Reuters',
      publishedAt: '2026-11-21T15:30:00.000Z',
      score: 82,
      industry: '金融与政策',
      topics: ['宏观', '美股'],
      tags: ['Fed', 'Interest Rates'],
    },
    // Older than 72h window -> excluded
    {
      id: 'item-old',
      title: 'Old announcement from 5 days ago',
      summary: 'Expired.',
      url: 'https://example.com/old',
      source: 'Old Source',
      publishedAt: '2026-11-17T10:00:00.000Z',
      score: 95,
      industry: 'AI',
      topics: ['模型发布'],
      tags: ['Old'],
    },
  ];

  const hot = buildHotEvents(items, nowMs);
  assert.equal(hot.length, 3);

  // Rank 1 must be the 2-source clustered Perplexity event
  assert.equal(hot[0].rank, 1);
  assert.equal(hot[0].sourceCount, 2);
  assert.equal(hot[0].items.length, 2);
  assert.equal(hot[0].industry, 'AI');
  assert.ok(hot[0].heatScore > hot[1].heatScore);

  // Rank 2 (recent single-source) vs Rank 3 (24h older single-source with identical score)
  assert.equal(hot[1].rank, 2);
  assert.equal(hot[1].items[0].id, 'item-3');
  assert.equal(hot[2].rank, 3);
  assert.equal(hot[2].items[0].id, 'item-4');

  const ratio = hot[2].heatScore / hot[1].heatScore;
  assert.ok(ratio > 0.45 && ratio < 0.55, `Expected ~0.5 24h half-life decay ratio, got ${ratio}`);
});

test('generated source/_data/news.json and source/_data/news-hot.json match expected schema', () => {
  const news = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'source', '_data', 'news.json'), 'utf8')
  );
  const hot = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'source', '_data', 'news-hot.json'), 'utf8')
  );

  assert.ok(Array.isArray(news) && news.length > 0);
  news.forEach((item) => {
    assert.ok(VALID_INDUSTRIES.has(item.industry), `Missing/invalid industry on ${item.id}`);
    assert.equal(typeof item.selected, 'boolean', `Missing boolean selected on ${item.id}`);
    assert.ok(Array.isArray(item.topics) && item.topics.length > 0, `Missing topics on ${item.id}`);
  });

  assert.ok(Array.isArray(hot) && hot.length > 0);
  hot.forEach((ev, idx) => {
    assert.equal(ev.rank, idx + 1);
    assert.ok(ev.id && ev.title && ev.summary && ev.latestAt);
    assert.ok(VALID_INDUSTRIES.has(ev.industry));
    assert.ok(Array.isArray(ev.topics) && ev.topics.length > 0);
    assert.equal(typeof ev.heatScore, 'number');
    assert.ok(ev.sourceCount >= 1);
    assert.ok(Array.isArray(ev.items) && ev.items.length >= 1);
  });
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
