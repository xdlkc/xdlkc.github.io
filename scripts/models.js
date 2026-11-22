'use strict';

const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_BENCHMARKS_DIR = path.join(__dirname, '..', 'source', '_data', 'benchmarks');

function round1(value) {
  return Math.round(value * 10) / 10;
}

function normalizeEntry(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const model = String(raw.model || '').trim();
  const score = Number(raw.score);
  if (!model || !Number.isFinite(score)) return null;

  return {
    model,
    provider: String(raw.provider || 'Unknown').trim() || 'Unknown',
    openWeights: Boolean(raw.openWeights),
    reasoning: Boolean(raw.reasoning),
    score,
    releaseDate: raw.releaseDate ? String(raw.releaseDate).trim() : '',
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

function normalizeBenchmark(raw, fallbackId = '') {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id || fallbackId || '').trim();
  if (!id) return null;

  const higherIsBetter = raw.higherIsBetter !== false;
  const rawEntries = Array.isArray(raw.entries) ? raw.entries : [];
  const entries = sortEntries(
    rawEntries.map(normalizeEntry).filter(Boolean),
    higherIsBetter
  );

  const scores = entries.map((e) => e.score);
  const maxScore = scores.length ? Math.max(...scores) : 0;
  const minScore = scores.length ? Math.min(...scores) : 0;

  return {
    id,
    name: String(raw.name || id).trim(),
    category: String(raw.category || 'Benchmark').trim(),
    description: String(raw.description || '').trim(),
    unit: String(raw.unit || '%').trim(),
    higherIsBetter,
    sourceName: String(raw.sourceName || '').trim(),
    sourceUrl: String(raw.sourceUrl || '').trim(),
    updatedAt: String(raw.updatedAt || '').trim(),
    maxScore,
    minScore,
    entries
  };
}

function loadBenchmarksFromDir(dirPath = DEFAULT_BENCHMARKS_DIR) {
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
      const normalized = normalizeBenchmark(parsed, fallbackId);
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
  const { maxScore, minScore, higherIsBetter } = benchmark;
  if (!Number.isFinite(score)) return 0;

  if (higherIsBetter) {
    if (maxScore <= 0) return 0;
    return round1(Math.max(0, Math.min(100, (score / maxScore) * 100)));
  }

  // Lower is better: best (lowest) score gets 100
  if (score <= 0) return minScore <= 0 ? 100 : 0;
  if (minScore <= 0) return 0;
  return round1(Math.max(0, Math.min(100, (minScore / score) * 100)));
}

function buildOverviewMatrix(benchmarks) {
  const modelMap = new Map();

  for (const bench of benchmarks) {
    for (const entry of bench.entries) {
      const key = entry.model.toLowerCase();
      let record = modelMap.get(key);
      if (!record) {
        record = {
          model: entry.model,
          provider: entry.provider,
          openWeights: entry.openWeights,
          reasoning: entry.reasoning,
          releaseDate: entry.releaseDate,
          scores: {},
          normalizedScores: {},
          benchCount: 0,
          avgNormalized: 0
        };
        modelMap.set(key, record);
      } else {
        if (!record.releaseDate && entry.releaseDate) {
          record.releaseDate = entry.releaseDate;
        }
        if (entry.openWeights) record.openWeights = true;
        if (entry.reasoning) record.reasoning = true;
      }

      record.scores[bench.id] = entry.score;
      record.normalizedScores[bench.id] = computeNormalizedScore(entry.score, bench);
    }
  }

  const rows = Array.from(modelMap.values()).map((row) => {
    const normValues = Object.values(row.normalizedScores);
    const benchCount = normValues.length;
    const avgNormalized = benchCount
      ? round1(normValues.reduce((sum, v) => sum + v, 0) / benchCount)
      : 0;
    return {
      ...row,
      benchCount,
      avgNormalized
    };
  });

  rows.sort((a, b) => {
    if (b.avgNormalized !== a.avgNormalized) return b.avgNormalized - a.avgNormalized;
    if (b.benchCount !== a.benchCount) return b.benchCount - a.benchCount;
    return a.model.localeCompare(b.model, 'en');
  });

  return rows;
}

function buildModelsPayload(dirPath = DEFAULT_BENCHMARKS_DIR) {
  const benchmarks = loadBenchmarksFromDir(dirPath);
  const overview = buildOverviewMatrix(benchmarks);

  const providerSet = new Set();
  overview.forEach((row) => {
    if (row.provider) providerSet.add(row.provider);
  });
  const providers = Array.from(providerSet).sort((a, b) => a.localeCompare(b, 'en'));

  const updatedDates = benchmarks
    .map((b) => b.updatedAt)
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a));

  return {
    benchmarks,
    overview,
    providers,
    totalBenchmarks: benchmarks.length,
    totalModels: overview.length,
    latestUpdatedAt: updatedDates[0] || ''
  };
}

if (typeof hexo !== 'undefined' && hexo.extend && hexo.extend.generator) {
  hexo.extend.generator.register('models-leaderboard', function () {
    const benchmarksDir = path.join(this.source_dir, '_data', 'benchmarks');
    const modelsData = buildModelsPayload(benchmarksDir);

    return {
      path: 'models/index.html',
      layout: ['models'],
      data: {
        title: 'Models Leaderboard',
        modelsData
      }
    };
  });
}

module.exports = {
  DEFAULT_BENCHMARKS_DIR,
  normalizeEntry,
  normalizeBenchmark,
  loadBenchmarksFromDir,
  computeNormalizedScore,
  buildOverviewMatrix,
  buildModelsPayload
};
