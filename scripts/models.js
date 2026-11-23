'use strict';

const fs = require('node:fs');
const path = require('node:path');

const DATA_DIR = path.join(__dirname, '..', 'source', '_data');
const DEFAULT_BENCHMARKS_DIR = path.join(DATA_DIR, 'benchmarks');
const DEFAULT_CATALOG_PATH = path.join(DATA_DIR, 'models-catalog.json');
const DEFAULT_NEWS_PATH = path.join(DATA_DIR, 'news.json');

const DOMAIN_DEFS = [
  { id: 'coding', labelZh: '编程', labelEn: 'Coding', weight: 0.38 },
  { id: 'reasoning', labelZh: '科研', labelEn: 'Reasoning', weight: 0.19 },
  { id: 'professional', labelZh: '专业办公', labelEn: 'Professional', weight: 0.19 },
  { id: 'knowledge', labelZh: '知识问答', labelEn: 'Knowledge', weight: 0.14 },
  { id: 'arena', labelZh: '真人盲选', labelEn: 'Arena', weight: 0.10 }
];

const DOMAIN_WEIGHT_MAP = Object.fromEntries(DOMAIN_DEFS.map((d) => [d.id, d.weight]));

const DOMESTIC_PROVIDERS = new Set([
  'Alibaba',
  'DeepSeek',
  'Moonshot AI',
  'Zhipu AI',
  'Xiaomi',
  'MiniMax',
  'ByteDance',
  'Baidu',
  'Tencent',
  'StepFun',
  '01.AI'
]);

const PROVIDER_META = {
  Anthropic: { code: 'AN', color: '#d97757' },
  Google: { code: 'GO', color: '#4285f4' },
  OpenAI: { code: 'OA', color: '#10a37f' },
  Alibaba: { code: 'QW', color: '#6366f1' },
  DeepSeek: { code: 'DS', color: '#2563eb' },
  'Moonshot AI': { code: 'KM', color: '#0f172a' },
  'Zhipu AI': { code: 'ZP', color: '#3b82f6' },
  Xiaomi: { code: 'XM', color: '#ff6900' },
  MiniMax: { code: 'MM', color: '#ec4899' },
  Meta: { code: 'MT', color: '#0668e1' },
  xAI: { code: 'xA', color: '#18181b' },
  ByteDance: { code: 'BD', color: '#06b6d4' },
  NVIDIA: { code: 'NV', color: '#76b900' },
  'LG AI': { code: 'LG', color: '#a50034' },
  'Mistral AI': { code: 'MS', color: '#f97316' }
};

function round1(value) {
  return Math.round(value * 10) / 10;
}

function round4(value) {
  return Math.round(value * 10000) / 10000;
}

function slugifyModel(name) {
  const base = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'model';
}

function stripVariantSuffix(modelName) {
  return String(modelName || '')
    .replace(/\s*\((high|medium|low|max|xhigh|minimal|thinking|reasoning|nexau-ahe|capy|codex cli|tongagents|wozcode)\)\s*$/i, '')
    .trim();
}

function inferDomain(rawDomain, category = '', id = '') {
  const d = String(rawDomain || '').trim().toLowerCase();
  if (DOMAIN_WEIGHT_MAP[d]) return d;

  const s = `${category} ${id}`.toLowerCase();
  if (/arena|盲选|对话|chat|elo/.test(s)) return 'arena';
  if (/code|coding|swe|terminal|编程|代码|agent/.test(s)) return 'coding';
  if (/office|work|finance|legal|gdpval|专业|办公|法律|金融/.test(s)) return 'professional';
  if (/knowledge|qa|simpleqa|知识|问答|事实/.test(s)) return 'knowledge';
  return 'reasoning';
}

function getProviderBadge(provider) {
  if (PROVIDER_META[provider]) return PROVIDER_META[provider];
  const letters = String(provider || 'AI')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 2)
    .toUpperCase() || 'AI';
  return { code: letters, color: '#64748b' };
}

function loadCatalog(catalogPath = DEFAULT_CATALOG_PATH) {
  if (!catalogPath || !fs.existsSync(catalogPath)) {
    return { usdToCny: 7.25, updatedAt: '', priceSource: '', priceSourceUrl: '', models: [] };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    return {
      usdToCny: Number(parsed.usdToCny) > 0 ? Number(parsed.usdToCny) : 7.25,
      updatedAt: String(parsed.updatedAt || '').trim(),
      priceSource: String(parsed.priceSource || '').trim(),
      priceSourceUrl: String(parsed.priceSourceUrl || '').trim(),
      models: Array.isArray(parsed.models) ? parsed.models : []
    };
  } catch (err) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(`[models] Failed to load catalog: ${err.message}`);
    }
    return { usdToCny: 7.25, updatedAt: '', priceSource: '', priceSourceUrl: '', models: [] };
  }
}

function buildCatalogLookup(catalog) {
  const byKey = new Map();
  for (const item of catalog.models || []) {
    if (!item || !item.name) continue;
    const keys = [
      item.name,
      item.slug,
      item.openRouterId,
      ...(Array.isArray(item.aliases) ? item.aliases : [])
    ];
    for (const k of keys) {
      const norm = String(k || '').trim().toLowerCase();
      if (norm) byKey.set(norm, item);
    }
  }
  return byKey;
}

function resolveCanonicalModel(rawModelName, catalogLookup) {
  const trimmed = String(rawModelName || '').trim();
  const exact = catalogLookup.get(trimmed.toLowerCase());
  if (exact) return exact;

  const stripped = stripVariantSuffix(trimmed);
  const byStripped = catalogLookup.get(stripped.toLowerCase());
  if (byStripped) return byStripped;

  return null;
}

function computeBlendedUsd(pricingUsd) {
  if (!pricingUsd || !Number.isFinite(Number(pricingUsd.input)) || !Number.isFinite(Number(pricingUsd.output))) {
    return null;
  }
  const input = Number(pricingUsd.input);
  const output = Number(pricingUsd.output);
  const cacheRead = pricingUsd.cacheRead !== null && pricingUsd.cacheRead !== undefined && Number.isFinite(Number(pricingUsd.cacheRead))
    ? Number(pricingUsd.cacheRead)
    : input;
  // 7:2:1 blended cost (70% cached input + 20% uncached input + 10% output)
  return round4(0.7 * cacheRead + 0.2 * input + 0.1 * output);
}

function normalizeEntry(raw, catalogLookup) {
  if (!raw || typeof raw !== 'object') return null;
  const rawModel = String(raw.model || '').trim();
  const score = Number(raw.score);
  if (!rawModel || !Number.isFinite(score)) return null;

  const cat = catalogLookup ? resolveCanonicalModel(rawModel, catalogLookup) : null;
  const canonicalName = cat ? cat.name : stripVariantSuffix(rawModel) || rawModel;
  const provider = cat ? cat.provider : (String(raw.provider || 'Unknown').trim() || 'Unknown');
  const openWeights = cat ? Boolean(cat.openWeights) : Boolean(raw.openWeights);
  const reasoning = cat ? Boolean(cat.reasoning) : Boolean(raw.reasoning);
  const domestic = cat ? Boolean(cat.domestic) : DOMESTIC_PROVIDERS.has(provider);

  return {
    model: canonicalName,
    rawModel,
    slug: cat ? cat.slug : slugifyModel(canonicalName),
    provider,
    domestic,
    openWeights,
    reasoning,
    score,
    releaseDate: (cat && cat.releaseDate) || (raw.releaseDate ? String(raw.releaseDate).trim() : ''),
    notes: raw.notes ? String(raw.notes).trim() : ''
  };
}

function sortEntries(entries, higherIsBetter = true) {
  return entries.slice().sort((a, b) => {
    const diff = higherIsBetter ? b.score - a.score : a.score - b.score;
    if (diff !== 0) return diff;
    return a.model.localeCompare(b.model, 'en');
  });
}

function deduplicateBenchmarkEntries(entries, higherIsBetter = true) {
  const bestBySlug = new Map();
  for (const entry of entries) {
    const key = entry.slug;
    const prev = bestBySlug.get(key);
    if (!prev) {
      bestBySlug.set(key, entry);
      continue;
    }
    const isBetter = higherIsBetter ? entry.score > prev.score : entry.score < prev.score;
    if (isBetter) {
      bestBySlug.set(key, entry);
    }
  }
  return sortEntries(Array.from(bestBySlug.values()), higherIsBetter);
}

function computeBenchmarkStats(entries) {
  const scores = entries.map((e) => e.score).filter((v) => Number.isFinite(v));
  if (!scores.length) {
    return { maxScore: 0, minScore: 0, meanScore: 0, stdScore: 0 };
  }
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const meanScore = scores.reduce((sum, v) => sum + v, 0) / scores.length;
  const variance = scores.reduce((sum, v) => sum + (v - meanScore) ** 2, 0) / scores.length;
  const stdScore = Math.sqrt(variance);
  return { maxScore, minScore, meanScore, stdScore };
}

function normalizeBenchmark(raw, fallbackId = '', catalogLookup = null) {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id || fallbackId || '').trim();
  if (!id) return null;

  const higherIsBetter = raw.higherIsBetter !== false;
  const rawEntries = Array.isArray(raw.entries) ? raw.entries : [];
  const normalized = rawEntries.map((e) => normalizeEntry(e, catalogLookup)).filter(Boolean);
  const entries = deduplicateBenchmarkEntries(normalized, higherIsBetter);
  const { maxScore, minScore, meanScore, stdScore } = computeBenchmarkStats(entries);
  const category = String(raw.category || 'Benchmark').trim();
  const domain = inferDomain(raw.domain, category, id);

  return {
    id,
    name: String(raw.name || id).trim(),
    domain,
    status: raw.status === 'reference' ? 'reference' : 'active',
    category,
    description: String(raw.description || '').trim(),
    unit: String(raw.unit || '%').trim(),
    higherIsBetter,
    sourceName: String(raw.sourceName || '').trim(),
    sourceUrl: String(raw.sourceUrl || '').trim(),
    updatedAt: String(raw.updatedAt || '').trim(),
    maxScore,
    minScore,
    meanScore: round4(meanScore),
    stdScore: round4(stdScore),
    entries
  };
}

function loadBenchmarksFromDir(dirPath = DEFAULT_BENCHMARKS_DIR, catalogLookup = null) {
  if (!dirPath || !fs.existsSync(dirPath)) return [];

  const files = fs
    .readdirSync(dirPath)
    .filter((file) => file.endsWith('.json') && !file.startsWith('.'))
    .sort((a, b) => a.localeCompare(b, 'en'));

  const benchmarks = [];
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) continue;

    try {
      const parsed = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      const fallbackId = path.basename(file, '.json');
      const normalized = normalizeBenchmark(parsed, fallbackId, catalogLookup);
      if (normalized) {
        benchmarks.push(normalized);
      }
    } catch (err) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn(`[models] Skipping invalid benchmark JSON "${file}": ${err.message}`);
      }
    }
  }

  return benchmarks;
}

function computeNormalizedScore(score, benchmark) {
  const { maxScore, minScore, meanScore, stdScore, higherIsBetter, entries } = benchmark;
  if (!Number.isFinite(score)) return 0;

  // Calibrated Z-score scale (mean=50, SD=15, matching AIHOT's cross-benchmark scale)
  // used whenever a benchmark has enough models (>=4) with non-zero variance.
  if (Array.isArray(entries) && entries.length >= 4 && stdScore > 1e-6) {
    const rawZ = higherIsBetter
      ? (score - meanScore) / stdScore
      : (meanScore - score) / stdScore;
    const clampedZ = Math.max(-2.2, Math.min(2.2, rawZ));
    return round1(Math.max(10, Math.min(99, 50 + clampedZ * 15)));
  }

  // Fallback for tiny custom benchmarks (< 4 models)
  if (higherIsBetter) {
    if (maxScore <= 0) return 0;
    return round1(Math.max(0, Math.min(100, (score / maxScore) * 100)));
  }

  if (score <= 0) return minScore <= 0 ? 100 : 0;
  if (minScore <= 0) return 0;
  return round1(Math.max(0, Math.min(100, (minScore / score) * 100)));
}

function loadRelatedNewsIndex(newsPath = DEFAULT_NEWS_PATH) {
  if (!newsPath || !fs.existsSync(newsPath)) return [];
  try {
    const items = JSON.parse(fs.readFileSync(newsPath, 'utf8'));
    if (!Array.isArray(items)) return [];
    return items
      .filter((item) => item && item.id && item.title)
      .map((item) => ({
        id: String(item.id),
        title: String(item.title),
        summary: String(item.summary || '').slice(0, 180),
        source: String(item.source || ''),
        publishedAt: String(item.publishedAt || ''),
        url: String(item.url || ''),
        haystack: `${item.title} ${item.originalTitle || ''} ${item.summary || ''} ${(item.tags || []).join(' ')}`.toLowerCase()
      }))
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  } catch {
    return [];
  }
}

function matchRelatedNews(modelRecord, newsIndex, catalogEntry) {
  if (!newsIndex.length) return [];
  const terms = new Set();
  const baseName = String(modelRecord.model || '').toLowerCase();
  if (baseName.length >= 4) terms.add(baseName);
  if (catalogEntry && Array.isArray(catalogEntry.newsKeywords)) {
    catalogEntry.newsKeywords.forEach((kw) => {
      const k = String(kw || '').trim().toLowerCase();
      if (k.length >= 2) terms.add(k);
    });
  }
  if (!terms.size) return [];
  const termList = Array.from(terms);

  const matches = [];
  for (const item of newsIndex) {
    if (termList.some((kw) => item.haystack.includes(kw))) {
      matches.push({
        id: item.id,
        title: item.title,
        summary: item.summary,
        source: item.source,
        publishedAt: item.publishedAt
      });
      if (matches.length >= 6) break;
    }
  }
  return matches;
}

function computeParetoFrontier(rankedRows) {
  const candidates = rankedRows
    .filter((r) => r.ranked && r.blendedUsd !== null && r.blendedUsd > 0 && Number.isFinite(r.compositeScore))
    .slice()
    .sort((a, b) => {
      if (a.blendedUsd !== b.blendedUsd) return a.blendedUsd - b.blendedUsd;
      return b.compositeScore - a.compositeScore;
    });

  const frontier = [];
  let bestScore = -Infinity;
  for (const row of candidates) {
    if (row.compositeScore > bestScore + 0.05) {
      const prev = frontier.length ? frontier[frontier.length - 1] : null;
      frontier.push({
        slug: row.slug,
        model: row.model,
        provider: row.provider,
        providerBadge: row.providerBadge,
        domestic: row.domestic,
        openWeights: row.openWeights,
        blendedUsd: row.blendedUsd,
        compositeScore: row.compositeScore,
        rank: row.rank,
        priceRatio: prev ? round1(row.blendedUsd / prev.blendedUsd) : null,
        scoreGain: prev ? round1(row.compositeScore - prev.compositeScore) : null
      });
      bestScore = row.compositeScore;
    }
  }
  return frontier;
}

function buildOverviewMatrix(benchmarks, catalog = { models: [] }, newsIndex = []) {
  const catalogLookup = buildCatalogLookup(catalog);
  const catalogBySlug = new Map((catalog.models || []).map((m) => [m.slug, m]));
  const activeBenchmarks = benchmarks.filter((b) => b.status !== 'reference');
  const scoringBenchmarks = activeBenchmarks.length ? activeBenchmarks : benchmarks;
  const scoringBenchIds = new Set(scoringBenchmarks.map((b) => b.id));
  const totalScoringBenchmarks = scoringBenchmarks.length;
  const activeDomainSet = new Set(scoringBenchmarks.map((b) => b.domain));
  const minBenchmarksForRank = totalScoringBenchmarks >= 4 ? Math.min(3, Math.ceil(totalScoringBenchmarks * 0.3)) : 1;
  const minDomainsForRank = activeDomainSet.size >= 2 && totalScoringBenchmarks >= 4 ? 2 : 1;

  const modelMap = new Map();

  for (const bench of benchmarks) {
    for (const entry of bench.entries) {
      const key = entry.slug;
      let record = modelMap.get(key);
      const cat = catalogBySlug.get(key) || resolveCanonicalModel(entry.model, catalogLookup);

      if (!record) {
        const pricingUsd = cat && cat.pricingUsd ? {
          input: Number(cat.pricingUsd.input),
          output: Number(cat.pricingUsd.output),
          cacheRead: cat.pricingUsd.cacheRead !== null && cat.pricingUsd.cacheRead !== undefined
            ? Number(cat.pricingUsd.cacheRead)
            : null
        } : null;

        record = {
          slug: key,
          model: cat ? cat.name : entry.model,
          provider: cat ? cat.provider : entry.provider,
          providerBadge: getProviderBadge(cat ? cat.provider : entry.provider),
          domestic: cat ? Boolean(cat.domestic) : entry.domestic,
          openWeights: cat ? Boolean(cat.openWeights) : entry.openWeights,
          weightsUrl: (cat && cat.weightsUrl) || '',
          reasoning: cat ? Boolean(cat.reasoning) : entry.reasoning,
          releaseDate: (cat && cat.releaseDate) || entry.releaseDate || '',
          contextLength: (cat && Number(cat.contextLength)) || null,
          pricingUsd,
          blendedUsd: computeBlendedUsd(pricingUsd),
          scores: {},
          normalizedScores: {},
          benchNotes: {},
          domainScores: {},
          domainBenchCounts: {},
          benchCount: 0,
          coveragePct: 0,
          compositeScore: 0,
          avgNormalized: 0,
          ranked: false,
          rank: null,
          unrankedReason: '',
          relatedNews: []
        };
        modelMap.set(key, record);
      } else {
        if (!record.releaseDate && entry.releaseDate) record.releaseDate = entry.releaseDate;
        if (entry.openWeights) record.openWeights = true;
        if (entry.reasoning) record.reasoning = true;
      }

      record.scores[bench.id] = entry.score;
      record.normalizedScores[bench.id] = computeNormalizedScore(entry.score, bench);
      if (entry.notes) {
        record.benchNotes[bench.id] = entry.notes;
      }
    }
  }

  const rows = Array.from(modelMap.values()).map((row) => {
    const activeEvaluatedIds = Object.keys(row.normalizedScores).filter((id) => scoringBenchIds.has(id));
    const benchCount = activeEvaluatedIds.length;
    const coveragePct = totalScoringBenchmarks ? Math.round((benchCount / totalScoringBenchmarks) * 100) : 0;

    // Group normalized scores by domain (active scoring benchmarks only)
    const byDomain = {};
    for (const bench of scoringBenchmarks) {
      const val = row.normalizedScores[bench.id];
      if (val === undefined) continue;
      if (!byDomain[bench.domain]) byDomain[bench.domain] = [];
      byDomain[bench.domain].push(val);
    }

    const domainScores = {};
    const domainBenchCounts = {};
    let weightedSum = 0;
    let weightTotal = 0;

    for (const def of DOMAIN_DEFS) {
      const vals = byDomain[def.id];
      if (vals && vals.length) {
        const avg = round1(vals.reduce((s, v) => s + v, 0) / vals.length);
        domainScores[def.id] = avg;
        domainBenchCounts[def.id] = vals.length;
        weightedSum += avg * def.weight;
        weightTotal += def.weight;
      }
    }

    const coveredDomains = Object.keys(domainScores).length;
    const fallbackVals = Object.values(row.normalizedScores);
    const compositeScore = weightTotal > 0
      ? round1(weightedSum / weightTotal)
      : (fallbackVals.length ? round1(fallbackVals.reduce((s, v) => s + v, 0) / fallbackVals.length) : 0);
    const ranked = benchCount >= minBenchmarksForRank && coveredDomains >= minDomainsForRank;
    const unrankedReason = ranked
      ? ''
      : (benchCount === 0
        ? '仅包含历史参考评测，未参与当前活跃综合排名'
        : `评测覆盖不足（当前 ${benchCount}/${totalScoringBenchmarks} 项，需至少 ${minBenchmarksForRank} 项且覆盖 ${minDomainsForRank} 个领域）`);

    const cat = catalogBySlug.get(row.slug);
    const relatedNews = matchRelatedNews(row, newsIndex, cat);

    return {
      ...row,
      benchCount,
      coveragePct,
      domainScores,
      domainBenchCounts,
      coveredDomains,
      compositeScore,
      avgNormalized: compositeScore,
      ranked,
      unrankedReason,
      relatedNews
    };
  });

  // Sort: ranked models first by compositeScore desc, then unranked by compositeScore desc
  rows.sort((a, b) => {
    if (a.ranked !== b.ranked) return a.ranked ? -1 : 1;
    if (b.compositeScore !== a.compositeScore) return b.compositeScore - a.compositeScore;
    if (b.benchCount !== a.benchCount) return b.benchCount - a.benchCount;
    return a.model.localeCompare(b.model, 'en');
  });

  let rankCounter = 0;
  for (const row of rows) {
    if (row.ranked) {
      rankCounter += 1;
      row.rank = rankCounter;
    } else {
      row.rank = null;
    }
  }

  return rows;
}

function buildModelsPayload(
  dirPath = DEFAULT_BENCHMARKS_DIR,
  { catalogPath = DEFAULT_CATALOG_PATH, newsPath = DEFAULT_NEWS_PATH } = {}
) {
  const isDefaultDir = path.resolve(dirPath || DEFAULT_BENCHMARKS_DIR) === path.resolve(DEFAULT_BENCHMARKS_DIR);
  const catalog = isDefaultDir || catalogPath !== DEFAULT_CATALOG_PATH
    ? loadCatalog(catalogPath)
    : { usdToCny: 7.25, updatedAt: '', priceSource: '', priceSourceUrl: '', models: [] };
  const catalogLookup = buildCatalogLookup(catalog);
  const benchmarks = loadBenchmarksFromDir(dirPath, catalogLookup);
  const newsIndex = isDefaultDir || newsPath !== DEFAULT_NEWS_PATH
    ? loadRelatedNewsIndex(newsPath)
    : [];
  const overview = buildOverviewMatrix(benchmarks, catalog, newsIndex);
  const ranked = overview.filter((r) => r.ranked);
  const unranked = overview.filter((r) => !r.ranked);
  const paretoFrontier = computeParetoFrontier(ranked);

  const activeBenchmarks = benchmarks.filter((b) => b.status !== 'reference');
  const scoringBenchmarks = activeBenchmarks.length ? activeBenchmarks : benchmarks;

  const domains = DOMAIN_DEFS.map((def) => {
    const domainBenches = scoringBenchmarks.filter((b) => b.domain === def.id);
    return {
      ...def,
      weightPct: Math.round(def.weight * 100),
      benchmarkCount: domainBenches.length,
      benchmarkIds: domainBenches.map((b) => b.id)
    };
  }).filter((d) => d.benchmarkCount > 0);

  const providerSet = new Set();
  overview.forEach((row) => {
    if (row.provider) providerSet.add(row.provider);
  });
  const providers = Array.from(providerSet).sort((a, b) => a.localeCompare(b, 'en'));

  const updatedDates = benchmarks
    .map((b) => b.updatedAt)
    .concat(catalog.updatedAt ? [catalog.updatedAt] : [])
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a));

  return {
    benchmarks,
    domains,
    overview,
    ranked,
    unranked,
    paretoFrontier,
    providers,
    usdToCny: catalog.usdToCny,
    priceSource: catalog.priceSource || 'OpenRouter',
    priceSourceUrl: catalog.priceSourceUrl || 'https://openrouter.ai/api/v1/models',
    totalBenchmarks: benchmarks.length,
    activeBenchmarkCount: scoringBenchmarks.length,
    totalModels: overview.length,
    rankedCount: ranked.length,
    unrankedCount: unranked.length,
    latestUpdatedAt: updatedDates[0] || ''
  };
}

if (typeof hexo !== 'undefined' && hexo.extend && hexo.extend.generator) {
  hexo.extend.generator.register('models-leaderboard', function () {
    const benchmarksDir = path.join(this.source_dir, '_data', 'benchmarks');
    const catalogPath = path.join(this.source_dir, '_data', 'models-catalog.json');
    const newsPath = path.join(this.source_dir, '_data', 'news.json');
    const modelsData = buildModelsPayload(benchmarksDir, { catalogPath, newsPath });

    // Strip relatedNews from main index payload to keep embedded JSON lean
    const boardPayload = {
      ...modelsData,
      overview: modelsData.overview.map(({ relatedNews, ...rest }) => rest),
      ranked: modelsData.ranked.map(({ relatedNews, ...rest }) => rest),
      unranked: modelsData.unranked.map(({ relatedNews, ...rest }) => rest)
    };

    const routes = [
      {
        path: 'models/index.html',
        layout: ['models'],
        data: {
          title: 'Models Leaderboard',
          modelsData: boardPayload
        }
      }
    ];

    for (const modelRow of modelsData.overview) {
      routes.push({
        path: `models/${modelRow.slug}/index.html`,
        layout: ['model-detail'],
        data: {
          title: `${modelRow.model} · Models Leaderboard`,
          modelDetail: modelRow,
          benchmarks: modelsData.benchmarks,
          domains: modelsData.domains,
          usdToCny: modelsData.usdToCny,
          latestUpdatedAt: modelsData.latestUpdatedAt,
          totalRanked: modelsData.rankedCount
        }
      });
    }

    return routes;
  });
}

module.exports = {
  DEFAULT_BENCHMARKS_DIR,
  DEFAULT_CATALOG_PATH,
  DEFAULT_NEWS_PATH,
  DOMAIN_DEFS,
  slugifyModel,
  stripVariantSuffix,
  inferDomain,
  computeBlendedUsd,
  computeParetoFrontier,
  normalizeEntry,
  normalizeBenchmark,
  loadCatalog,
  loadBenchmarksFromDir,
  computeNormalizedScore,
  buildOverviewMatrix,
  buildModelsPayload
};
