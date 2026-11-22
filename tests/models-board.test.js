const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { JSDOM } = require('jsdom');

const ModelsGenerator = require('../scripts/models.js');
const AddBenchmark = require('../tools/add-benchmark.js');
const ModelsBoard = require('../themes/evan/source/js/models-board.js');
const LangToggle = require('../themes/evan/source/js/lang-toggle.js');

const ROOT = path.join(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test('Registry: loads all 5 initial benchmark JSON files and builds overview matrix', () => {
  const payload = ModelsGenerator.buildModelsPayload();

  assert.equal(payload.totalBenchmarks, 5);
  const ids = payload.benchmarks.map((b) => b.id).sort();
  assert.deepEqual(ids, [
    'arena-text',
    'gpqa-diamond',
    'livecodebench',
    'swe-bench-verified',
    'terminal-bench'
  ]);

  payload.benchmarks.forEach((bench) => {
    assert.ok(bench.name.length > 0, `Missing name for ${bench.id}`);
    assert.ok(bench.category.length > 0, `Missing category for ${bench.id}`);
    assert.ok(bench.unit.length > 0, `Missing unit for ${bench.id}`);
    assert.ok(bench.sourceName.length > 0, `Missing sourceName for ${bench.id}`);
    assert.ok(bench.updatedAt.length > 0, `Missing updatedAt for ${bench.id}`);
    assert.ok(bench.entries.length >= 8, `${bench.id} should have flagship entries`);
  });

  assert.ok(payload.totalModels >= 8);
  assert.ok(payload.providers.includes('Anthropic'));
  assert.ok(payload.providers.includes('OpenAI'));
  assert.ok(payload.providers.includes('DeepSeek'));
  assert.ok(payload.providers.includes('Google'));

  // Overview rows are sorted by avgNormalized descending
  for (let i = 1; i < payload.overview.length; i += 1) {
    assert.ok(
      payload.overview[i - 1].avgNormalized >= payload.overview[i].avgNormalized,
      'Overview should be sorted descending by avgNormalized'
    );
  }
});

test('Dynamic discovery: dropping a new benchmark JSON file is automatically picked up', () => {
  const tmpDir = makeTempDir('models-bench-dynamic-');
  try {
    // Copy one existing benchmark
    fs.copyFileSync(
      path.join(ROOT, 'source/_data/benchmarks/swe-bench-verified.json'),
      path.join(tmpDir, 'swe-bench-verified.json')
    );

    const before = ModelsGenerator.buildModelsPayload(tmpDir);
    assert.equal(before.totalBenchmarks, 1);

    // Drop a brand-new benchmark file (including higherIsBetter: false test)
    const customBench = {
      id: 'latency-bench',
      name: 'Latency Bench',
      category: '推理延迟',
      description: 'Time to first token in milliseconds.',
      unit: 'ms',
      higherIsBetter: false,
      sourceName: 'LatencyLab',
      sourceUrl: 'https://example.com/latency',
      updatedAt: '2026-11-22',
      entries: [
        { model: 'FastModel-X', provider: 'AcmeAI', openWeights: true, reasoning: false, score: 120, releaseDate: '2026-10' },
        { model: 'Claude Sonnet 4.5', provider: 'Anthropic', openWeights: false, reasoning: true, score: 240, releaseDate: '2026-09' }
      ]
    };
    fs.writeFileSync(path.join(tmpDir, 'latency-bench.json'), JSON.stringify(customBench, null, 2));

    const after = ModelsGenerator.buildModelsPayload(tmpDir);
    assert.equal(after.totalBenchmarks, 2);

    const latency = after.benchmarks.find((b) => b.id === 'latency-bench');
    assert.ok(latency, 'New benchmark should be discovered dynamically');
    assert.equal(latency.higherIsBetter, false);
    // Lower is better: FastModel-X (120) should rank before Claude Sonnet 4.5 (240)
    assert.equal(latency.entries[0].model, 'FastModel-X');
    assert.equal(latency.entries[1].model, 'Claude Sonnet 4.5');

    const fastRow = after.overview.find((r) => r.model === 'FastModel-X');
    assert.ok(fastRow, 'New model should appear in overview matrix');
    assert.equal(fastRow.scores['latency-bench'], 120);
    assert.equal(fastRow.normalizedScores['latency-bench'], 100);
    assert.ok(after.providers.includes('AcmeAI'));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('CLI helper: tools/add-benchmark.js scaffolds valid benchmark JSON and loads in registry', () => {
  const tmpDir = makeTempDir('models-bench-cli-');
  try {
    const cliPath = path.join(ROOT, 'tools', 'add-benchmark.js');
    execFileSync(process.execPath, [
      cliPath,
      '--id=pinchbench',
      '--name=PinchBench',
      '--category=Agent',
      '--unit=%',
      `--dir=${tmpDir}`
    ], { encoding: 'utf8' });

    const outPath = path.join(tmpDir, 'pinchbench.json');
    assert.ok(fs.existsSync(outPath), 'CLI should create pinchbench.json');

    const raw = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    assert.equal(raw.id, 'pinchbench');
    assert.equal(raw.name, 'PinchBench');
    assert.equal(raw.category, 'Agent');
    assert.equal(raw.unit, '%');
    assert.equal(raw.higherIsBetter, true);
    assert.ok(Array.isArray(raw.entries) && raw.entries.length >= 2);

    // Must be seamlessly loadable by scripts/models.js
    const payload = ModelsGenerator.buildModelsPayload(tmpDir);
    assert.equal(payload.totalBenchmarks, 1);
    assert.equal(payload.benchmarks[0].id, 'pinchbench');

    // Duplicate without --force throws
    assert.throws(() => {
      AddBenchmark.writeBenchmarkFile({ id: 'pinchbench', name: 'PinchBench', dir: tmpDir });
    }, /already exists/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

function buildBoardDom(payload) {
  const tabsHtml = [
    `<button type="button" role="tab" class="models-tab is-active" data-models-tab="overview" aria-selected="true">Overview</button>`,
    ...payload.benchmarks.map(
      (b) => `<button type="button" role="tab" class="models-tab" data-models-tab="${b.id}" aria-selected="false">${b.name}</button>`
    )
  ].join('');

  const providerOptions = [
    '<option value="all">All Providers</option>',
    ...payload.providers.map((p) => `<option value="${p}">${p}</option>`)
  ].join('');

  return new JSDOM(`<!doctype html>
  <html data-lang-mode="en">
    <body>
      <main data-models-board>
        <div data-models-tabs>${tabsHtml}</div>
        <section data-models-meta>
          <p data-models-meta-desc></p>
          <div data-models-meta-badges></div>
        </section>
        <section data-models-toolbar>
          <button type="button" data-models-license="all" aria-pressed="true" class="is-active">All</button>
          <button type="button" data-models-license="open" aria-pressed="false">Open</button>
          <button type="button" data-models-license="closed" aria-pressed="false">Closed</button>
          <button type="button" data-models-reasoning aria-pressed="false">Reasoning</button>
          <select data-models-provider>${providerOptions}</select>
          <input type="search" data-models-search />
          <span data-models-status></span>
        </section>
        <table data-models-table>
          <thead data-models-thead></thead>
          <tbody data-models-tbody></tbody>
        </table>
        <div data-models-empty hidden>
          <button type="button" data-models-reset>Reset</button>
        </div>
      </main>
      <script id="models-board-data" type="application/json">${JSON.stringify(payload)}</script>
    </body>
  </html>`, { url: 'https://example.com/models/' });
}

test('UI controller: supports tab switching, license/reasoning/provider/search filtering, and sorting', () => {
  const payload = ModelsGenerator.buildModelsPayload();
  const dom = buildBoardDom(payload);
  const doc = dom.window.document;

  const ctrl = ModelsBoard.initModelsBoard({ root: doc });
  assert.ok(ctrl, 'Controller should initialize');

  // Initial overview renders all models
  const getVisibleModels = () =>
    Array.from(doc.querySelectorAll('[data-models-tbody] tr')).map((tr) => tr.getAttribute('data-model-row'));

  assert.equal(getVisibleModels().length, payload.totalModels);

  // Filter: Open Weights only
  doc.querySelector('[data-models-license="open"]').click();
  const openModels = getVisibleModels();
  assert.ok(openModels.length > 0 && openModels.length < payload.totalModels);
  openModels.forEach((name) => {
    const row = payload.overview.find((r) => r.model === name);
    assert.equal(row.openWeights, true, `${name} should be openWeights`);
  });

  // Filter: Open Weights + Reasoning
  doc.querySelector('[data-models-reasoning]').click();
  const openReasoning = getVisibleModels();
  assert.ok(openReasoning.length > 0);
  openReasoning.forEach((name) => {
    const row = payload.overview.find((r) => r.model === name);
    assert.equal(row.openWeights, true);
    assert.equal(row.reasoning, true);
  });

  // Reset filters via Reset button
  doc.querySelector('[data-models-reset]').click();
  assert.equal(getVisibleModels().length, payload.totalModels);

  // Filter by provider = Anthropic
  const providerSelect = doc.querySelector('[data-models-provider]');
  providerSelect.value = 'Anthropic';
  providerSelect.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  const anthropicModels = getVisibleModels();
  assert.ok(anthropicModels.length >= 2);
  anthropicModels.forEach((name) => {
    assert.match(name, /Claude/);
  });

  // Search filter
  doc.querySelector('[data-models-reset]').click();
  const searchInput = doc.querySelector('[data-models-search]');
  searchInput.value = 'deepseek';
  searchInput.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  const deepseekModels = getVisibleModels();
  assert.ok(deepseekModels.length >= 2);
  deepseekModels.forEach((name) => {
    assert.match(name.toLowerCase(), /deepseek/);
  });

  // Empty state when no match
  searchInput.value = 'nonexistent-xyz-model';
  searchInput.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  assert.equal(getVisibleModels().length, 0);
  assert.equal(doc.querySelector('[data-models-empty]').hidden, false);

  // Reset and test sorting on Overview
  doc.querySelector('[data-models-reset]').click();
  const sweSortBtn = doc.querySelector('[data-sort-key="bench:swe-bench-verified"]');
  sweSortBtn.click();
  assert.equal(getVisibleModels()[0], 'Claude Sonnet 4.5');

  // Toggle to ascending
  doc.querySelector('[data-sort-key="bench:swe-bench-verified"]').click();
  assert.equal(getVisibleModels()[0], 'Llama 4 Maverick');

  // Switch to individual benchmark tab (SWE-bench Verified)
  doc.querySelector('[data-models-tab="swe-bench-verified"]').click();
  assert.equal(ctrl.state.activeTab, 'swe-bench-verified');
  assert.equal(getVisibleModels()[0], 'Claude Sonnet 4.5');
  assert.match(doc.querySelector('[data-models-meta-badges]').textContent, /SWE-bench/);

  // Sort by score ascending in single benchmark view
  doc.querySelector('[data-sort-key="score"]').click();
  assert.equal(getVisibleModels()[0], 'Llama 4 Maverick');
});

test('Navbar & i18n: header includes Models link and all models.ejs i18n keys exist in LangToggle.DICT', () => {
  const header = read('themes/evan/layout/_partial/header.ejs');
  assert.match(header, /data-i18n-key="nav\.models"/);
  assert.match(header, /_rawPath\.startsWith\('models\/'\)/);

  // Models link appears right after News link
  const newsIdx = header.indexOf('data-i18n-key="nav.news"');
  const modelsIdx = header.indexOf('data-i18n-key="nav.models"');
  const aboutIdx = header.indexOf('data-i18n-key="nav.about"');
  assert.ok(newsIdx !== -1 && modelsIdx > newsIdx && modelsIdx < aboutIdx);

  assert.equal(LangToggle.DICT['nav.models'].en, 'Models');
  assert.equal(LangToggle.DICT['nav.models'].zh, '模型榜');

  const modelsTemplate = read('themes/evan/layout/models.ejs');
  const keys = [
    ...[...modelsTemplate.matchAll(/data-i18n-key="([^"]+)"/g)].map((m) => m[1]),
    ...[...modelsTemplate.matchAll(/data-i18n-placeholder-key="([^"]+)"/g)].map((m) => m[1])
  ];
  assert.ok(keys.length > 0);
  keys.forEach((key) => {
    const entry = LangToggle.DICT[key];
    assert.ok(entry, `Missing LangToggle.DICT entry for "${key}"`);
    assert.ok(entry.en && entry.en.trim().length > 0, `Empty EN entry for "${key}"`);
    assert.ok(entry.zh && entry.zh.trim().length > 0, `Empty ZH entry for "${key}"`);
  });
});
