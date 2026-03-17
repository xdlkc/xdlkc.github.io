const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

test('ArchiveYearCollapsible: injects collapse button for each year', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <section class="archive-card">
      <h1>Archives</h1>
      <div class="archive-year">
        <h2>2026</h2>
        <article class="archive-item">
          <time>2026-03-17</time>
          <a href="/post1">Post 1</a>
        </article>
      </div>
      <div class="archive-year">
        <h2>2025</h2>
        <article class="archive-item">
          <time>2025-12-25</time>
          <a href="/post2">Post 2</a>
        </article>
      </div>
    </section>
  </body></html>`, {
    url: 'https://example.com/archives/',
    runScripts: 'outside-only'
  });

  global.window = dom.window;
  global.document = dom.window.document;

  const ArchiveYearCollapsible = require('../themes/evan/source/js/archive-year-collapsible.js');
  ArchiveYearCollapsible.initArchiveYearCollapsible({ root: document });

  const year1Header = document.querySelector('.archive-year:nth-child(2) h2');
  const year2Header = document.querySelector('.archive-year:nth-child(3) h2');

  const btn1 = year1Header.querySelector('.archive-year-collapse-btn');
  const btn2 = year2Header.querySelector('.archive-year-collapse-btn');

  assert.ok(btn1, 'First year should have collapse button');
  assert.ok(btn2, 'Second year should have collapse button');
  assert.equal(btn1.getAttribute('type'), 'button');
  assert.equal(btn2.getAttribute('type'), 'button');

  delete global.window;
  delete global.document;
});

test('ArchiveYearCollapsible: button toggles year visibility', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <section class="archive-card">
      <div class="archive-year">
        <h2>2026</h2>
        <article class="archive-item">
          <time>2026-03-17</time>
          <a href="/post1">Post 1</a>
        </article>
      </div>
    </section>
  </body></html>`, {
    url: 'https://example.com/archives/',
    runScripts: 'outside-only'
  });

  global.window = dom.window;
  global.document = dom.window.document;

  const ArchiveYearCollapsible = require('../themes/evan/source/js/archive-year-collapsible.js');
  ArchiveYearCollapsible.initArchiveYearCollapsible({ root: document });

  const yearDiv = document.querySelector('.archive-year');
  const btn = yearDiv.querySelector('.archive-year-collapse-btn');

  // Initially expanded
  assert.equal(yearDiv.classList.contains('is-collapsed'), false);

  // Click to collapse
  btn.click();
  assert.equal(yearDiv.classList.contains('is-collapsed'), true);

  // Click again to expand
  btn.click();
  assert.equal(yearDiv.classList.contains('is-collapsed'), false);

  delete global.window;
  delete global.document;
});

test('ArchiveYearCollapsible: button aria-expanded updates correctly', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <section class="archive-card">
      <div class="archive-year">
        <h2>2026</h2>
        <article class="archive-item">
          <time>2026-03-17</time>
          <a href="/post1">Post 1</a>
        </article>
      </div>
    </section>
  </body></html>`, {
    url: 'https://example.com/archives/',
    runScripts: 'outside-only'
  });

  global.window = dom.window;
  global.document = dom.window.document;

  const ArchiveYearCollapsible = require('../themes/evan/source/js/archive-year-collapsible.js');
  ArchiveYearCollapsible.initArchiveYearCollapsible({ root: document });

  const yearDiv = document.querySelector('.archive-year');
  const btn = yearDiv.querySelector('.archive-year-collapse-btn');

  // Initially expanded
  assert.equal(btn.getAttribute('aria-expanded'), 'true');

  // Click to collapse
  btn.click();
  assert.equal(btn.getAttribute('aria-expanded'), 'false');

  // Click again to expand
  btn.click();
  assert.equal(btn.getAttribute('aria-expanded'), 'true');

  delete global.window;
  delete global.document;
});

test('ArchiveYearCollapsible: persists collapsed state to localStorage', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <section class="archive-card">
      <div class="archive-year">
        <h2>2026</h2>
        <article class="archive-item">
          <time>2026-03-17</time>
          <a href="/post1">Post 1</a>
        </article>
      </div>
    </section>
  </body></html>`, {
    url: 'https://example.com/archives/',
    runScripts: 'outside-only'
  });

  global.window = dom.window;
  global.document = dom.window.document;

  const storage = new dom.window.Storage();
  global.localStorage = storage;

  const ArchiveYearCollapsible = require('../themes/evan/source/js/archive-year-collapsible.js');
  ArchiveYearCollapsible.initArchiveYearCollapsible({ root: document, storage });

  const yearDiv = document.querySelector('.archive-year');
  const btn = yearDiv.querySelector('.archive-year-collapse-btn');

  // Click to collapse
  btn.click();

  // Check localStorage
  const saved = storage.getItem('xdlkc:archive:collapsed');
  assert.ok(saved, 'Should save collapsed state to localStorage');

  const collapsed = JSON.parse(saved);
  assert.ok(Array.isArray(collapsed), 'Should be an array');
  assert.ok(collapsed.includes('2026'), 'Should include collapsed year');

  delete global.window;
  delete global.document;
  delete global.localStorage;
});

test('ArchiveYearCollapsible: restores collapsed state from localStorage', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <section class="archive-card">
      <div class="archive-year">
        <h2>2026</h2>
        <article class="archive-item">
          <time>2026-03-17</time>
          <a href="/post1">Post 1</a>
        </article>
      </div>
      <div class="archive-year">
        <h2>2025</h2>
        <article class="archive-item">
          <time>2025-12-25</time>
          <a href="/post2">Post 2</a>
        </article>
      </div>
    </section>
  </body></html>`, {
    url: 'https://example.com/archives/',
    runScripts: 'outside-only'
  });

  global.window = dom.window;
  global.document = dom.window.document;

  const storage = new dom.window.Storage();
  storage.setItem('xdlkc:archive:collapsed', JSON.stringify(['2026']));
  global.localStorage = storage;

  const ArchiveYearCollapsible = require('../themes/evan/source/js/archive-year-collapsible.js');
  ArchiveYearCollapsible.initArchiveYearCollapsible({ root: document, storage });

  const year2026 = document.querySelector('.archive-year:nth-child(2)');
  const year2025 = document.querySelector('.archive-year:nth-child(3)');

  // 2026 should be collapsed
  assert.equal(year2026.classList.contains('is-collapsed'), true);
  assert.equal(year2026.querySelector('.archive-year-collapse-btn').getAttribute('aria-expanded'), 'false');

  // 2025 should be expanded
  assert.equal(year2025.classList.contains('is-collapsed'), false);
  assert.equal(year2025.querySelector('.archive-year-collapse-btn').getAttribute('aria-expanded'), 'true');

  delete global.window;
  delete global.document;
  delete global.localStorage;
});

test('ArchiveYearCollapsible: init is idempotent', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <section class="archive-card">
      <div class="archive-year">
        <h2>2026</h2>
        <article class="archive-item">
          <time>2026-03-17</time>
          <a href="/post1">Post 1</a>
        </article>
      </div>
    </section>
  </body></html>`, {
    url: 'https://example.com/archives/',
    runScripts: 'outside-only'
  });

  global.window = dom.window;
  global.document = dom.window.document;

  const ArchiveYearCollapsible = require('../themes/evan/source/js/archive-year-collapsible.js');

  const yearDiv = document.querySelector('.archive-year');

  ArchiveYearCollapsible.initArchiveYearCollapsible({ root: document });
  const btn1 = yearDiv.querySelector('.archive-year-collapse-btn');

  ArchiveYearCollapsible.initArchiveYearCollapsible({ root: document });
  const btn2 = yearDiv.querySelector('.archive-year-collapse-btn');

  assert.equal(btn1, btn2, 'Should not inject duplicate buttons');

  delete global.window;
  delete global.document;
});

test('ArchiveYearCollapsible: handles empty archive gracefully', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <section class="archive-card">
      <h1>Archives</h1>
      <p class="archive-total">Total 0 posts.</p>
    </section>
  </body></html>`, {
    url: 'https://example.com/archives/',
    runScripts: 'outside-only'
  });

  global.window = dom.window;
  global.document = dom.window.document;

  const ArchiveYearCollapsible = require('../themes/evan/source/js/archive-year-collapsible.js');

  // Should not throw
  assert.doesNotThrow(() => {
    ArchiveYearCollapsible.initArchiveYearCollapsible({ root: document });
  });

  delete global.window;
  delete global.document;
});
