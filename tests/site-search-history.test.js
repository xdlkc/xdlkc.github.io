const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const SiteSearch = require('../themes/evan/source/js/site-search.js');

const STORAGE_KEY = 'xdlkc:search-history';

function setupDom({ savedHistory = [] } = {}) {
  const dom = new JSDOM(
    `<!doctype html><html>
      <body>
        <button data-site-search-trigger>Search</button>
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

test('site-search-history: clear history removes all records', async () => {
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
