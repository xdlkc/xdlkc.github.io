#!/usr/bin/env node
/**
 * Syncs live public benchmark leaderboards into `source/_data/benchmarks/*.json`.
 *
 * Supported official live feeds:
 *   - SWE-bench Verified: https://raw.githubusercontent.com/swe-bench/swe-bench.github.io/master/data/leaderboards.json
 *   - LiveCodeBench:      https://livecodebench.github.io/performances_generation.json
 *
 * Usage:
 *   node tools/sync-benchmarks.js [--dry-run] [--bench=swe-bench-verified,livecodebench]
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const BENCH_DIR = path.resolve(__dirname, '..', 'source', '_data', 'benchmarks');
const CATALOG_PATH = path.resolve(__dirname, '..', 'source', '_data', 'models-catalog.json');

function inferProvider(modelName, rawOrg = '') {
  const s = `${rawOrg} ${modelName}`.toLowerCase();
  if (/anthropic|claude/.test(s)) return 'Anthropic';
  if (/openai|gpt|o1|o3|o4/.test(s)) return 'OpenAI';
  if (/google|gemini|deepmind|gemma/.test(s)) return 'Google';
  if (/deepseek/.test(s)) return 'DeepSeek';
  if (/qwen|alibaba/.test(s)) return 'Alibaba';
  if (/zhipu|glm/.test(s)) return 'Zhipu AI';
  if (/moonshot|kimi/.test(s)) return 'Moonshot AI';
  if (/minimax/.test(s)) return 'MiniMax';
  if (/bytedance|doubao/.test(s)) return 'ByteDance';
  if (/meta|llama|muse/.test(s)) return 'Meta';
  if (/xai|grok/.test(s)) return 'xAI';
  if (/nvidia|nemotron/.test(s)) return 'NVIDIA';
  if (/mistral/.test(s)) return 'Mistral AI';
  if (/lg|exaone/.test(s)) return 'LG AI';
  return rawOrg ? String(rawOrg).trim() : 'Community';
}

function inferOpenWeights(modelName) {
  const s = String(modelName || '').toLowerCase();
  return /deepseek|qwen|llama|gemma|nemotron|exaone|mistral|glm-4\.|glm-5|kimi-k2|minimax-m|oss/.test(s);
}

function inferReasoning(modelName) {
  const s = String(modelName || '').toLowerCase();
  return /\b(o1|o3|o4|r1)\b|reason|think|high|max|opus|pro|gpt-5|gpt-6|gemini-2\.5|gemini 3|gemini 4/.test(s);
}

async function syncSweBenchVerified() {
  const url = 'https://raw.githubusercontent.com/swe-bench/swe-bench.github.io/master/data/leaderboards.json';
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`SWE-bench HTTP ${res.status}`);
  const data = await res.json();
  const verified = (data.leaderboards || []).find((l) => l.name === 'Verified');
  if (!verified || !Array.isArray(verified.results)) {
    throw new Error('Verified leaderboard not found');
  }

  const bestByModel = new Map();
  for (const row of verified.results) {
    if (typeof row.resolved !== 'number') continue;
    const rawModel = String(row.model_display || row.name || '').trim();
    if (!rawModel || /^multiple$/i.test(rawModel)) continue;
    const key = rawModel.toLowerCase();
    const prev = bestByModel.get(key);
    if (!prev || row.resolved > prev.score) {
      bestByModel.set(key, {
        model: rawModel,
        provider: inferProvider(rawModel, row.model_org),
        openWeights: inferOpenWeights(rawModel),
        reasoning: inferReasoning(rawModel),
        score: Number(row.resolved.toFixed(1)),
        releaseDate: String(row.date || '').slice(0, 10) || new Date().toISOString().slice(0, 10),
        notes: row.agent ? `Agent: ${row.agent}` : undefined,
      });
    }
  }

  const entries = Array.from(bestByModel.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);

  const filePath = path.join(BENCH_DIR, 'swe-bench-verified.json');
  const existing = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : {};
  return {
    filePath,
    payload: {
      ...existing,
      id: 'swe-bench-verified',
      name: 'SWE-bench Verified',
      domain: 'coding',
      status: 'reference',
      category: '代码工程',
      description: '500 道经人工校验的真实 GitHub 仓库 Issue 修复任务，衡量端到端软件工程能力（自动同步官方 swebench.com 数据）。',
      unit: '%',
      higherIsBetter: true,
      sourceName: 'SWE-bench Official',
      sourceUrl: 'https://www.swebench.com/',
      updatedAt: new Date().toISOString().slice(0, 10),
      entries,
    },
  };
}

async function syncLiveCodeBench() {
  const url = 'https://livecodebench.github.io/performances_generation.json';
  const res = await fetch(url, { signal: AbortSignal.timeout(25000) });
  if (!res.ok) throw new Error(`LiveCodeBench HTTP ${res.status}`);
  const data = await res.json();
  const byModel = new Map();
  for (const row of data.performances || []) {
    const model = String(row.model || '').trim();
    if (!model) continue;
    const cur = byModel.get(model) || { sum: 0, count: 0 };
    cur.sum += Number(row['pass@1'] || 0);
    cur.count += 1;
    byModel.set(model, cur);
  }

  const entries = Array.from(byModel.entries())
    .filter(([, v]) => v.count >= 100)
    .map(([model, v]) => ({
      model,
      provider: inferProvider(model),
      openWeights: inferOpenWeights(model),
      reasoning: inferReasoning(model),
      score: Number((v.sum / v.count).toFixed(1)),
      releaseDate: new Date().toISOString().slice(0, 10),
      notes: `${v.count} problems evaluated`,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);

  const filePath = path.join(BENCH_DIR, 'livecodebench.json');
  const existing = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : {};
  return {
    filePath,
    payload: {
      ...existing,
      id: 'livecodebench',
      name: 'LiveCodeBench',
      domain: 'coding',
      status: 'reference',
      category: '竞赛编程',
      description: '持续更新的防数据污染算法竞赛题库（LeetCode / AtCoder / CodeForces），自动同步官方 livecodebench.github.io 数据。',
      unit: '%',
      higherIsBetter: true,
      sourceName: 'LiveCodeBench Official',
      sourceUrl: 'https://livecodebench.github.io/leaderboard.html',
      updatedAt: new Date().toISOString().slice(0, 10),
      entries,
    },
  };
}

async function syncOpenRouterCatalog() {
  if (!fs.existsSync(CATALOG_PATH)) {
    throw new Error('models-catalog.json not found');
  }
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  const res = await fetch('https://openrouter.ai/api/v1/models', { signal: AbortSignal.timeout(25000) });
  if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`);
  const data = await res.json();
  const byId = new Map((data.data || []).map((m) => [String(m.id || '').toLowerCase(), m]));

  let matched = 0;
  const models = (catalog.models || []).map((item) => {
    const orId = String(item.openRouterId || '').toLowerCase();
    const live = orId ? byId.get(orId) : null;
    if (!live) return item;
    matched += 1;

    const toPerMillion = (raw) => {
      const n = Number(raw);
      return Number.isFinite(n) && n >= 0 ? Number((n * 1e6).toFixed(4)) : null;
    };
    const input = toPerMillion(live.pricing?.prompt);
    const output = toPerMillion(live.pricing?.completion);
    const cacheRead = live.pricing?.input_cache_read !== undefined
      ? toPerMillion(live.pricing.input_cache_read)
      : (item.pricingUsd?.cacheRead ?? null);

    return {
      ...item,
      contextLength: Number(live.context_length) > 0 ? Number(live.context_length) : item.contextLength,
      pricingUsd: input !== null && output !== null
        ? { input, output, cacheRead }
        : item.pricingUsd
    };
  });

  return {
    filePath: CATALOG_PATH,
    matched,
    payload: {
      ...catalog,
      updatedAt: new Date().toISOString().slice(0, 10),
      models
    }
  };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const benchArg = args.find((a) => a.startsWith('--bench='));
  const wanted = benchArg ? new Set(benchArg.split('=')[1].split(',').map((s) => s.trim())) : null;

  const syncers = [
    ['swe-bench-verified', syncSweBenchVerified],
    ['livecodebench', syncLiveCodeBench],
  ];

  let updated = 0;
  for (const [id, fn] of syncers) {
    if (wanted && !wanted.has(id)) continue;
    try {
      const { filePath, payload } = await fn();
      console.log(`[sync-benchmarks] ${id}: fetched ${payload.entries.length} entries (top: ${payload.entries[0]?.model} = ${payload.entries[0]?.score}${payload.unit})`);
      if (!dryRun) {
        fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
        updated += 1;
      }
    } catch (err) {
      console.warn(`[sync-benchmarks] ${id} failed: ${err.message}`);
    }
  }

  if (!wanted || wanted.has('openrouter-catalog')) {
    try {
      const { filePath, matched, payload } = await syncOpenRouterCatalog();
      console.log(`[sync-benchmarks] openrouter-catalog: synced live pricing/context for ${matched}/${payload.models.length} catalog models`);
      if (!dryRun) {
        fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
        updated += 1;
      }
    } catch (err) {
      console.warn(`[sync-benchmarks] openrouter-catalog failed: ${err.message}`);
    }
  }
  console.log(`[sync-benchmarks] Done. Updated ${updated} files.`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[sync-benchmarks] Fatal:', err);
    process.exitCode = 1;
  });
}

module.exports = { syncSweBenchVerified, syncLiveCodeBench, syncOpenRouterCatalog, inferProvider };
