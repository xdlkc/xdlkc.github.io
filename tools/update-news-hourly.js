#!/usr/bin/env node

/*
Hourly news updater.
- Domestic: 财联社 telegraph (public HTML with __NEXT_DATA__)
- International: Reuters Agency RSS + Fed/ECB/BoE/IMF/WorldBank/Economist RSS where available

Writes: source/_data/news.json
Dedup: url OR (title + publishedAt)
*/

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const NEWS_JSON = path.join(ROOT, 'source', '_data', 'news.json');

function sha1(s) {
  return crypto.createHash('sha1').update(String(s)).digest('hex').slice(0, 6);
}

function toIsoWithOffset(date, offsetMinutes = 480) {
  const t = date instanceof Date ? date : new Date(date);
  const ms = t.getTime();
  if (!Number.isFinite(ms)) return null;
  const local = new Date(ms + offsetMinutes * 60 * 1000);
  const yyyy = local.getUTCFullYear();
  const mm = String(local.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(local.getUTCDate()).padStart(2, '0');
  const hh = String(local.getUTCHours()).padStart(2, '0');
  const mi = String(local.getUTCMinutes()).padStart(2, '0');
  const ss = String(local.getUTCSeconds()).padStart(2, '0');
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const oh = String(Math.floor(abs / 60)).padStart(2, '0');
  const om = String(abs % 60).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}${sign}${oh}:${om}`;
}

function stripHtml(s) {
  return String(s || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function clampText(s, minLen = 60, maxLen = 260) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  if (t.length <= maxLen) return t;
  return t.slice(0, maxLen - 1) + '…';
}

function readJsonArray(filepath) {
  if (!fs.existsSync(filepath)) return [];
  const raw = fs.readFileSync(filepath, 'utf8');
  const arr = JSON.parse(raw);
  return Array.isArray(arr) ? arr : [];
}

function buildDedupSets(existing) {
  const urls = new Set();
  const keys = new Set();
  for (const it of existing) {
    if (it && it.url) urls.add(String(it.url));
    if (it && it.title && it.publishedAt) keys.add(`${it.title}@@${it.publishedAt}`);
  }
  return { urls, keys };
}

async function fetchText(url, { timeoutMs = 15000, headers = {} } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OpenClawNewsBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        ...headers
      },
      signal: ctrl.signal,
      redirect: 'follow'
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

function parseRssOrAtom(xmlText) {
  const dom = new JSDOM(xmlText, { contentType: 'text/xml' });
  const doc = dom.window.document;

  const items = [];

  // RSS
  const rssItems = Array.from(doc.querySelectorAll('rss channel item'));
  for (const item of rssItems) {
    const title = stripHtml(item.querySelector('title')?.textContent || '');
    const link = stripHtml(item.querySelector('link')?.textContent || '');
    const pubDate = stripHtml(item.querySelector('pubDate')?.textContent || '');
    const description = stripHtml(item.querySelector('description')?.textContent || '');
    const guid = stripHtml(item.querySelector('guid')?.textContent || '');
    items.push({ title, link, pubDate, description, guid });
  }

  // Atom
  const atomEntries = Array.from(doc.querySelectorAll('feed entry'));
  for (const entry of atomEntries) {
    const title = stripHtml(entry.querySelector('title')?.textContent || '');
    const linkEl = entry.querySelector('link');
    const link = stripHtml(linkEl?.getAttribute('href') || linkEl?.textContent || '');
    const updated = stripHtml(entry.querySelector('updated')?.textContent || '');
    const published = stripHtml(entry.querySelector('published')?.textContent || '');
    const summary = stripHtml(entry.querySelector('summary')?.textContent || '');
    items.push({ title, link, pubDate: published || updated, description: summary, guid: '' });
  }

  return items.filter((x) => x.title && x.link);
}

function isWithinLastMs(dateStr, now, windowMs) {
  const t = new Date(dateStr).getTime();
  if (!Number.isFinite(t)) return false;
  const delta = now.getTime() - t;
  return delta >= 0 && delta <= windowMs;
}

function makeId(publishedAt, title, url) {
  const ts = publishedAt ? String(publishedAt).replace(/[^0-9]/g, '').slice(0, 14) : 'unknown';
  return `news-${ts}-${sha1(url || title)}`;
}

function ensureSummaryCn({ base, why, minLen = 60 }) {
  const s = clampText(base, 0, 260);
  const w = clampText(why, 0, 220);
  let out = s;
  if (w) out = `${out}（${w}）`;
  out = out.replace(/\s+/g, ' ').trim();
  if (out.length < minLen) {
    // Add a neutral filler to reach minimum length without inventing facts.
    out = `${out}。该条为公开来源的要点摘要，影响仍需结合后续正式披露与更多细节确认。`;
  }
  return clampText(out, minLen, 320);
}

function defaultImportance(region, topic) {
  if (region === 'domestic' && topic.includes('交易所')) {
    return '交易所与监管口径的边际变化会影响融资环境、并购重组与中长期资金入市预期，从而传导到风险偏好与估值中枢。';
  }
  if (region === 'international' && topic.includes('央行')) {
    return '主要央行/机构信息会改变市场对利率路径与流动性的定价，进而影响美元、收益率曲线与全球风险资产估值。';
  }
  return '该消息可能通过盈利预期、利率预期或风险溢价变化影响资产定价，需关注后续数据与政策落地。';
}

async function collectClsTelegraph({ now, windowMs }) {
  const url = 'https://www.cls.cn/telegraph';
  const html = await fetchText(url);
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>(\{[\s\S]*?\})<\/script>/);
  if (!m) throw new Error('CLS __NEXT_DATA__ not found');
  const data = JSON.parse(m[1]);
  const list =
    data?.props?.initialState?.telegraph?.telegraphList ||
    data?.props?.pageProps?.initialState?.telegraph?.telegraphList ||
    [];

  const items = [];
  for (const it of list) {
    const ctime = it?.ctime;
    const published = Number.isFinite(ctime) ? new Date(ctime * 1000) : null;
    const publishedAt = published ? toIsoWithOffset(published, 480) : null;
    if (!publishedAt) continue;
    if (!isWithinLastMs(publishedAt, now, windowMs)) continue;

    const rawTitle = String(it?.title || '').trim();
    const rawContent = String(it?.content || it?.brief || '').trim();
    const title = rawTitle || clampText(stripHtml(rawContent).replace(/^财联社\d+月\d+日电，?/, ''), 0, 60);

    const subjects = Array.isArray(it?.subjects) ? it.subjects.map((s) => s.subject_name).filter(Boolean) : [];
    const tags = subjects.slice(0, 4);

    // Use CLS shareurl (public)
    const shareUrl = it?.shareurl ? String(it.shareurl) : it?.id ? `https://www.cls.cn/detail/${it.id}` : '';

    // Domestic only
    items.push({
      title,
      summaryBase: stripHtml(rawContent),
      url: shareUrl,
      source: '财联社',
      publishedAt,
      region: 'domestic',
      tags
    });
  }
  return items;
}

async function collectRss({ now, windowMs }) {
  const feeds = [
    {
      source: 'Reuters',
      region: 'international',
      url: 'https://reutersagency.com/feed/?best-topics=business-finance&post_type=best'
    },
    {
      source: 'Reuters',
      region: 'international',
      url: 'https://reutersagency.com/feed/?best-topics=world-news&post_type=best'
    },
    {
      source: 'Fed',
      region: 'international',
      url: 'https://www.federalreserve.gov/feeds/press_all.xml'
    },
    {
      source: 'ECB',
      region: 'international',
      url: 'https://www.ecb.europa.eu/rss/press.html'
    },
    {
      source: 'BoE',
      region: 'international',
      url: 'https://www.bankofengland.co.uk/rss/news'
    },
    {
      source: 'IMF',
      region: 'international',
      url: 'https://www.imf.org/en/News/RSS'
    },
    {
      source: 'WorldBank',
      region: 'international',
      url: 'https://www.worldbank.org/en/news/all?format=rss'
    },
    {
      source: 'Economist',
      region: 'international',
      url: 'https://www.economist.com/the-world-this-week/rss.xml'
    }
  ];

  const out = [];
  const errors = [];

  for (const f of feeds) {
    try {
      const xml = await fetchText(f.url, { timeoutMs: 15000, headers: { Accept: 'application/rss+xml,application/xml,text/xml,*/*' } });
      const parsed = parseRssOrAtom(xml);
      for (const it of parsed) {
        const pub = it.pubDate;
        const d = new Date(pub);
        const iso = Number.isFinite(d.getTime()) ? toIsoWithOffset(d, 480) : null;
        if (!iso) continue;
        if (!isWithinLastMs(iso, now, windowMs)) continue;

        out.push({
          title: clampText(it.title, 0, 120),
          summaryBase: clampText(it.description || '', 0, 260),
          url: it.link,
          source: f.source,
          publishedAt: iso,
          region: f.region,
          tags: []
        });
      }
    } catch (e) {
      errors.push({ feed: f.url, error: String(e?.message || e) });
    }
  }

  return { items: out, errors };
}

function pickTop(items, { region, limit }) {
  const filtered = items
    .filter((x) => x.region === region)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  return filtered.slice(0, limit);
}

function enrichNewsItem(raw) {
  const topic = raw.title;
  const region = raw.region;

  const importance = raw.importance || defaultImportance(region, topic);
  const why = region === 'domestic'
    ? '对A股/港股相关板块的情绪与资金风格可能有边际影响，尤其是与监管、并购重组、科技产业链相关的信息。'
    : '对全球风险偏好、利率与汇率定价可能带来边际扰动，重点观察是否引发政策预期或数据修正。';

  const summary = ensureSummaryCn({ base: raw.summaryBase, why, minLen: 60 });

  const context = raw.context || (region === 'domestic'
    ? '短期市场通常会先交易“政策/监管口径变化”与“资金面预期”，随后再由业绩与数据验证。'
    : '海外宏观与政策新闻对国内市场的传导主要通过美元利率、商品与风险偏好三条链路体现。');

  return {
    id: raw.id || makeId(raw.publishedAt, raw.title, raw.url),
    title: raw.title,
    summary,
    url: raw.url,
    source: raw.source,
    publishedAt: raw.publishedAt,
    importance,
    region: raw.region,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    context
  };
}

async function main() {
  const now = new Date();
  const windowMs = 60 * 60 * 1000;

  const existing = readJsonArray(NEWS_JSON);
  const { urls, keys } = buildDedupSets(existing);

  const sourceOverview = {
    domestic: ['财联社 telegraph (www.cls.cn/telegraph)'],
    international: []
  };

  const domesticRaw = await collectClsTelegraph({ now, windowMs });

  const { items: intlRaw, errors: intlErrors } = await collectRss({ now, windowMs });
  sourceOverview.international = [
    'Reuters Agency RSS (reutersagency.com)',
    'Fed press releases RSS (federalreserve.gov)',
    'ECB press RSS (ecb.europa.eu)',
    'BoE news RSS (bankofengland.co.uk)',
    'IMF RSS (imf.org)',
    'World Bank RSS (worldbank.org)',
    'Economist RSS (economist.com)'
  ];

  const candidates = [...domesticRaw, ...intlRaw];

  const added = [];
  for (const c of candidates) {
    if (!c.url || !c.title || !c.publishedAt) continue;
    const key = `${c.title}@@${c.publishedAt}`;
    if (urls.has(c.url) || keys.has(key)) continue;
    urls.add(c.url);
    keys.add(key);
    added.push(enrichNewsItem(c));
  }

  if (added.length) {
    const merged = [...added, ...existing];
    merged.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    fs.writeFileSync(NEWS_JSON, JSON.stringify(merged, null, 2) + '\n', 'utf8');
  }

  const domesticPicked = pickTop(added, { region: 'domestic', limit: 5 });
  const intlPicked = pickTop(added, { region: 'international', limit: 5 });

  const res = {
    now: toIsoWithOffset(now, 480),
    addedCount: added.length,
    addedDomestic: domesticPicked,
    addedInternational: intlPicked,
    newsJsonPath: NEWS_JSON,
    intlFeedErrors: intlErrors
  };

  process.stdout.write(JSON.stringify(res, null, 2));
}

main().catch((e) => {
  console.error('[update-news-hourly] failed:', e);
  process.exit(1);
});
