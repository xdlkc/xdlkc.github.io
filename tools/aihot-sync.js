#!/usr/bin/env node
/**
 * AIHOT-inspired stateless news curator for Hexo (`source/_data/news.json`).
 *
 * Fetches curated AI RSS/Atom feeds from `source/_data/aihot-sources.json`,
 * deduplicates against existing items, scores & writes answer-first Chinese
 * summaries via an OpenAI-compatible LLM API (using AIHOT's tiered thresholds
 * and self-contained title / anti-hallucination rules), and merges into
 * `source/_data/news.json`.
 *
 * Usage:
 *   node tools/aihot-sync.js [--dry-run] [--no-llm] [--allow-raw]
 *     [--hours=72] [--per-source=6] [--max-candidates=30] [--max-new=15] [--max-total=120]
 *
 * Environment variables:
 *   AIHOT_LLM_API_KEY   API key for OpenAI-compatible chat completions (fallbacks: GLM_API_KEY, ZHIPU_API_KEY, OPENAI_API_KEY)
 *   AIHOT_LLM_BASE_URL  Base URL (default: https://open.bigmodel.cn/api/coding/paas/v4)
 *   AIHOT_LLM_MODEL     Model name (default: glm-5.3-flash)
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT_DIR = path.resolve(__dirname, '..');
const DEFAULT_SOURCES_PATH = path.join(ROOT_DIR, 'source', '_data', 'aihot-sources.json');
const DEFAULT_NEWS_PATH = path.join(ROOT_DIR, 'source', '_data', 'news.json');

const DEFAULT_THRESHOLDS = {
  T1: 60,
  T1_5: 65,
  T2: 76,
};

const CURATION_SYSTEM_PROMPT = `你是 AI 行业资讯精选编辑，参考 AIHOT 的精选与写作规范，对单条候选资讯进行严格评分并改写为高质量中文快讯。

【评分标准（0-100 整数）】
- 90-100：头部机构重磅模型/产品发布、重大开源突破、改变行业格局的大事。
- 75-89：有明确新进展的产品上线、重要研究论文、高质量工程深度实践或关键行业动态。
- 60-74：官方常规更新、细分工具发布、有价值的工程案例或评测。
- <60：纯营销软文、无实质内容的预告、旧闻转述、泛泛而谈的观点水文。

【标题自洽规则】
1. 标题必须明确点出核心主体（公司/模型/产品/项目名），让读者不点开就知道是谁做了什么。
2. 英文标题翻译为自然中文，保持原意；严禁把分析/教程/评测（How/Why/Guide/Analysis）夸大改写成“发布/上线/开源”。
3. 只使用来源或正文中真实出现的名称与数字，严禁凭常识编造未出现的型号、公司或数据。

【摘要答案前置规则】
1. 第一句（30-70字）直接交代“谁做了什么、关键结果或变化是什么”，禁止以“本文介绍了”“文章讨论了”“据报道”起句。
2. 后面补 1-2 个可验证的关键事实或对开发者/行业的直接影响，总共 2-3 个紧凑陈述句，不使用 Markdown 列表或分段。
3. 事实不足时只写已知事实，不臆测。

【输出格式】
严格输出单个 JSON 对象，不要包含 Markdown 代码块或其他多余文字：
{
  "score": 0-100 整数,
  "title": "自洽的中文标题",
  "summary": "2-3 句答案前置的中文摘要",
  "context": "1 句简短背景或为什么值得关注（25-60字）",
  "tags": ["2到4个简短中文或英文技术标签"]
}`;

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
  if (!raw) return '';
  const cleaned = stripHtml(raw);
  const d = new Date(cleaned);
  return Number.isFinite(d.getTime()) ? d.toISOString() : '';
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
    const rawSnippet = extractTag(block, ['description', 'summary', 'content:encoded', 'content']);
    const snippet = stripHtml(rawSnippet).slice(0, 900);

    if (!title || !url || !/^https?:\/\//i.test(url)) continue;

    items.push({
      title,
      url,
      snippet,
      publishedAt: publishedAt || new Date().toISOString(),
      source: sourceMeta.name || 'Unknown',
      sourceId: sourceMeta.id || 'unknown',
      tier: sourceMeta.tier || 'T2',
      sourceTags: Array.isArray(sourceMeta.tags) ? sourceMeta.tags : [],
    });
  }

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
  const slug = String(sourceId || 'aihot').replace(/^rss-/, '').replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
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

function buildNewsItem(candidate, curated, thresholds = DEFAULT_THRESHOLDS) {
  const score = Number(curated.score);
  const threshold = getThresholdForTier(candidate.tier, thresholds);
  if (!Number.isFinite(score) || score < threshold) {
    return null;
  }

  const title = String(curated.title || candidate.title || '').trim();
  const summary = String(curated.summary || candidate.snippet || '').trim();
  const context = String(curated.context || '').trim();
  if (!title || !summary) return null;

  const primarySourceTag = candidate.sourceTags[0] || '';
  const region = primarySourceTag ? ['AI精选', primarySourceTag] : ['AI精选'];

  const tagSet = new Set();
  const mergedTags = [];
  for (const t of [...candidate.sourceTags, ...(Array.isArray(curated.tags) ? curated.tags : [])]) {
    const clean = String(t || '').trim();
    if (clean && !tagSet.has(clean)) {
      tagSet.add(clean);
      mergedTags.push(clean);
    }
  }

  return {
    id: makeItemId(candidate.sourceId, candidate.url, candidate.publishedAt),
    title,
    summary,
    url: candidate.url,
    source: candidate.source,
    publishedAt: candidate.publishedAt,
    score: Math.round(score),
    tier: candidate.tier,
    region,
    tags: mergedTags.slice(0, 6),
    ...(context ? { context } : {}),
  };
}

function mergeNewsLists(existingItems, newItems, maxTotal = 120) {
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

async function fetchFeed(source, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(source.feedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'xdlkc-blog-aihot-sync/1.0 (+https://xdlkc.github.io)',
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const xml = await res.text();
    return parseFeedXml(xml, source);
  } finally {
    clearTimeout(timer);
  }
}

async function curateWithLlm(candidate, { apiKey, baseUrl, model, timeoutMs = 45000 }) {
  const endpoint = `${String(baseUrl || 'https://open.bigmodel.cn/api/coding/paas/v4').replace(/\/+$/, '')}/chat/completions`;
  const userPrompt = [
    `【来源】${candidate.source}（分级：${candidate.tier}，标签：${candidate.sourceTags.join(' / ') || '无'}）`,
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
          { role: 'system', content: CURATION_SYSTEM_PROMPT },
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

function parseCliArgs(argv) {
  const opts = {
    dryRun: false,
    noLlm: false,
    allowRaw: false,
    hours: Number(process.env.AIHOT_WINDOW_HOURS || 72),
    perSource: Number(process.env.AIHOT_PER_SOURCE || 6),
    maxCandidates: Number(process.env.AIHOT_MAX_CANDIDATES || 30),
    maxNew: Number(process.env.AIHOT_MAX_NEW || 15),
    maxTotal: Number(process.env.AIHOT_MAX_TOTAL || 120),
    sourcesPath: DEFAULT_SOURCES_PATH,
    newsPath: DEFAULT_NEWS_PATH,
  };

  for (const arg of argv) {
    if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--no-llm') opts.noLlm = true;
    else if (arg === '--allow-raw') opts.allowRaw = true;
    else if (arg.startsWith('--hours=')) opts.hours = Number(arg.split('=')[1]) || opts.hours;
    else if (arg.startsWith('--per-source=')) opts.perSource = Number(arg.split('=')[1]) || opts.perSource;
    else if (arg.startsWith('--max-candidates=')) opts.maxCandidates = Number(arg.split('=')[1]) || opts.maxCandidates;
    else if (arg.startsWith('--max-new=')) opts.maxNew = Number(arg.split('=')[1]) || opts.maxNew;
    else if (arg.startsWith('--max-total=')) opts.maxTotal = Number(arg.split('=')[1]) || opts.maxTotal;
  }

  return opts;
}

async function runSync(opts) {
  const config = JSON.parse(fs.readFileSync(opts.sourcesPath, 'utf8'));
  const sources = Array.isArray(config.sources) ? config.sources : [];
  const thresholds = { ...DEFAULT_THRESHOLDS, ...(config.thresholds || {}) };

  const existing = fs.existsSync(opts.newsPath)
    ? JSON.parse(fs.readFileSync(opts.newsPath, 'utf8'))
    : [];

  const existingUrls = new Set(existing.map((i) => normalizeUrl(i.url)));
  const existingTitles = new Set(existing.map((i) => normalizeTitleFingerprint(i.title)));
  const cutoffMs = Date.now() - opts.hours * 3600 * 1000;

  console.log(`[aihot-sync] Fetching ${sources.length} curated AI sources (window=${opts.hours}h)...`);

  const fetchedAll = [];
  let okCount = 0;
  const results = await Promise.allSettled(sources.map((src) => fetchFeed(src)));
  results.forEach((result, idx) => {
    const src = sources[idx];
    if (result.status === 'fulfilled') {
      okCount += 1;
      fetchedAll.push(...result.value.slice(0, opts.perSource));
    } else {
      console.warn(`[aihot-sync] Feed failed (${src.name}): ${result.reason?.message || result.reason}`);
    }
  });

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
    `[aihot-sync] Feeds OK: ${okCount}/${sources.length}, fetched: ${fetchedAll.length}, fresh candidates: ${candidates.length} (evaluating up to ${selectedCandidates.length})`
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
          console.log(`  - [${c.tier}] ${c.source}: ${c.title} (${c.publishedAt.slice(0, 10)})`);
        });
      }
      return { added: 0, total: existing.length };
    }

    for (const candidate of selectedCandidates) {
      if (candidate.tier !== 'T1') continue;
      if (curatedItems.length >= opts.maxNew) break;
      const item = buildNewsItem(
        candidate,
        { score: 70, title: candidate.title, summary: candidate.snippet || candidate.title, tags: candidate.sourceTags },
        thresholds
      );
      if (item) curatedItems.push(item);
    }
  } else {
    console.log(`[aihot-sync] Curating via ${model} (${baseUrl})...`);
    for (const candidate of selectedCandidates) {
      if (curatedItems.length >= opts.maxNew) break;
      try {
        const curated = await curateWithLlm(candidate, { apiKey, baseUrl, model });
        const item = buildNewsItem(candidate, curated, thresholds);
        if (item) {
          curatedItems.push(item);
          console.log(`  [KEEP ${item.score}] (${item.tier}) ${item.source} -> ${item.title}`);
        } else {
          console.log(`  [DROP ${curated?.score ?? '?'}] (${candidate.tier}) ${candidate.source}: ${candidate.title}`);
        }
      } catch (err) {
        console.warn(`  [ERR] ${candidate.source} "${candidate.title}": ${err.message}`);
      }
    }
  }

  const merged = mergeNewsLists(existing, curatedItems, opts.maxTotal);
  console.log(`[aihot-sync] Curated ${curatedItems.length} new items. Total news items: ${merged.length}.`);

  if (!opts.dryRun && curatedItems.length > 0) {
    fs.writeFileSync(opts.newsPath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
    console.log(`[aihot-sync] Updated ${opts.newsPath}`);
  } else if (opts.dryRun) {
    console.log('[aihot-sync] --dry-run enabled; no files written.');
  }

  return { added: curatedItems.length, total: merged.length };
}

if (require.main === module) {
  const opts = parseCliArgs(process.argv.slice(2));
  runSync(opts).catch((err) => {
    console.error('[aihot-sync] Fatal error:', err);
    process.exitCode = 1;
  });
}

module.exports = {
  decodeXmlEntities,
  stripHtml,
  parseFeedXml,
  normalizeUrl,
  normalizeTitleFingerprint,
  getThresholdForTier,
  parseJsonFromLlm,
  buildNewsItem,
  mergeNewsLists,
  parseCliArgs,
  runSync,
};
