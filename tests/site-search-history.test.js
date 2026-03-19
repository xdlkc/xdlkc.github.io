const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const SiteSearch = require('../themes/evan/source/js/site-search.js');

const STORAGE_KEY = 'xdlkc:search-history';

function setupDom({ savedHistory = [], langMode = 'en' } = {}) {
  const dom = new JSDOM(
    `<!doctype html><html data-lang-mode="${langMode}">
      <body>
        <button data-site-search-trigger>Search</button>
        <div data-site-search-dialog>
          <div class="site-search-header">
            <input class="site-search-input" data-site-search-input type="search" />
            <button class="site-search-close" data-site-search-close type="button"></button>
          </div>
          <div class="site-search-body" data-site-search-scroll>
            <div class="site-search-hint"></div>
            <div class="site-search-results" data-site-search-results></div>
          </div>
        </div>
      </body>
    </html>`,
    { url: 'https://example.com/', runScripts: 'outside-only' }
  );

  global.window = dom.window;
  global.document = dom.window.document;
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      posts: [
        { title: 'Alpha', path: '2026/alpha/', tags: ['agent'] },
        { title: 'Beta', path: '2026/beta/', tags: ['misc'] }
      ]
    })
  });

  dom.window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedHistory));

  return dom;
}

function teardownDom() {
  delete global.window;
  delete global.document;
  delete global.fetch;
}

test('site-search-history: initial state with empty history', () => {
  const dom = setupDom({ savedHistory: [] });
  try {
    SiteSearch.initSiteSearch({ root: dom.window.document });

    const button = dom.window.document.querySelector('[data-site-search-trigger]');
    button.click();

    const history = dom.window.localStorage.getItem(STORAGE_KEY);
    assert.equal(history, '[]');

    const historySection = dom.window.document.querySelector('[data-site-search-history]');
    assert.equal(historySection, null, 'should not render history section when empty');
  } finally {
    teardownDom();
  }
});

test('site-search-history: search saves to history', async () => {
  const dom = setupDom({ savedHistory: [] });
  try {
    SiteSearch.initSiteSearch({ root: dom.window.document });

    const button = dom.window.document.querySelector('[data-site-search-trigger]');
    button.click();

    await new Promise((r) => setTimeout(r, 0));

    const input = dom.window.document.querySelector('[data-site-search-input]');
    input.value = 'test query';
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));

    await new Promise((r) => setTimeout(r, 300));

    const history = JSON.parse(dom.window.localStorage.getItem(STORAGE_KEY));
    assert.ok(Array.isArray(history));
    assert.equal(history.length, 1);
    assert.equal(history[0].query, 'test query');
    assert.ok(history[0].timestamp);
  } finally {
    teardownDom();
  }
});

test('site-search-history: empty query is not saved', async () => {
  const dom = setupDom({ savedHistory: [] });
  try {
    SiteSearch.initSiteSearch({ root: dom.window.document });

    const button = dom.window.document.querySelector('[data-site-search-trigger]');
    button.click();

    await new Promise((r) => setTimeout(r, 0));

    const input = dom.window.document.querySelector('[data-site-search-input]');
    input.value = '';
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));

    await new Promise((r) => setTimeout(r, 300));

    const history = JSON.parse(dom.window.localStorage.getItem(STORAGE_KEY));
    assert.equal(history.length, 0);
  } finally {
    teardownDom();
  }
});

test('site-search-history: duplicate query moves to top', async () => {
  const dom = setupDom({
    savedHistory: [
      { query: 'old query', timestamp: Date.now() - 100000 },
      { query: 'test query', timestamp: Date.now() - 50000 }
    ]
  });

  try {
    SiteSearch.initSiteSearch({ root: dom.window.document });

    const button = dom.window.document.querySelector('[data-site-search-trigger]');
    button.click();

    await new Promise((r) => setTimeout(r, 0));

    const input = dom.window.document.querySelector('[data-site-search-input]');
    input.value = 'test query';
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));

    await new Promise((r) => setTimeout(r, 300));

    const history = JSON.parse(dom.window.localStorage.getItem(STORAGE_KEY));
    assert.equal(history.length, 2);
    assert.equal(history[0].query, 'test query');
    assert.ok(history[0].timestamp > history[1].timestamp);
  } finally {
    teardownDom();
  }
});

test('site-search-history: maximum 10 records', async () => {
  const existing = [];
  const now = Date.now();
  for (let i = 0; i < 10; i++) {
    // Create entries in order: query 9 is oldest, query 0 is newest
    existing.push({ query: `query ${i}`, timestamp: now - (9 - i) * 1000 });
  }

  const dom = setupDom({ savedHistory: existing });
  try {
    SiteSearch.initSiteSearch({ root: dom.window.document });

    const button = dom.window.document.querySelector('[data-site-search-trigger]');
    button.click();

    await new Promise((r) => setTimeout(r, 0));

    const input = dom.window.document.querySelector('[data-site-search-input]');
    input.value = 'new query';
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));

    await new Promise((r) => setTimeout(r, 300));

    const history = JSON.parse(dom.window.localStorage.getItem(STORAGE_KEY));
    assert.equal(history.length, 10);
    assert.equal(history[0].query, 'new query');
    assert.equal(history[9].query, 'query 8'); // Oldest item should be query 8
  } finally {
    teardownDom();
  }
});

test('site-search-history: renders history items with clear button when history exists', async () => {
  const dom = setupDom({
    savedHistory: [
      { query: 'query 1', timestamp: Date.now() - 5000 },
      { query: 'query 2', timestamp: Date.now() - 10000 }
    ]
  });

  try {
    SiteSearch.initSiteSearch({ root: dom.window.document });

    const button = dom.window.document.querySelector('[data-site-search-trigger]');
    button.click();

    await new Promise((r) => setTimeout(r, 0));

    const historySection = dom.window.document.querySelector('[data-site-search-history]');
    assert.ok(historySection, 'should render history section');

    const title = historySection.querySelector('.site-search-suggest-title');
    assert.equal(title.textContent, 'Search history');

    const clearButton = historySection.querySelector('[data-site-search-history-clear]');
    assert.ok(clearButton, 'should render clear button');
    assert.equal(clearButton.textContent, 'Clear');
    assert.equal(clearButton.getAttribute('aria-label'), 'Clear search history');

    const historyItems = historySection.querySelectorAll('[data-site-search-history-item]');
    assert.equal(historyItems.length, 2);
    assert.equal(historyItems[0].textContent, 'query 1just now'); // Check relative time too
    assert.equal(historyItems[1].textContent, 'query 2just now'); // Check relative time too

  } finally {
    teardownDom();
  }
});

test('site-search-history: clear history removes all records and updates UI', async () => {
  const dom = setupDom({
    savedHistory: [
      { query: 'query 1', timestamp: Date.now() },
      { query: 'query 2', timestamp: Date.now() }
    ]
  });

  try {
    SiteSearch.initSiteSearch({ root: dom.window.document });

    const button = dom.window.document.querySelector('[data-site-search-trigger]');
    button.click();

    await new Promise((r) => setTimeout(r, 0));

    const clearButton = dom.window.document.querySelector('[data-site-search-history-clear]');
    assert.ok(clearButton, 'should have clear button');

    clearButton.click();
    await new Promise((r) => setTimeout(r, 0));

    const historyJson = dom.window.localStorage.getItem(STORAGE_KEY);
    const history = historyJson ? JSON.parse(historyJson) : [];
    assert.equal(history.length, 0);

    const historySection = dom.window.document.querySelector('[data-site-search-history]');
    assert.equal(historySection, null, 'history section should be removed from UI');
  } finally {
    teardownDom();
  }
});

test('site-search-history: click history item triggers search', async () => {
  const dom = setupDom({
    savedHistory: [
      { query: 'agent', timestamp: Date.now() }
    ]
  });

  try {
    SiteSearch.initSiteSearch({ root: dom.window.document });

    const button = dom.window.document.querySelector('[data-site-search-trigger]');
    button.click();

    await new Promise((r) => setTimeout(r, 0));

    const historyItem = dom.window.document.querySelector('[data-site-search-history-item]');
    assert.ok(historyItem, 'should have history item');

    historyItem.click();
    await new Promise((r) => setTimeout(r, 300));

    const input = dom.window.document.querySelector('[data-site-search-input]');
    assert.equal(input.value, 'agent');

    // Verify that search was triggered (either has results or empty state)
    const results = dom.window.document.querySelectorAll('.site-search-item');
    const empty = dom.window.document.querySelector('[data-site-search-empty]');
    assert.ok(results.length > 0 || empty, 'should trigger search and show results or empty state');
  } finally {
    teardownDom();
  }
});

test('site-search-history: internationalization for history section (zh)', async () => {
  const dom = setupDom({
    savedHistory: [
      { query: '测试', timestamp: Date.now() }
    ],
    langMode: 'zh'
  });

  try {
    SiteSearch.initSiteSearch({ root: dom.window.document });

    const button = dom.window.document.querySelector('[data-site-search-trigger]');
    button.click();

    await new Promise((r) => setTimeout(r, 0));

    const historySection = dom.window.document.querySelector('[data-site-search-history]');
    assert.ok(historySection, 'should render history section');

    const title = historySection.querySelector('.site-search-suggest-title');
    assert.equal(title.textContent, '搜索历史');

    const clearButton = historySection.querySelector('[data-site-search-history-clear]');
    assert.ok(clearButton, 'should render clear button');
    assert.equal(clearButton.textContent, '清空');
    assert.equal(clearButton.getAttribute('aria-label'), '清除搜索历史');

    const historyItems = historySection.querySelectorAll('[data-site-search-history-item]');
    assert.equal(historyItems.length, 1);
    assert.equal(historyItems[0].textContent, '测试刚刚');
  } finally {
    teardownDom();
  }
});

test('site-search-history: tag queries are saved', async () => {
  const dom = setupDom({ savedHistory: [] });
  try {
    SiteSearch.initSiteSearch({ root: dom.window.document });

    const button = dom.window.document.querySelector('[data-site-search-trigger]');
    button.click();

    await new Promise((r) => setTimeout(r, 0));

    const input = dom.window.document.querySelector('[data-site-search-input]');
    input.value = '#agent';
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));

    await new Promise((r) => setTimeout(r, 300));

    const history = JSON.parse(dom.window.localStorage.getItem(STORAGE_KEY));
    assert.equal(history.length, 1);
    assert.equal(history[0].query, '#agent');
  } finally {
    teardownDom();
  }
});

test('site-search-history: category queries are saved', async () => {
  const dom = setupDom({ savedHistory: [] });
  try {
    SiteSearch.initSiteSearch({ root: dom.window.document });

    const button = dom.window.document.querySelector('[data-site-search-trigger]');
    button.click();

    await new Promise((r) => setTimeout(r, 0));

    const input = dom.window.document.querySelector('[data-site-search-input]');
    input.value = 'cat:programming';
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));

    await new Promise((r) => setTimeout(r, 300));

    const history = JSON.parse(dom.window.localStorage.getItem(STORAGE_KEY));
    assert.equal(history.length, 1);
    assert.equal(history[0].query, 'cat:programming');
  } finally {
    teardownDom();
  }
});
