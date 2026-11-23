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

test('Registry: loads all 10 benchmarks across 5 domains, gates unranked models, and computes Pareto frontier', () => {
  const payload = ModelsGenerator.buildModelsPayload();

  assert.equal(payload.totalBenchmarks, 10);
  const ids = payload.benchmarks.map((b) => b.id).sort();
  assert.deepEqual(ids, [
    'arc-agi-2',
    'arena-text',
    'frontier-code',
    'gdpval-aa',
    'gpqa-diamond',
    'hle',
    'livecodebench',
    'simpleqa-verified',
    'swe-bench-verified',
    'terminal-bench'
  ]);

  // All 5 domains must be active
  assert.deepEqual(
    payload.domains.map((d) => d.id),
    ['coding', 'reasoning', 'professional', 'knowledge', 'arena']
  );

  // Ranked models must cover >= 3 benchmarks & >= 2 domains (no single-bench 100.0 distortion)
  assert.ok(payload.rankedCount >= 20);
  assert.ok(payload.unrankedCount >= 1);
  payload.ranked.forEach((row, idx) => {
    assert.equal(row.ranked, true);
    assert.equal(row.rank, idx + 1);
    assert.ok(row.benchCount >= 3, `${row.model} should cover >=3 benchmarks`);
    assert.ok(row.coveredDomains >= 2, `${row.model} should cover >=2 domains`);
    if (idx > 0) {
      assert.ok(
        payload.ranked[idx - 1].compositeScore >= row.compositeScore,
        'Ranked models should be sorted descending by compositeScore'
      );
    }
  });

  // Pareto frontier must have strictly increasing price and score
  assert.ok(payload.paretoFrontier.length >= 4);
  for (let i = 1; i < payload.paretoFrontier.length; i += 1) {
    assert.ok(payload.paretoFrontier[i].blendedUsd > payload.paretoFrontier[i - 1].blendedUsd);
    assert.ok(payload.paretoFrontier[i].compositeScore > payload.paretoFrontier[i - 1].compositeScore);
  }
});

test('Dynamic discovery: dropping a new benchmark JSON file is automatically picked up', () => {
  const tmpDir = makeTempDir('models-bench-dynamic-');
  try {
    fs.copyFileSync(
      path.join(ROOT, 'source/_data/benchmarks/swe-bench-verified.json'),
      path.join(tmpDir, 'swe-bench-verified.json')
    );

    const before = ModelsGenerator.buildModelsPayload(tmpDir);
    assert.equal(before.totalBenchmarks, 1);

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

    const payload = ModelsGenerator.buildModelsPayload(tmpDir);
    assert.equal(payload.totalBenchmarks, 1);
    assert.equal(payload.benchmarks[0].id, 'pinchbench');

    assert.throws(() => {
      AddBenchmark.writeBenchmarkFile({ id: 'pinchbench', name: 'PinchBench', dir: tmpDir });
    }, /already exists/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

function buildBoardDom(payload) {
  const domainTabsHtml = [
    `<button type="button" role="tab" class="models-tab is-active" data-models-tab="overview" aria-selected="true">Composite</button>`,
    ...payload.domains.map(
      (d) => `<button type="button" role="tab" class="models-tab" data-models-tab="domain:${d.id}" aria-selected="false"><span data-domain-label="${d.id}">${d.labelZh}</span></button>`
    )
  ].join('');

  const benchPillsHtml = payload.benchmarks
    .map((b) => `<button type="button" role="tab" class="models-bench-pill" data-models-tab="${b.id}" aria-selected="false">${b.name}</button>`)
    .join('');

  const providerOptions = [
    '<option value="all">All Providers</option>',
    ...payload.providers.map((p) => `<option value="${p}">${p}</option>`)
  ].join('');

  return new JSDOM(`<!doctype html>
  <html data-lang-mode="zh">
    <body>
      <main data-models-board>
        <div data-models-views>
          <button type="button" data-models-view="leaderboard" class="is-active" aria-selected="true">榜单</button>
          <button type="button" data-models-view="pricing" aria-selected="false">价格</button>
          <button type="button" data-models-view="frontier" aria-selected="false">斩杀线</button>
        </div>
        <div data-models-currency-group>
          <button type="button" data-models-currency="cny" class="is-active" aria-pressed="true">¥ RMB</button>
          <button type="button" data-models-currency="usd" aria-pressed="false">$ USD</button>
        </div>
        <div data-models-tabs-wrap>
          <div data-models-tabs>${domainTabsHtml}</div>
          <div data-models-bench-pills>${benchPillsHtml}</div>
        </div>
        <section data-models-meta>
          <p data-models-meta-desc></p>
          <div data-models-meta-badges></div>
        </section>
        <section data-models-toolbar>
          <button type="button" data-models-license="all" aria-pressed="true" class="is-active">All</button>
          <button type="button" data-models-license="open" aria-pressed="false">Open</button>
          <button type="button" data-models-license="closed" aria-pressed="false">Closed</button>
          <button type="button" data-models-domestic aria-pressed="false">Domestic</button>
          <button type="button" data-models-reasoning aria-pressed="false">Reasoning</button>
          <select data-models-provider>${providerOptions}</select>
          <input type="search" data-models-search />
          <span data-models-status></span>
        </section>
        <section data-models-table-section>
          <table data-models-table>
            <thead data-models-thead></thead>
            <tbody data-models-tbody></tbody>
          </table>
          <div data-models-empty hidden>
            <button type="button" data-models-reset>Reset</button>
          </div>
        </section>
        <section data-models-frontier-section hidden>
          <span data-models-frontier-unit></span>
          <div data-models-frontier-chart></div>
          <div data-models-frontier-steps></div>
        </section>
        <p data-models-calibration-note></p>
        <details data-models-unranked-wrap>
          <span data-models-unranked-count></span>
          <table><tbody data-models-unranked-tbody></tbody></table>
        </details>
      </main>
      <script id="models-board-data" type="application/json">${JSON.stringify(payload)}</script>
    </body>
  </html>`, { url: 'https://example.com/models/' });
}

test('UI controller: 3 views, currency toggle, domestic/open/provider/search filters, domain & single-bench tabs', () => {
  const payload = ModelsGenerator.buildModelsPayload();
  const dom = buildBoardDom(payload);
  const doc = dom.window.document;

  const ctrl = ModelsBoard.initModelsBoard({ root: doc });
  assert.ok(ctrl, 'Controller should initialize');

  const getVisibleModels = () =>
    Array.from(doc.querySelectorAll('[data-models-tbody] tr')).map((tr) => tr.getAttribute('data-model-row'));

  // Initial overview renders all ranked models
  assert.equal(getVisibleModels().length, payload.rankedCount);
  assert.equal(getVisibleModels()[0], payload.ranked[0].model);

  // Currency toggle: CNY -> USD updates rendered prices
  assert.match(doc.querySelector('[data-models-tbody]').textContent, /¥/);
  doc.querySelector('[data-models-currency="usd"]').click();
  assert.equal(ctrl.state.currency, 'usd');
  assert.match(doc.querySelector('[data-models-tbody]').textContent, /\$/);
  doc.querySelector('[data-models-currency="cny"]').click();
  assert.equal(ctrl.state.currency, 'cny');

  // Domestic (CN) filter
  doc.querySelector('[data-models-domestic]').click();
  const domesticModels = getVisibleModels();
  assert.ok(domesticModels.length >= 6);
  domesticModels.forEach((name) => {
    const row = payload.ranked.find((r) => r.model === name);
    assert.equal(row.domestic, true, `${name} should be domestic`);
  });

  // Reset filters
  doc.querySelector('[data-models-reset]').click();
  assert.equal(getVisibleModels().length, payload.rankedCount);

  // Open Weights filter
  doc.querySelector('[data-models-license="open"]').click();
  const openModels = getVisibleModels();
  assert.ok(openModels.length >= 5);
  openModels.forEach((name) => {
    const row = payload.ranked.find((r) => r.model === name);
    assert.equal(row.openWeights, true, `${name} should be openWeights`);
  });

  // Pricing view
  doc.querySelector('[data-models-reset]').click();
  doc.querySelector('[data-models-view="pricing"]').click();
  assert.equal(ctrl.state.viewMode, 'pricing');
  assert.equal(doc.querySelector('[data-models-tabs-wrap]').hidden, true);
  assert.ok(getVisibleModels().length >= 20);

  // Frontier (Pareto) view
  doc.querySelector('[data-models-view="frontier"]').click();
  assert.equal(ctrl.state.viewMode, 'frontier');
  assert.equal(doc.querySelector('[data-models-frontier-section]').hidden, false);
  assert.ok(doc.querySelector('[data-models-frontier-chart] svg'), 'Should render Pareto SVG');
  assert.ok(doc.querySelectorAll('.frontier-step-card').length >= 4);

  // Switch to Coding domain tab (must only include ranked models, no unranked legacy SWE-bench/LiveCodeBench pollution)
  doc.querySelector('[data-models-tab="domain:coding"]').click();
  assert.equal(ctrl.state.viewMode, 'leaderboard');
  assert.equal(ctrl.state.activeTab, 'domain:coding');
  const codingVisible = getVisibleModels();
  assert.ok(codingVisible.length >= 20 && codingVisible.length <= payload.rankedCount);
  assert.equal(codingVisible[0], 'Claude Fable 5.2');
  assert.ok(!codingVisible.includes('O4-Mini'), 'Unranked legacy O4-Mini must not pollute Coding domain');
  assert.ok(!codingVisible.includes('Claude 4.5 Opus'), 'Unranked legacy Claude 4.5 Opus must not pollute Coding domain');

  // Switch to individual benchmark tab (SWE-bench Verified)
  const sweBench = payload.benchmarks.find((b) => b.id === 'swe-bench-verified');
  const sweSortedDesc = [...sweBench.entries].sort((a, b) => b.score - a.score);
  doc.querySelector('[data-models-tab="swe-bench-verified"]').click();
  assert.equal(ctrl.state.activeTab, 'swe-bench-verified');
  assert.equal(getVisibleModels()[0], sweSortedDesc[0].model);
  assert.match(doc.querySelector('[data-models-meta-badges]').textContent, /SWE-bench/);

  // Sort ascending in single benchmark view
  doc.querySelector('[data-sort-key="score"]').click();
  assert.equal(getVisibleModels()[0], sweSortedDesc[sweSortedDesc.length - 1].model);
});

test('Navbar & i18n: header includes Models link and all models.ejs + model-detail.ejs i18n keys exist in LangToggle.DICT', () => {
  const header = read('themes/evan/layout/_partial/header.ejs');
  assert.match(header, /data-i18n-key="nav\.models"/);
  assert.match(header, /_rawPath\.startsWith\('models\/'\)/);

  const templates = [
    read('themes/evan/layout/models.ejs'),
    read('themes/evan/layout/model-detail.ejs')
  ];
  const keys = templates.flatMap((tpl) => [
    ...[...tpl.matchAll(/data-i18n-key="([^"]+)"/g)].map((m) => m[1]),
    ...[...tpl.matchAll(/data-i18n-placeholder-key="([^"]+)"/g)].map((m) => m[1])
  ]);
  assert.ok(keys.length > 0);
  keys.forEach((key) => {
    const entry = LangToggle.DICT[key];
    assert.ok(entry, `Missing LangToggle.DICT entry for "${key}"`);
    assert.ok(entry.en && entry.en.trim().length > 0, `Empty EN entry for "${key}"`);
    assert.ok(entry.zh && entry.zh.trim().length > 0, `Empty ZH entry for "${key}"`);
  });
});
