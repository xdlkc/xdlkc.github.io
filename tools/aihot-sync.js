#!/usr/bin/env node
/**
 * AIHOT-inspired stateless multi-industry news curator & hot-event clusterer
 * for Hexo (`source/_data/news.json` & `source/_data/news-hot.json`).
 *
 * Fetches curated multi-kind sources (RSS / Atom / JSON API / Web HTML) from
 * `source/_data/aihot-sources.json`, deduplicates against existing items,
 * scores & writes answer-first Chinese summaries via an OpenAI-compatible LLM
 * API (tagging `selected`, `industry`, and `topics`), merges into
 * `source/_data/news.json`, and builds clustered hot events into
 * `source/_data/news-hot.json`.
 *
 * Usage:
 *   node tools/aihot-sync.js [--dry-run] [--no-llm] [--allow-raw] [--rebuild-hot]
 *     [--industry=AI,金融与政策] [--kind=rss,atom,json,web]
 *     [--hours=72] [--per-source=6] [--max-candidates=30] [--max-new=15] [--max-total=150]
 *
 * Environment variables:
 *   AIHOT_LLM_API_KEY   API key for OpenAI-compatible chat completions (fallbacks: GLM_API_KEY, ZHIPU_API_KEY, OPENAI_API_KEY)
 *   AIHOT_LLM_BASE_URL  Base URL (default: https://open.bigmodel.cn/api/coding/paas/v4)
 *   AIHOT_LLM_MODEL     Model name (default: glm-5.3-flash)
 *   AIHOT_INDUSTRIES    Comma-separated industry filter (e.g. AI,工程与开源,金融与政策)
 *   AIHOT_SOURCE_KINDS  Comma-separated source kind filter (e.g. rss,atom,json,web)
 *   AIHOT_BROWSE_FLOOR  Minimum score kept as unselected (selected=false) item (default: 45)
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT_DIR = path.resolve(__dirname, '..');
const DEFAULT_SOURCES_PATH = path.join(ROOT_DIR, 'source', '_data', 'aihot-sources.json');
const DEFAULT_NEWS_PATH = path.join(ROOT_DIR, 'source', '_data', 'news.json');
const DEFAULT_HOT_PATH = path.join(ROOT_DIR, 'source', '_data', 'news-hot.json');

const DEFAULT_BROWSE_FLOOR = 45;
const DEFAULT_THRESHOLDS = {
  T1: 60,
  T1_5: 65,
  T2: 76,
  browseFloor: DEFAULT_BROWSE_FLOOR,
};

let aihotExtractorPromise = null;
async function getAihotExtractor() {
  if (!aihotExtractorPromise) {
    aihotExtractorPromise = import('../vendor/aihot/extractor.ts');
  }
  return aihotExtractorPromise;
}

function buildCurationSystemPrompt(extractor, industry = 'AI') {
  const titleRules = extractor?.loadAihotPrompt?.('rules-self-contained-title.md') || '';
  const summaryRules = extractor?.loadAihotPrompt?.('rules-answer-first-summary.md') || '';
  const antiHallucination = extractor?.loadAihotPrompt?.('rules-anti-hallucination.md') || '';

  const roleDesc =
    industry === '金融与政策'
      ? '你是金融市场与政策资讯精选编辑（覆盖 A股、港股、美股、市场政策、政府动态与宏观经济），严格遵循以下 AIHOT 精选与写作规范，对单条候选资讯评分并改写为高质量中文快讯。'
      : industry === '工程与开源'
        ? '你是软件工程与开源生态资讯精选编辑（覆盖 Rust & 系统、云原生、开源生态、研发效能），严格遵循以下 AIHOT 精选与写作规范，对单条候选资讯评分并改写为高质量中文快讯。'
        : '你是 AI 行业资讯精选编辑，严格遵循以下 AIHOT 精选与写作规范，对单条候选资讯评分并改写为高质量中文快讯。';

  return [
    roleDesc,
    '',
    '【评分标准（0-100 整数）】',
    '- 90-100：头部机构重磅模型/产品发布、重大开源突破、重要监管/央行政策或改变行业格局的大事。',
    '- 75-89：有明确新进展的产品上线、重要研究论文、高质量工程深度实践或关键市场与政策动态。',
    '- 60-74：官方常规更新、细分工具发布、有价值的工程案例、财报或行业评测。',
    '- 45-59：一般性动态或外围快讯（保留在全部动态中，不进入精选）。',
    '- <45：纯营销软文、无实质内容的预告、旧闻转述、泛泛而谈的观点水文。',
    titleRules ? `\n${titleRules}` : '',
    summaryRules ? `\n${summaryRules}` : '',
    antiHallucination ? `\n${antiHallucination}` : '',
    '',
    '【输出格式】',
    '严格输出单个 JSON 对象，不要包含 Markdown 代码块或其他多余文字：',
    '{',
    '  "score": 0-100 整数,',
    '  "title": "自洽的中文标题",',
    '  "summary": "2-3 句答案前置的中文摘要",',
    '  "context": "1 句简短背景或为什么值得关注（25-60字）",',
    '  "tags": ["2到4个简短中文或英文标签"],',
    '  "topics": ["1到3个主题分类标签"]',
    '}',
  ]
    .filter(Boolean)
    .join('\n');
}

function isMostlyEnglish(text) {
  const s = String(text || '');
  const cjk = (s.match(/[\u4e00-\u9fff]/g) || []).length;
  const latin = (s.match(/[a-zA-Z]/g) || []).length;
  return latin > 120 && cjk < latin * 0.15;
}

async function translateHtmlWithLlm(html, { apiKey, baseUrl, model, extractor, timeoutMs = 60000 }) {
  const endpoint = `${String(baseUrl || 'https://open.bigmodel.cn/api/coding/paas/v4').replace(/\/+$/, '')}/chat/completions`;
  const rules = extractor?.loadAihotPrompt?.('translate-body-rules.md') || '';
  const systemPrompt = [
    '你是专业技术翻译编辑。将输入文章 HTML 正文准确、自然地翻译为简体中文，完整保留所有 HTML 标签、链接 href 与图片 img 标签，不要增删段落，不要输出 Markdown 代码围栏，只返回翻译后的 HTML。',
    rules ? `\n${rules}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 4096,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: String(html || '').slice(0, 14000) },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Translate HTTP ${res.status}`);
    const data = await res.json();
    const raw = String(data?.choices?.[0]?.message?.content || '').trim();
    const unfenced = raw.replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/i, '').trim();
    return unfenced;
  } finally {
    clearTimeout(timer);
  }
}

function decodeXmlEntities(str) {
  if (!str) return '';
  return String(str)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function stripHtml(str) {
  return decodeXmlEntities(str)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?。，；：！？])/g, '$1')
    .trim();
}

function extractTag(block, tagNames) {
  for (const tag of tagNames) {
    const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const match = block.match(re);
    if (match && match[1] != null) {
      return match[1].trim();
    }
  }
  return '';
}

function extractAtomLink(block) {
  const linkTags = block.match(/<link\b[^>]*>/gi) || [];
  let fallback = '';
  for (const tag of linkTags) {
    const hrefMatch = tag.match(/\bhref=["']([^"']+)["']/i);
    if (!hrefMatch) continue;
    const href = decodeXmlEntities(hrefMatch[1]).trim();
    const relMatch = tag.match(/\brel=["']([^"']+)["']/i);
    const rel = relMatch ? relMatch[1].toLowerCase() : 'alternate';
    if (rel === 'alternate') return href;
    if (!fallback) fallback = href;
  }
  return fallback;
}

function parseDateIso(raw) {
  if (raw == null || raw === '') return '';
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const ms = raw < 1e12 ? raw * 1000 : raw;
    const d = new Date(ms);
    return Number.isFinite(d.getTime()) ? d.toISOString() : '';
  }
  const cleaned = stripHtml(raw);
  if (!cleaned) return '';
  if (/^\d{10,13}$/.test(cleaned)) {
    const num = Number(cleaned);
    const ms = num < 1e12 ? num * 1000 : num;
    const d = new Date(ms);
    return Number.isFinite(d.getTime()) ? d.toISOString() : '';
  }
  const d = new Date(cleaned);
  return Number.isFinite(d.getTime()) ? d.toISOString() : '';
}

function sanitizeArticleHtml(html, maxLen = 24000) {
  if (!html) return '';
  const cleaned = decodeXmlEntities(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<(?:iframe|object|embed|form|input|button|textarea|select|svg)[\s\S]*?<\/(?:iframe|object|embed|form|input|button|textarea|select|svg)>/gi, '')
    .replace(/<(?:iframe|object|embed|input|meta|link|base)\b[^>]*\/?>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+style\s*=\s*(?:"[^"]*"|'[^']*')/gi, '')
    .replace(/(href|src)\s*=\s*["']\s*javascript:[^"']*["']/gi, '$1="#"')
    .trim();

  if (!cleaned) return '';
  if (!/<(?:p|div|h[1-6]|ul|ol|blockquote|pre|figure|img)\b/i.test(cleaned)) {
    const paras = cleaned
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p>${p}</p>`)
      .join('\n');
    return paras.slice(0, maxLen);
  }
  return cleaned.length > maxLen ? `${cleaned.slice(0, maxLen)}…` : cleaned;
}

function extractAuthor(block) {
  const authorBlock = extractTag(block, ['dc:creator', 'author', 'creator']);
  if (!authorBlock) return '';
  const nestedName = extractTag(authorBlock, ['name']);
  return stripHtml(nestedName || authorBlock).slice(0, 80);
}

function resolveMaybeRelativeUrl(href, baseUrl) {
  const raw = String(href || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (!baseUrl) return '';
  try {
    const resolved = new URL(raw, baseUrl).href;
    return /^https?:\/\//i.test(resolved) ? resolved : '';
  } catch {
    return '';
  }
}

function parseFeedXml(xml, sourceMeta = {}) {
  const text = String(xml || '');
  if (!text.trim()) return [];

  const isAtom = /<feed[\s>]/i.test(text) && !/<rss[\s>]/i.test(text);
  const blocks = isAtom
    ? (text.match(/<entry\b[\s\S]*?<\/entry>/gi) || [])
    : (text.match(/<item\b[\s\S]*?<\/item>/gi) || []);

  const items = [];
  for (const block of blocks) {
    const title = stripHtml(extractTag(block, ['title']));
    let url = isAtom
      ? extractAtomLink(block)
      : stripHtml(extractTag(block, ['link', 'guid']));
    if (!url && !isAtom) {
      url = extractAtomLink(block);
    }
    const publishedAt = parseDateIso(
      extractTag(block, ['pubDate', 'published', 'updated', 'dc:date'])
    );
    const author = extractAuthor(block);
    const rawFull = extractTag(block, ['content:encoded', 'content', 'description', 'summary']);
    const rawSummary = extractTag(block, ['description', 'summary', 'content:encoded', 'content']);
    const snippet = stripHtml(rawSummary || rawFull).slice(0, 900);
    const contentHtml = sanitizeArticleHtml(rawFull);

    if (!title || !url || !/^https?:\/\//i.test(url)) continue;

    items.push({
      title,
      url,
      author,
      snippet,
      contentHtml,
      publishedAt: publishedAt || new Date().toISOString(),
      source: sourceMeta.name || 'Unknown',
      sourceId: sourceMeta.id || 'unknown',
      sourceKind: sourceMeta.kind || (isAtom ? 'atom' : 'rss'),
      industry: sourceMeta.industry || 'AI',
      topics: Array.isArray(sourceMeta.topics) ? [...sourceMeta.topics] : [],
      tier: sourceMeta.tier || 'T2',
      sourceTags: Array.isArray(sourceMeta.tags) ? [...sourceMeta.tags] : [],
    });
  }

  return items;
}

function getByPath(obj, dotPath) {
  if (!dotPath) return obj;
  return String(dotPath)
    .split('.')
    .filter(Boolean)
    .reduce((acc, key) => (acc != null && typeof acc === 'object' ? acc[key] : undefined), obj);
}

function parseJsonFeed(payload, sourceMeta = {}) {
  const cfg = sourceMeta.jsonConfig || {};
  const jsonPath = cfg.jsonPath || sourceMeta.jsonPath || '';
  const fields = cfg.fields || sourceMeta.fields || {};

  let rows = jsonPath ? getByPath(payload, jsonPath) : payload;
  if (!Array.isArray(rows) && rows && typeof rows === 'object') {
    rows = rows.items || rows.articles || rows.entries || rows.data || rows.hits || [];
  }
  if (!Array.isArray(rows)) return [];

  const items = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const titleRaw = fields.title ? getByPath(row, fields.title) : (row.title || row.name || row.headline);
    const title = stripHtml(titleRaw);

    let urlRaw = fields.url ? getByPath(row, fields.url) : (row.url || row.link || row.href);
    if (!urlRaw && cfg.adapter === 'hn-top' && row.id != null) {
      urlRaw = `https://news.ycombinator.com/item?id=${row.id}`;
    }
    const url = resolveMaybeRelativeUrl(urlRaw, sourceMeta.feedUrl);
    if (!title || !url) continue;

    const publishedRaw = fields.publishedAt
      ? getByPath(row, fields.publishedAt)
      : (row.publishedAt || row.published_at || row.created_at || row.date || row.time);
    const publishedAt = parseDateIso(publishedRaw) || new Date().toISOString();

    const authorRaw = fields.author ? getByPath(row, fields.author) : (row.author || row.by || row.creator);
    const author = stripHtml(typeof authorRaw === 'object' && authorRaw ? authorRaw.name : authorRaw).slice(0, 80);

    let summaryRaw = fields.summary
      ? getByPath(row, fields.summary)
      : (row.summary || row.description || row.excerpt || row.text);
    if (!summaryRaw && cfg.adapter === 'hn-top') {
      const pts = Number.isFinite(Number(row.score)) ? `${row.score} points` : '';
      const cmts = Number.isFinite(Number(row.descendants)) ? `${row.descendants} comments` : '';
      summaryRaw = [pts, cmts].filter(Boolean).join(' · ') || title;
    }
    const snippet = stripHtml(summaryRaw || title).slice(0, 900);
    const contentRaw = fields.contentHtml ? getByPath(row, fields.contentHtml) : row.contentHtml;
    const contentHtml = contentRaw ? sanitizeArticleHtml(contentRaw) : '';

    items.push({
      title,
      url,
      author,
      snippet,
      contentHtml,
      publishedAt,
      source: sourceMeta.name || 'Unknown',
      sourceId: sourceMeta.id || 'unknown',
      sourceKind: sourceMeta.kind || 'json',
      industry: sourceMeta.industry || 'AI',
      topics: Array.isArray(sourceMeta.topics) ? [...sourceMeta.topics] : [],
      tier: sourceMeta.tier || 'T2',
      sourceTags: Array.isArray(sourceMeta.tags) ? [...sourceMeta.tags] : [],
    });
  }

  return items;
}

function parseWebHtml(html, sourceMeta = {}) {
  const rawHtml = String(html || '');
  if (!rawHtml.trim()) return [];

  const cheerio = require('cheerio');
  const $ = cheerio.load(rawHtml);
  const cfg = sourceMeta.webConfig || {};
  const itemSelector = cfg.itemSelector || 'article, .post-item, .news-item, li';
  const titleSelector = cfg.titleSelector || 'h1, h2, h3, .title, a[href]';
  const linkSelector = cfg.linkSelector || 'h1 a[href], h2 a[href], h3 a[href], a[href]';
  const summarySelector = cfg.summarySelector || 'p, .summary, .excerpt';
  const dateSelector = cfg.dateSelector || 'time, .date, .published';
  const authorSelector = cfg.authorSelector || '.author, [rel="author"]';

  const seenUrls = new Set();
  const items = [];

  $(itemSelector).each((_, el) => {
    const $el = $(el);
    const $titleEl = $el.find(titleSelector).first();
    const $linkEl = $el.find(linkSelector).first();
    const href = $linkEl.attr('href') || ($titleEl.is('a') ? $titleEl.attr('href') : '') || $el.find('a[href]').first().attr('href');
    const url = resolveMaybeRelativeUrl(href, sourceMeta.feedUrl);
    const title = stripHtml($titleEl.text() || $linkEl.text());

    if (!title || !url) return;
    const uKey = normalizeUrl(url);
    if (seenUrls.has(uKey)) return;
    seenUrls.add(uKey);

    const $dateEl = $el.find(dateSelector).first();
    const dateRaw = $dateEl.attr('datetime') || $dateEl.attr('data-published') || $dateEl.text();
    const publishedAt = parseDateIso(dateRaw) || new Date().toISOString();

    const summaryText = stripHtml($el.find(summarySelector).first().text());
    const snippet = (summaryText || title).slice(0, 900);
    const author = stripHtml($el.find(authorSelector).first().text()).slice(0, 80);

    items.push({
      title,
      url,
      author,
      snippet,
      contentHtml: '',
      publishedAt,
      source: sourceMeta.name || 'Unknown',
      sourceId: sourceMeta.id || 'unknown',
      sourceKind: sourceMeta.kind || 'web',
      industry: sourceMeta.industry || 'AI',
      topics: Array.isArray(sourceMeta.topics) ? [...sourceMeta.topics] : [],
      tier: sourceMeta.tier || 'T2',
      sourceTags: Array.isArray(sourceMeta.tags) ? [...sourceMeta.tags] : [],
    });
  });

  return items;
}

function normalizeUrl(url) {
  try {
    const u = new URL(String(url || '').trim());
    u.hash = '';
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'oc']) {
      u.searchParams.delete(key);
    }
    const pathname = u.pathname.replace(/\/+$/, '') || '/';
    return `${u.protocol}//${u.host.toLowerCase()}${pathname}${u.search}`;
  } catch {
    return String(url || '').trim().toLowerCase();
  }
}

function normalizeTitleFingerprint(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, '')
    .trim();
}

function makeItemId(sourceId, url, publishedAt) {
  const datePart = String(publishedAt || '').slice(0, 10).replace(/-/g, '') || '00000000';
  const hash = crypto.createHash('sha1').update(`${sourceId}:${normalizeUrl(url)}`).digest('hex').slice(0, 8);
  const slug = String(sourceId || 'aihot')
    .replace(/^(?:rss|atom|json|web)-/, '')
    .replace(/[^a-z0-9-]+/gi, '-')
    .toLowerCase();
  return `aihot-${datePart}-${slug}-${hash}`;
}

function getThresholdForTier(tier, thresholds = DEFAULT_THRESHOLDS) {
  const map = { ...DEFAULT_THRESHOLDS, ...(thresholds || {}) };
  return typeof map[tier] === 'number' ? map[tier] : map.T2;
}

function parseJsonFromLlm(content) {
  const raw = String(content || '').trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : raw;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('LLM response did not contain a JSON object');
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

function inferTopicsForItem(item) {
  const industry = item.industry || (String(item.id || '').startsWith('aihot-') ? 'AI' : '金融与政策');
  const haystack = [
    item.title,
    item.originalTitle,
    item.summary,
    item.source,
    ...(Array.isArray(item.tags) ? item.tags : []),
    ...(Array.isArray(item.region) ? item.region : [item.region]),
  ]
    .filter(Boolean)
    .join(' ');

  const topics = [];
  const add = (topic) => {
    if (topic && !topics.includes(topic)) topics.push(topic);
  };

  if (industry === 'AI') {
    if (/(agent|智能体|多智能体|quick|toolkit|monitor api|workflow|连接器|工作台|copilot)/i.test(haystack)) {
      add('Agent 智能体');
    }
    if (/(gpt|claude|gemini|mistral|inkling|mini|模型|大模型|llm|release|发布)/i.test(haystack)) {
      add('模型发布');
    }
    if (/(kv|推理|sagemaker|hyperpod|slurm|bedrock|gpu|算力|nvidia|omniverse|网关|基础设施|infra)/i.test(haystack)) {
      add('基础设施');
    }
    if (/(开源|hugging face|github|open source|adapter|harness)/i.test(haystack)) {
      add('开源生态');
    }
    if (/(研究|论文|bench|量子|安全|蒸馏|research|duplex|arxiv)/i.test(haystack)) {
      add('研究');
    }
    if (topics.length === 0) add('模型发布');
  } else if (industry === '工程与开源') {
    if (/(rust|kernel|wasm|内存安全|系统编程|c\+\+|zig)/i.test(haystack)) add('Rust & 系统');
    if (/(cloud|kubernetes|k8s|cncf|cloudflare|边缘计算|容器|云原生|serverless)/i.test(haystack)) add('云原生');
    if (/(open source|github|开源|社区|hacker news)/i.test(haystack)) add('开源生态');
    if (/(ci\/cd|devops|engineering|性能|架构|测试|研发效能|compiler)/i.test(haystack)) add('研发效能');
    if (topics.length === 0) add('开源生态');
  } else {
    // 金融与政策
    if (/(a股|a50|沪深|上证|深证|创业板|科创板|中信银行|中概|中国资产|股市|上市)/i.test(haystack)) {
      add('A股');
    }
    if (/(港股|恒生|恒指|香港|hkex)/i.test(haystack)) {
      add('港股');
    }
    if (/(美股|标普|纳斯达克|道指|华尔街|s&p|nasdaq|科技股|半导体|wsj|yahoo finance|cnbc)/i.test(haystack)) {
      add('美股');
    }
    if (/(证监会|分红|监管|融资|指导意见|政策|法案|关税|合规|审批|宏观审慎|市场政策)/i.test(haystack)) {
      add('市场政策');
    }
    if (/(发改委|财政部|央行|国务院|政府|部委|浙江|西安|诉讼|特朗普|总统|欧盟|pbc\.gov|csrc\.gov|ndrc\.gov)/i.test(haystack)) {
      add('政府动态');
    }
    if (/(利率|通胀|美联储|fed|ecb|boe|imf|mlf|m2|社融|国债|收益率|油价|预算|贸易|gdp|cpi|宏观|经济|rate|inflation|yield|bank of england)/i.test(haystack)) {
      add('宏观');
    }
    if (topics.length === 0) add('宏观');
  }

  return topics.slice(0, 3);
}

function normalizeExistingNewsItem(item) {
  if (!item || typeof item !== 'object') return item;
  const regionList = Array.isArray(item.region) ? item.region : item.region ? [item.region] : [];
  const isAihot =
    String(item.id || '').startsWith('aihot-') ||
    regionList.some((r) => String(r).includes('AI精选'));

  const industry = item.industry || (isAihot ? 'AI' : '金融与政策');
  const selected = typeof item.selected === 'boolean' ? item.selected : true;
  const existingTopics = Array.isArray(item.topics)
    ? item.topics.map((t) => String(t || '').trim()).filter(Boolean)
    : [];
  const topics = existingTopics.length > 0 ? existingTopics : inferTopicsForItem({ ...item, industry });

  return {
    ...item,
    industry,
    selected,
    topics,
  };
}

function normalizeNewsList(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => normalizeExistingNewsItem(item));
}

function buildNewsItem(candidate, curated, thresholds = DEFAULT_THRESHOLDS, opts = {}) {
  const score = Number(curated.score);
  const threshold = getThresholdForTier(candidate.tier, thresholds);
  const browseFloor =
    typeof opts.browseFloor === 'number'
      ? opts.browseFloor
      : typeof thresholds?.browseFloor === 'number'
        ? thresholds.browseFloor
        : DEFAULT_BROWSE_FLOOR;

  if (!Number.isFinite(score) || score < browseFloor) {
    return null;
  }

  const selected = typeof curated.selected === 'boolean' ? curated.selected : score >= threshold;

  const title = String(curated.title || candidate.title || '').trim();
  const summary = String(curated.summary || candidate.snippet || '').trim();
  const context = String(curated.context || '').trim();
  if (!title || !summary) return null;

  const industry = candidate.industry || 'AI';
  const sourceTags = Array.isArray(candidate.sourceTags) ? candidate.sourceTags : [];
  const primarySourceTag = sourceTags[0] || '';
  const primaryRegion = industry === 'AI' ? 'AI精选' : industry;
  const region = primarySourceTag ? [primaryRegion, primarySourceTag] : [primaryRegion];

  const tagSet = new Set();
  const mergedTags = [];
  for (const t of [...sourceTags, ...(Array.isArray(curated.tags) ? curated.tags : [])]) {
    const clean = String(t || '').trim();
    if (clean && !tagSet.has(clean)) {
      tagSet.add(clean);
      mergedTags.push(clean);
    }
  }

  const topicSet = new Set();
  const mergedTopics = [];
  const candidateTopics = Array.isArray(candidate.topics) ? candidate.topics : [];
  const curatedTopics = Array.isArray(curated.topics) ? curated.topics : [];
  for (const t of [...curatedTopics, ...candidateTopics]) {
    const clean = String(t || '').trim();
    if (clean && !topicSet.has(clean)) {
      topicSet.add(clean);
      mergedTopics.push(clean);
    }
  }
  const finalTopics =
    mergedTopics.length > 0
      ? mergedTopics.slice(0, 4)
      : inferTopicsForItem({ title, summary, tags: mergedTags, source: candidate.source, industry });

  return {
    id: makeItemId(candidate.sourceId, candidate.url, candidate.publishedAt),
    title,
    ...(candidate.title && candidate.title !== title ? { originalTitle: candidate.title } : {}),
    ...(candidate.author ? { author: candidate.author } : {}),
    summary,
    url: candidate.url,
    source: candidate.source,
    publishedAt: candidate.publishedAt,
    score: Math.round(score),
    tier: candidate.tier,
    selected,
    industry,
    topics: finalTopics,
    region,
    tags: mergedTags.slice(0, 6),
    ...(context ? { context } : {}),
    ...(candidate.contentHtml ? { contentHtml: candidate.contentHtml } : {}),
  };
}

function mergeNewsLists(existingItems, newItems, maxTotal = 150) {
  const seenUrls = new Set();
  const seenTitles = new Set();
  const combined = [];

  for (const item of [...newItems, ...existingItems]) {
    if (!item || !item.url || !item.title) continue;
    const uKey = normalizeUrl(item.url);
    const tKey = normalizeTitleFingerprint(item.title);
    if (seenUrls.has(uKey) || (tKey && seenTitles.has(tKey))) continue;
    seenUrls.add(uKey);
    if (tKey) seenTitles.add(tKey);
    combined.push(item);
  }

  combined.sort((a, b) => {
    const ta = new Date(a.publishedAt || 0).getTime() || 0;
    const tb = new Date(b.publishedAt || 0).getTime() || 0;
    return tb - ta;
  });

  return combined.slice(0, maxTotal);
}

function filterSources(sources, { industries = [], kinds = [] } = {}) {
  const industrySet = new Set(
    (Array.isArray(industries) ? industries : [])
      .map((s) => String(s || '').trim().toLowerCase())
      .filter(Boolean)
  );
  const kindSet = new Set(
    (Array.isArray(kinds) ? kinds : [])
      .map((s) => String(s || '').trim().toLowerCase())
      .filter(Boolean)
  );

  return (Array.isArray(sources) ? sources : []).filter((src) => {
    if (!src) return false;
    const srcIndustry = String(src.industry || 'AI').trim().toLowerCase();
    const srcKind = String(src.kind || 'rss').trim().toLowerCase();
    if (industrySet.size > 0 && !industrySet.has(srcIndustry)) return false;
    if (kindSet.size > 0 && !kindSet.has(srcKind)) return false;
    return true;
  });
}

async function fetchTextWithTimeout(url, accept, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'xdlkc-blog-aihot-sync/2.0 (+https://xdlkc.github.io)',
        Accept: accept,
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJsonSource(source, timeoutMs = 12000) {
  const raw = await fetchTextWithTimeout(
    source.feedUrl,
    'application/json, text/plain;q=0.9, */*;q=0.8',
    timeoutMs
  );
  const data = JSON.parse(raw);
  const cfg = source.jsonConfig || {};

  if (
    Array.isArray(data) &&
    data.length > 0 &&
    typeof data[0] === 'number' &&
    (cfg.adapter === 'hn-top' || cfg.itemUrlTemplate)
  ) {
    const template = cfg.itemUrlTemplate || 'https://hacker-news.firebaseio.com/v0/item/{id}.json';
    const limit = Math.max(1, Math.min(Number(cfg.limit) || 12, 30));
    const ids = data.slice(0, limit);
    const settled = await Promise.allSettled(
      ids.map(async (id) => {
        const itemRaw = await fetchTextWithTimeout(
          template.replace('{id}', String(id)),
          'application/json, */*;q=0.8',
          timeoutMs
        );
        return JSON.parse(itemRaw);
      })
    );
    const stories = settled
      .filter((r) => r.status === 'fulfilled' && r.value && typeof r.value === 'object')
      .map((r) => r.value);
    return parseJsonFeed(stories, source);
  }

  return parseJsonFeed(data, source);
}

async function fetchSource(source, timeoutMs = 12000) {
  const kind = String(source.kind || 'rss').toLowerCase();
  if (kind === 'json') {
    return fetchJsonSource(source, timeoutMs);
  }
  if (kind === 'web') {
    const html = await fetchTextWithTimeout(
      source.feedUrl,
      'text/html, application/xhtml+xml;q=0.9, */*;q=0.8',
      timeoutMs
    );
    return parseWebHtml(html, source);
  }
  const xml = await fetchTextWithTimeout(
    source.feedUrl,
    'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
    timeoutMs
  );
  return parseFeedXml(xml, source);
}

const fetchFeed = fetchSource;

// --- Hot Events Clustering (AIHOT-style) ---

const EN_STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'into', 'your', 'how',
  'new', 'now', 'are', 'was', 'has', 'its', 'can', 'will', 'about', 'more',
  'than', 'over', 'after', 'amid', 'says', 'show', 'shows', 'what', 'why',
  'out', 'off', 'all', 'you', 'our', 'their', 'they', 'not', 'but', 'have',
  'been', 'being', 'news', 'blog', 'post', 'update', 'updates', 'launch',
  'launches', 'announces', 'introducing', 'using', 'via', 'per', 'report',
]);

const GENERIC_TAGS = new Set([
  '官方', '媒体', '个人', '工程', '研究', '周刊', '开源', '社区', '聚合', '政策',
  '市场', '官方动态', 'AI精选', 'News', '财联社', 'Reuters', 'BBC', 'WSJ',
]);

const ZH_STOPWORDS = new Set([
  '发布', '推出', '宣布', '最新', '如何', '关于', '以及', '通过', '进行', '实现',
  '提供', '支持', '使用', '功能', '更新', '报道', '消息', '表示', '认为', '可能',
  '已经', '正在', '进一步', '加快', '加强', '持续', '面向', '基于', '打造', '带来',
  '上线', '公布', '详解', '实测', '展示', '推进', '开展', '指导', '完善', '全面',
]);

function extractEventTokens(item) {
  const tokens = new Set();
  const textParts = [item.title || '', item.originalTitle || ''];
  const combinedText = textParts.join(' ');

  // 1. Latin / alphanumeric entity tokens (e.g. openai, gpt-6, sagemaker, fed, ecb, a50)
  const enMatches = combinedText.toLowerCase().match(/[a-z0-9][a-z0-9._+-]{1,}/g) || [];
  for (const tok of enMatches) {
    const clean = tok.replace(/^[._+-]+|[._+-]+$/g, '');
    if (clean.length < 2 || /^\d+$/.test(clean) || EN_STOPWORDS.has(clean)) continue;
    tokens.add(clean);
  }

  // 2. Meaningful tags (entity names like Perplexity, AWS Quick, 美联储, A股, 央行)
  if (Array.isArray(item.tags)) {
    for (const tag of item.tags) {
      const clean = String(tag || '').trim();
      if (!clean || GENERIC_TAGS.has(clean)) continue;
      const lower = clean.toLowerCase();
      if (!EN_STOPWORDS.has(lower) && !ZH_STOPWORDS.has(clean) && clean.length >= 2) {
        tokens.add(lower);
      }
    }
  }

  // 3. CJK character bigrams from title (helps match related Chinese headlines)
  const zhChunks = String(item.title || '').match(/[\u4e00-\u9fff]{2,}/g) || [];
  for (const chunk of zhChunks) {
    if (chunk.length <= 4 && !ZH_STOPWORDS.has(chunk)) {
      tokens.add(chunk);
    }
    for (let i = 0; i < chunk.length - 1; i += 1) {
      const bg = chunk.slice(i, i + 2);
      if (!ZH_STOPWORDS.has(bg)) {
        tokens.add(bg);
      }
    }
  }

  return tokens;
}

function jaccardSimilarity(setA, setB) {
  if (!setA || !setB || setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  const [smaller, larger] = setA.size <= setB.size ? [setA, setB] : [setB, setA];
  for (const tok of smaller) {
    if (larger.has(tok)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function buildHotEvents(items, nowMs = Date.now(), options = {}) {
  const windowHours = Number(options.windowHours) || 72;
  const maxEvents = Number(options.maxEvents) || 20;
  const similarityThreshold =
    typeof options.similarityThreshold === 'number' ? options.similarityThreshold : 0.25;
  const fallbackToLatest = options.fallbackToLatest !== false;

  const normalized = normalizeNewsList(Array.isArray(items) ? items : []).filter(
    (it) => it && it.id && it.title && it.url
  );
  if (normalized.length === 0) return [];

  const withTime = normalized.map((item) => ({
    item,
    ts: new Date(item.publishedAt || 0).getTime() || 0,
    tokens: extractEventTokens(item),
  }));

  const windowMs = windowHours * 3600 * 1000;
  let effectiveNowMs = Number.isFinite(nowMs) ? nowMs : Date.now();
  let windowItems = withTime.filter(
    (entry) => entry.ts > 0 && entry.ts >= effectiveNowMs - windowMs && entry.ts <= effectiveNowMs + 24 * 3600 * 1000
  );

  if (windowItems.length === 0 && fallbackToLatest) {
    const latestTs = Math.max(...withTime.map((e) => e.ts));
    if (latestTs > 0) {
      effectiveNowMs = latestTs;
      windowItems = withTime.filter((entry) => entry.ts >= effectiveNowMs - windowMs);
    } else {
      windowItems = withTime.slice(0, 30);
    }
  }

  if (windowItems.length === 0) return [];

  // Sort by score desc, then newest first so the highest-signal item leads each cluster
  windowItems.sort((a, b) => {
    const sa = Number.isFinite(Number(a.item.score)) ? Number(a.item.score) : 65;
    const sb = Number.isFinite(Number(b.item.score)) ? Number(b.item.score) : 65;
    if (sb !== sa) return sb - sa;
    return b.ts - a.ts;
  });

  const clusters = [];
  for (const entry of windowItems) {
    let bestCluster = null;
    let bestSim = 0;

    for (const cluster of clusters) {
      if (Math.abs(entry.ts - cluster.latestMs) > windowMs) continue;
      const simLead = jaccardSimilarity(entry.tokens, cluster.leadTokens);
      const simUnion = jaccardSimilarity(entry.tokens, cluster.unionTokens);
      const sim = Math.max(simLead, simUnion);
      if (sim >= similarityThreshold && sim > bestSim) {
        bestSim = sim;
        bestCluster = cluster;
      }
    }

    if (bestCluster) {
      bestCluster.entries.push(entry);
      if (entry.ts > bestCluster.latestMs) bestCluster.latestMs = entry.ts;
      for (const tok of entry.tokens) bestCluster.unionTokens.add(tok);
    } else {
      clusters.push({
        entries: [entry],
        leadTokens: new Set(entry.tokens),
        unionTokens: new Set(entry.tokens),
        latestMs: entry.ts,
      });
    }
  }

  const scored = clusters.map((cluster) => {
    // Sort items inside cluster: highest score first, then newest
    cluster.entries.sort((a, b) => {
      const sa = Number.isFinite(Number(a.item.score)) ? Number(a.item.score) : 65;
      const sb = Number.isFinite(Number(b.item.score)) ? Number(b.item.score) : 65;
      if (sb !== sa) return sb - sa;
      return b.ts - a.ts;
    });

    const lead = cluster.entries[0].item;
    const sourceSet = new Set(
      cluster.entries.map((e) => String(e.item.source || 'Unknown').trim().toLowerCase())
    );
    const sourceCount = Math.max(1, sourceSet.size);
    const topScore = Math.max(
      ...cluster.entries.map((e) => (Number.isFinite(Number(e.item.score)) ? Number(e.item.score) : 65))
    );

    const ageHours = Math.max(0, (effectiveNowMs - cluster.latestMs) / 3600000);
    const decayFactor = Math.pow(0.5, ageHours / 24);
    const sameSourceFollowups = Math.max(0, cluster.entries.length - sourceCount);
    const rawHeat = (sourceCount * 35 + sameSourceFollowups * 8 + topScore * 0.6) * decayFactor;
    const heatScore = Math.round(rawHeat * 10) / 10;

    const topicSet = new Set();
    for (const e of cluster.entries) {
      for (const t of Array.isArray(e.item.topics) ? e.item.topics : []) {
        if (t) topicSet.add(t);
      }
    }

    const latestAt = new Date(cluster.latestMs || Date.now()).toISOString();
    const idHash = crypto
      .createHash('sha1')
      .update(`${lead.id}:${cluster.entries.map((e) => e.item.id).sort().join(',')}`)
      .digest('hex')
      .slice(0, 8);

    return {
      id: `hot-${idHash}`,
      rank: 0,
      title: lead.title,
      industry: lead.industry || 'AI',
      topics: [...topicSet].slice(0, 4),
      heatScore,
      sourceCount,
      latestAt,
      summary: lead.summary || lead.title,
      items: cluster.entries.map((e) => ({
        id: e.item.id,
        title: e.item.title,
        source: e.item.source || 'Unknown',
        publishedAt: e.item.publishedAt || latestAt,
        url: e.item.url,
        score: Number.isFinite(Number(e.item.score)) ? Number(e.item.score) : 65,
      })),
    };
  });

  scored.sort((a, b) => {
    if (b.heatScore !== a.heatScore) return b.heatScore - a.heatScore;
    if (b.sourceCount !== a.sourceCount) return b.sourceCount - a.sourceCount;
    return new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime();
  });

  return scored.slice(0, maxEvents).map((ev, idx) => ({
    ...ev,
    rank: idx + 1,
  }));
}

async function curateWithLlm(candidate, { apiKey, baseUrl, model, systemPrompt, timeoutMs = 45000 }) {
  const endpoint = `${String(baseUrl || 'https://open.bigmodel.cn/api/coding/paas/v4').replace(/\/+$/, '')}/chat/completions`;
  const userPrompt = [
    `【来源】${candidate.source}（行业：${candidate.industry || 'AI'}，分级：${candidate.tier}，标签：${(candidate.sourceTags || []).join(' / ') || '无'}）`,
    `【发布时间】${candidate.publishedAt}`,
    `【原标题】${candidate.title}`,
    `【原文链接】${candidate.url}`,
    `【正文摘要】${candidate.snippet || '（无正文摘要）'}`,
  ].join('\n');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 2048,
        messages: [
          { role: 'system', content: systemPrompt || buildCurationSystemPrompt(null, candidate.industry) },
          { role: 'user', content: userPrompt },
        ],
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`LLM HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    return parseJsonFromLlm(content);
  } finally {
    clearTimeout(timer);
  }
}

function parseCsvList(val) {
  return String(val || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseCliArgs(argv) {
  const opts = {
    dryRun: false,
    noLlm: false,
    allowRaw: false,
    backfillContent: false,
    rebuildHot: false,
    industries: parseCsvList(process.env.AIHOT_INDUSTRIES),
    kinds: parseCsvList(process.env.AIHOT_SOURCE_KINDS),
    dueStatePath: process.env.AIHOT_DUE_STATE_PATH || '',
    browseFloor: Number(process.env.AIHOT_BROWSE_FLOOR || DEFAULT_BROWSE_FLOOR),
    hours: Number(process.env.AIHOT_WINDOW_HOURS || 72),
    perSource: Number(process.env.AIHOT_PER_SOURCE || 6),
    maxCandidates: Number(process.env.AIHOT_MAX_CANDIDATES || 30),
    maxNew: Number(process.env.AIHOT_MAX_NEW || 15),
    maxTotal: Number(process.env.AIHOT_MAX_TOTAL || 150),
    sourcesPath: DEFAULT_SOURCES_PATH,
    newsPath: DEFAULT_NEWS_PATH,
    hotPath: DEFAULT_HOT_PATH,
  };

  for (const arg of argv) {
    if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--no-llm') opts.noLlm = true;
    else if (arg === '--allow-raw') opts.allowRaw = true;
    else if (arg === '--backfill-content') opts.backfillContent = true;
    else if (arg === '--rebuild-hot') opts.rebuildHot = true;
    else if (arg.startsWith('--industry=')) opts.industries = parseCsvList(arg.slice('--industry='.length));
    else if (arg.startsWith('--kind=')) opts.kinds = parseCsvList(arg.slice('--kind='.length));
    else if (arg.startsWith('--due-state=')) opts.dueStatePath = path.resolve(arg.slice('--due-state='.length));
    else if (arg.startsWith('--browse-floor=')) {
      const n = Number(arg.slice('--browse-floor='.length));
      if (Number.isFinite(n)) opts.browseFloor = n;
    }
    else if (arg.startsWith('--hours=')) opts.hours = Number(arg.split('=')[1]) || opts.hours;
    else if (arg.startsWith('--per-source=')) opts.perSource = Number(arg.split('=')[1]) || opts.perSource;
    else if (arg.startsWith('--max-candidates=')) opts.maxCandidates = Number(arg.split('=')[1]) || opts.maxCandidates;
    else if (arg.startsWith('--max-new=')) opts.maxNew = Number(arg.split('=')[1]) || opts.maxNew;
    else if (arg.startsWith('--max-total=')) opts.maxTotal = Number(arg.split('=')[1]) || opts.maxTotal;
    else if (arg.startsWith('--hot-path=')) opts.hotPath = path.resolve(arg.slice('--hot-path='.length));
  }

  return opts;
}

async function runSync(opts) {
  const existingRaw = fs.existsSync(opts.newsPath)
    ? JSON.parse(fs.readFileSync(opts.newsPath, 'utf8'))
    : [];
  const existing = normalizeNewsList(existingRaw);

  if (opts.rebuildHot) {
    const hotEvents = buildHotEvents(existing, Date.now(), { windowHours: opts.hours });
    console.log(
      `[aihot-sync] Normalized ${existing.length} news items and built ${hotEvents.length} hot event clusters.`
    );
    if (!opts.dryRun) {
      fs.writeFileSync(opts.newsPath, `${JSON.stringify(existing, null, 2)}\n`, 'utf8');
      fs.writeFileSync(opts.hotPath || DEFAULT_HOT_PATH, `${JSON.stringify(hotEvents, null, 2)}\n`, 'utf8');
      console.log(`[aihot-sync] Updated ${opts.newsPath} and ${opts.hotPath || DEFAULT_HOT_PATH}`);
    } else {
      console.log('[aihot-sync] --dry-run enabled; no files written.');
    }
    return { added: 0, total: existing.length, hotEvents: hotEvents.length };
  }

  const extractor = await getAihotExtractor();
  const config = JSON.parse(fs.readFileSync(opts.sourcesPath, 'utf8'));
  const allSources = Array.isArray(config.sources) ? config.sources : [];
  let sources = filterSources(allSources, { industries: opts.industries, kinds: opts.kinds });
  let dueState = {};
  const nowMs = Date.now();
  if (opts.dueStatePath && !opts.backfillContent) {
    try {
      if (fs.existsSync(opts.dueStatePath)) {
        dueState = JSON.parse(fs.readFileSync(opts.dueStatePath, 'utf8')) || {};
      }
    } catch {
      dueState = {};
    }
    const beforeCount = sources.length;
    sources = sources.filter((src) => {
      const intervalMs = (Number(src.intervalMinutes) || 120) * 60 * 1000;
      const lastMs = Number(dueState[src.id] || 0);
      return !lastMs || nowMs - lastMs >= intervalMs;
    });
    console.log(`[aihot-sync] Due-source check: ${sources.length}/${beforeCount} sources due.`);
    if (sources.length === 0) {
      return { added: 0, total: existing.length };
    }
  }
  const thresholds = {
    ...DEFAULT_THRESHOLDS,
    ...extractor.getAihotThresholds(),
    ...(config.thresholds || {}),
    browseFloor: opts.browseFloor,
  };

  const existingUrls = new Set(existing.map((i) => normalizeUrl(i.url)));
  const existingTitles = new Set(existing.map((i) => normalizeTitleFingerprint(i.title)));
  const cutoffMs = Date.now() - opts.hours * 3600 * 1000;

  console.log(
    `[aihot-sync] Fetching ${sources.length}/${allSources.length} curated sources (window=${opts.hours}h, industries=${opts.industries.join(',') || 'all'}, kinds=${opts.kinds.join(',') || 'all'})...`
  );

  const fetchedAll = [];
  let okCount = 0;
  const results = await Promise.allSettled(sources.map((src) => fetchSource(src)));
  results.forEach((result, idx) => {
    const src = sources[idx];
    if (result.status === 'fulfilled') {
      okCount += 1;
      if (opts.dueStatePath) dueState[src.id] = Date.now();
      fetchedAll.push(...result.value.slice(0, opts.backfillContent ? 25 : opts.perSource));
    } else {
      console.warn(`[aihot-sync] Source failed (${src.name} [${src.kind || 'rss'}]): ${result.reason?.message || result.reason}`);
    }
  });

  if (opts.dueStatePath && !opts.dryRun && !opts.backfillContent) {
    try {
      fs.writeFileSync(opts.dueStatePath, `${JSON.stringify(dueState, null, 2)}\n`, 'utf8');
    } catch (e) {
      console.warn(`[aihot-sync] Failed to save due state: ${e.message}`);
    }
  }

  if (opts.backfillContent) {
    const byUrl = new Map();
    fetchedAll.forEach((item) => {
      byUrl.set(normalizeUrl(item.url), item);
    });
    let updatedCount = 0;
    const enriched = [];
    for (const item of existing) {
      if (!String(item.id || '').startsWith('aihot-')) {
        enriched.push(item);
        continue;
      }
      const match = byUrl.get(normalizeUrl(item.url));
      const next = { ...item };
      let changed = false;
      if (!next.originalTitle && match && match.title && match.title !== next.title) {
        next.originalTitle = match.title;
        changed = true;
      }
      if (!next.author && match && match.author) {
        next.author = match.author;
        changed = true;
      }

      const extracted = await extractor.extractFullArticle(item.url, {
        fallbackHtml: match?.contentHtml || item.contentHtml || '',
      });
      if (extracted.author && !next.author) {
        next.author = extracted.author;
        changed = true;
      }
      if (extracted.html && extracted.html !== next.contentHtml) {
        next.contentHtml = extracted.html;
        changed = true;
        console.log(`  [EXTRACT ${extracted.via}] ${item.source} (${extracted.text.length} chars): ${item.title}`);
      }
      if (changed) updatedCount += 1;
      enriched.push(next);
    }
    console.log(`[aihot-sync] Backfilled full AIHOT content/meta for ${updatedCount} existing AIHOT items.`);
    if (!opts.dryRun && updatedCount > 0) {
      fs.writeFileSync(opts.newsPath, `${JSON.stringify(enriched, null, 2)}\n`, 'utf8');
      console.log(`[aihot-sync] Updated ${opts.newsPath}`);
    }
    return { added: 0, updated: updatedCount, total: enriched.length };
  }

  // Deduplicate & keep within recency window
  const seenBatchUrls = new Set();
  const candidates = [];
  for (const item of fetchedAll) {
    const ts = new Date(item.publishedAt).getTime();
    if (Number.isFinite(ts) && ts < cutoffMs) continue;
    const uKey = normalizeUrl(item.url);
    const tKey = normalizeTitleFingerprint(item.title);
    if (existingUrls.has(uKey) || existingTitles.has(tKey) || seenBatchUrls.has(uKey)) continue;
    seenBatchUrls.add(uKey);
    candidates.push(item);
  }

  // Prioritize T1 official sources, then newest
  candidates.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier === 'T1' ? -1 : 1;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  const selectedCandidates = candidates.slice(0, opts.maxCandidates);
  console.log(
    `[aihot-sync] Sources OK: ${okCount}/${sources.length}, fetched: ${fetchedAll.length}, fresh candidates: ${candidates.length} (evaluating up to ${selectedCandidates.length})`
  );

  if (selectedCandidates.length === 0) {
    console.log('[aihot-sync] No fresh candidates to curate.');
    return { added: 0, total: existing.length };
  }

  const apiKey =
    process.env.AIHOT_LLM_API_KEY ||
    process.env.GLM_API_KEY ||
    process.env.ZHIPU_API_KEY ||
    process.env.OPENAI_API_KEY ||
    '';
  const baseUrl = process.env.AIHOT_LLM_BASE_URL || 'https://open.bigmodel.cn/api/coding/paas/v4';
  const model = process.env.AIHOT_LLM_MODEL || 'glm-5.3-flash';

  const curatedItems = [];

  if (opts.noLlm || !apiKey) {
    if (!opts.allowRaw) {
      console.log(
        '[aihot-sync] Skipping LLM curation (AIHOT_LLM_API_KEY not set or --no-llm passed). Set AIHOT_LLM_API_KEY to enable AIHOT scoring & Chinese summaries.'
      );
      if (opts.dryRun) {
        console.log('[aihot-sync] Sample fresh candidates:');
        selectedCandidates.slice(0, 5).forEach((c) => {
          console.log(`  - [${c.industry}/${c.sourceKind}/${c.tier}] ${c.source}: ${c.title} (${c.publishedAt.slice(0, 10)})`);
        });
      }
      return { added: 0, total: existing.length };
    }

    for (const candidate of selectedCandidates) {
      if (curatedItems.length >= opts.maxNew) break;
      const isT1 = candidate.tier === 'T1';
      const item = buildNewsItem(
        candidate,
        {
          score: isT1 ? 70 : 55,
          selected: isT1,
          title: candidate.title,
          summary: candidate.snippet || candidate.title,
          tags: candidate.sourceTags,
          topics: candidate.topics,
        },
        thresholds
      );
      if (item) curatedItems.push(item);
    }
  } else {
    console.log(`[aihot-sync] Curating via ${model} (${baseUrl})...`);
    const promptCache = new Map();
    for (const candidate of selectedCandidates) {
      if (curatedItems.length >= opts.maxNew) break;
      try {
        const ind = candidate.industry || 'AI';
        if (!promptCache.has(ind)) {
          promptCache.set(ind, buildCurationSystemPrompt(extractor, ind));
        }
        const curated = await curateWithLlm(candidate, {
          apiKey,
          baseUrl,
          model,
          systemPrompt: promptCache.get(ind),
        });
        const item = buildNewsItem(candidate, curated, thresholds);
        if (item) {
          if (item.selected) {
            const extracted = await extractor.extractFullArticle(candidate.url, {
              fallbackHtml: candidate.contentHtml || '',
            });
            if (extracted.html) {
              item.contentHtml = extracted.html;
            }
            if (extracted.author && !item.author) {
              item.author = extracted.author;
            }
            if (extracted.html && isMostlyEnglish(extracted.text)) {
              try {
                const zhRaw = await translateHtmlWithLlm(extracted.html, {
                  apiKey,
                  baseUrl,
                  model,
                  extractor,
                });
                const zhClean = extractor.sanitizeWithAihot(zhRaw, candidate.url);
                if (zhClean) item.contentHtmlZh = zhClean;
              } catch (tErr) {
                console.warn(`  [TRANSLATE ERR] ${candidate.source}: ${tErr.message}`);
              }
            }
            console.log(`  [KEEP ${item.score}] (${item.industry}/${item.tier}, ${extracted.via}${item.contentHtmlZh ? '+zh' : ''}) ${item.source} -> ${item.title}`);
          } else {
            console.log(`  [BROWSE ${item.score}] (${item.industry}/${item.tier}) ${item.source} -> ${item.title}`);
          }
          curatedItems.push(item);
        } else {
          console.log(`  [DROP ${curated?.score ?? '?'}] (${candidate.industry}/${candidate.tier}) ${candidate.source}: ${candidate.title}`);
        }
      } catch (err) {
        console.warn(`  [ERR] ${candidate.source} "${candidate.title}": ${err.message}`);
      }
    }
  }

  const merged = mergeNewsLists(existing, curatedItems, opts.maxTotal);
  const hotEvents = buildHotEvents(merged, Date.now(), { windowHours: opts.hours });
  console.log(
    `[aihot-sync] Curated ${curatedItems.length} new items. Total news items: ${merged.length}. Hot events: ${hotEvents.length}.`
  );

  if (!opts.dryRun && curatedItems.length > 0) {
    fs.writeFileSync(opts.newsPath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
    fs.writeFileSync(opts.hotPath || DEFAULT_HOT_PATH, `${JSON.stringify(hotEvents, null, 2)}\n`, 'utf8');
    console.log(`[aihot-sync] Updated ${opts.newsPath} and ${opts.hotPath || DEFAULT_HOT_PATH}`);
  } else if (opts.dryRun) {
    console.log('[aihot-sync] --dry-run enabled; no files written.');
  }

  return { added: curatedItems.length, total: merged.length, hotEvents: hotEvents.length };
}

if (require.main === module) {
  const opts = parseCliArgs(process.argv.slice(2));
  runSync(opts).catch((err) => {
    console.error('[aihot-sync] Fatal error:', err);
    process.exitCode = 1;
  });
}

module.exports = {
  DEFAULT_THRESHOLDS,
  DEFAULT_BROWSE_FLOOR,
  decodeXmlEntities,
  stripHtml,
  parseDateIso,
  parseFeedXml,
  parseJsonFeed,
  parseWebHtml,
  fetchSource,
  fetchFeed,
  filterSources,
  normalizeUrl,
  normalizeTitleFingerprint,
  getThresholdForTier,
  parseJsonFromLlm,
  inferTopicsForItem,
  normalizeExistingNewsItem,
  normalizeNewsList,
  buildNewsItem,
  mergeNewsLists,
  extractEventTokens,
  jaccardSimilarity,
  buildHotEvents,
  parseCliArgs,
  runSync,
};
