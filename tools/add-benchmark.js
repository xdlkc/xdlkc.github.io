#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_BENCHMARKS_DIR = path.join(__dirname, '..', 'source', '_data', 'benchmarks');

function slugifyId(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseBoolean(value, fallback = true) {
  if (typeof value === 'boolean') return value;
  if (value === undefined || value === null || value === '') return fallback;
  const v = String(value).trim().toLowerCase();
  if (v === 'false' || v === '0' || v === 'no') return false;
  if (v === 'true' || v === '1' || v === 'yes') return true;
  return fallback;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token || !token.startsWith('--')) continue;
    const eqIndex = token.indexOf('=');
    if (eqIndex !== -1) {
      const key = token.slice(2, eqIndex).trim();
      const val = token.slice(eqIndex + 1);
      args[key] = val;
    } else {
      const key = token.slice(2).trim();
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        args[key] = next;
        i += 1;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

function formatToday() {
  return new Date().toISOString().slice(0, 10);
}

function scaffoldBenchmark(options = {}) {
  const id = slugifyId(options.id || options.name);
  if (!id) {
    throw new Error('Missing required --id (e.g. --id=pinchbench)');
  }
  const name = String(options.name || id).trim();
  const category = String(options.category || '综合评测').trim();
  const unit = String(options.unit || '%').trim();
  const higherIsBetter = parseBoolean(
    options['higher-is-better'] ?? options.higherIsBetter,
    true
  );
  const description = String(
    options.description || `${name} benchmark leaderboard tracking frontier AI models.`
  ).trim();
  const sourceName = String(options['source-name'] ?? options.sourceName ?? name).trim();
  const sourceUrl = String(options['source-url'] ?? options.sourceUrl ?? '').trim();
  const updatedAt = String(options['updated-at'] ?? options.updatedAt ?? formatToday()).trim();

  return {
    id,
    name,
    category,
    description,
    unit,
    higherIsBetter,
    sourceName,
    sourceUrl,
    updatedAt,
    entries: [
      {
        model: 'Claude Sonnet 4.5',
        provider: 'Anthropic',
        openWeights: false,
        reasoning: true,
        score: unit === 'Elo' ? 1400 : 75.0,
        releaseDate: updatedAt.slice(0, 7),
        notes: 'Replace with verified score'
      },
      {
        model: 'DeepSeek-R1-0528',
        provider: 'DeepSeek',
        openWeights: true,
        reasoning: true,
        score: unit === 'Elo' ? 1380 : 70.0,
        releaseDate: updatedAt.slice(0, 7),
        notes: 'Replace with verified score'
      }
    ]
  };
}

function writeBenchmarkFile(options = {}) {
  const bench = scaffoldBenchmark(options);
  const targetDir = options.dir ? path.resolve(options.dir) : DEFAULT_BENCHMARKS_DIR;
  fs.mkdirSync(targetDir, { recursive: true });

  const filePath = path.join(targetDir, `${bench.id}.json`);
  const force = parseBoolean(options.force, false);
  if (fs.existsSync(filePath) && !force) {
    throw new Error(`Benchmark file already exists: ${filePath} (pass --force to overwrite)`);
  }

  fs.writeFileSync(filePath, `${JSON.stringify(bench, null, 2)}\n`, 'utf8');
  return { filePath, benchmark: bench };
}

function printUsage() {
  console.log([
    'Usage:',
    '  node tools/add-benchmark.js --id=<slug> --name="<Name>" --category="<Category>" --unit="%"',
    '',
    'Options:',
    '  --id                Required benchmark slug (filename: <id>.json)',
    '  --name              Display name (defaults to --id)',
    '  --category          Category badge label (default: 综合评测)',
    '  --unit              Score unit, e.g. "%", "Elo", "pts" (default: "%")',
    '  --higher-is-better  true|false (default: true)',
    '  --description       Short benchmark description',
    '  --source-name       Attribution source name',
    '  --source-url        Attribution URL',
    '  --dir               Custom output directory (default: source/_data/benchmarks)',
    '  --force             Overwrite existing file if present'
  ].join('\n'));
}

if (require.main === module) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h || (!args.id && !args.name)) {
    printUsage();
    process.exit(args.help || args.h ? 0 : 1);
  }

  try {
    const { filePath, benchmark } = writeBenchmarkFile(args);
    console.log(`Created benchmark "${benchmark.name}" -> ${filePath}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

module.exports = {
  DEFAULT_BENCHMARKS_DIR,
  slugifyId,
  parseArgs,
  scaffoldBenchmark,
  writeBenchmarkFile
};
