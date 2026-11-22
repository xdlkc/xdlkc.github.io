const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const NewsFilter = require('../themes/evan/source/js/news-filter');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

function createNewsDom({ items, lang = 'en', url = 'https://example.com/news/', pageSize = 15 } = {}) {
  const tagCounts = new Map();
  items.forEach((item) => {
    item.tags.forEach((t) => {
      tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
    });
  });

  const chipsHtml = [
    `<button type="button" class="news-filter-chip is-active" data-news-filter-chip="all" aria-pressed="true">
      <span class="news-filter-chip-label" data-news-i18n="all">All</span>
      <span class="news-filter-chip-count">${items.length}</span>
    </button>`,
    ...Array.from(tagCounts.entries()).map(([tag, count]) => (
      `<button type="button" class="news-filter-chip" data-news-filter-chip="${tag}" aria-pressed="false">
        <span class="news-filter-chip-label">#${tag}</span>
        <span class="news-filter-chip-count">${count}</span>
      </button>`
    ))
  ].join('\n');

  const itemsHtml = items.map((item, idx) => (
    `<section class="news-item" data-news-item data-news-tags="${item.tags.join('|')}" data-idx="${idx}">
      <h2 class="news-item-title"><a href="${item.url || '#'}">${item.title}</a></h2>
      <div class="news-item-tags">
        ${item.tags.map((t) => `<button type="button" class="news-tag-badge" data-news-tag-badge="${t}" aria-pressed="false">#${t}</button>`).join('')}
      </div>
    </section>`
  )).join('\n');

  const html = `<!doctype html>
    <html lang="${lang === 'zh' ? 'zh-CN' : 'en'}" data-lang-mode="${lang}">
      <body>
        <main id="main-content" class="article-card">
          <div class="article-content">
            <div class="news-filter-bar" role="region" aria-label="Filter news by tag" data-news-filter-bar>
              <div class="news-filter-chips" role="group">${chipsHtml}</div>
              <p class="news-filter-status" data-news-filter-status aria-live="polite"></p>
            </div>
            <div class="news-feed" data-news-feed data-news-page-size="${pageSize}">
              ${itemsHtml}
            </div>
            <div class="news-pagination" data-news-pagination hidden>
              <button type="button" class="news-load-more-btn" data-news-load-more>Load more</button>
            </div>
          </div>
        </main>
      </body>
    </html>`;

  return new JSDOM(html, { url });
}

function makeSampleItems(cnCount, intlCount) {
  const items = [];
  for (let i = 0; i < cnCount; i += 1) {
    items.push({ title: `CN News ${i + 1}`, tags: ['国内'] });
  }
  for (let i = 0; i < intlCount; i += 1) {
    items.push({ title: `INTL News ${i + 1}`, tags: ['国际'] });
  }
  return items;
}

test('news.ejs links news-filter assets directly and normalizes region tags', () => {
  const template = read('themes/evan/layout/news.ejs');
  assert.match(template, /url_for\(['"]\/css\/news-filter\.css['"]\)/);
  assert.match(template, /url_for\(['"]\/js\/news-filter\.js['"]\)/);
  assert.match(template, /data-news-filter-bar/);
  assert.match(template, /data-news-filter-chip="all"/);
  assert.match(template, /data-news-tag-badge=/);
  assert.match(template, /data-news-load-more/);
  assert.match(template, /DOMESTIC/);
  assert.match(template, /INTERNATIONAL/);
});

test('news-filter.css uses theme CSS custom properties for multi-theme compatibility', () => {
  const css = read('themes/evan/source/css/news-filter.css');
  assert.match(css, /var\(--border\)/);
  assert.match(css, /var\(--text\)/);
  assert.match(css, /var\(--muted\)/);
  assert.match(css, /var\(--accent\)/);
  assert.match(css, /var\(--accent-soft\)/);
  assert.match(css, /var\(--accent-border\)/);
  assert.match(css, /var\(--surface-subtle\)/);
  assert.match(css, /var\(--surface-elevated\)/);
});

test('NewsFilter paginates initial items and loads more batches incrementally', () => {
  const items = makeSampleItems(12, 13); // 25 total
  const dom = createNewsDom({ items, lang: 'en', pageSize: 10 });
  const { document } = dom.window;

  NewsFilter.initNewsFilter({ root: document, window: dom.window });

  const visibleItems = () => Array.from(document.querySelectorAll('[data-news-item]')).filter((el) => !el.hidden);
  const pagination = document.querySelector('[data-news-pagination]');
  const loadMoreBtn = document.querySelector('[data-news-load-more]');
  const status = document.querySelector('[data-news-filter-status]');

  assert.equal(visibleItems().length, 10);
  assert.equal(pagination.hidden, false);
  assert.equal(loadMoreBtn.textContent, 'Load more (15 remaining)');
  assert.equal(status.textContent, 'Showing 10 of 25 items');

  // Load second batch -> 20 visible, 5 remaining
  loadMoreBtn.click();
  assert.equal(visibleItems().length, 20);
  assert.equal(pagination.hidden, false);
  assert.equal(loadMoreBtn.textContent, 'Load more (5 remaining)');

  // Load final batch -> 25 visible, pagination hidden
  loadMoreBtn.click();
  assert.equal(visibleItems().length, 25);
  assert.equal(pagination.hidden, true);
  assert.equal(status.textContent, 'Showing 25 of 25 items');
});

test('NewsFilter filters by category chip, updates aria-pressed, and resets pagination', () => {
  const items = makeSampleItems(12, 8); // 20 total
  const dom = createNewsDom({ items, lang: 'en', pageSize: 10 });
  const { document } = dom.window;

  NewsFilter.initNewsFilter({ root: document, window: dom.window });

  const allChip = document.querySelector('[data-news-filter-chip="all"]');
  const cnChip = document.querySelector('[data-news-filter-chip="国内"]');
  const intlChip = document.querySelector('[data-news-filter-chip="国际"]');
  const pagination = document.querySelector('[data-news-pagination]');
  const loadMoreBtn = document.querySelector('[data-news-load-more]');

  const visibleItems = () => Array.from(document.querySelectorAll('[data-news-item]')).filter((el) => !el.hidden);

  // Click 国内 chip (12 items, pageSize 10 -> 10 shown, 2 remaining)
  cnChip.click();
  assert.equal(cnChip.getAttribute('aria-pressed'), 'true');
  assert.equal(allChip.getAttribute('aria-pressed'), 'false');
  assert.equal(intlChip.getAttribute('aria-pressed'), 'false');
  assert.equal(visibleItems().length, 10);
  assert.ok(visibleItems().every((el) => el.getAttribute('data-news-tags') === '国内'));
  assert.equal(pagination.hidden, false);
  assert.equal(loadMoreBtn.textContent, 'Load more (2 remaining)');
  assert.equal(dom.window.location.search, '?tag=%E5%9B%BD%E5%86%85');

  // Click 国际 chip (8 items <= pageSize 10 -> all 8 shown, pagination hidden)
  intlChip.click();
  assert.equal(intlChip.getAttribute('aria-pressed'), 'true');
  assert.equal(cnChip.getAttribute('aria-pressed'), 'false');
  assert.equal(visibleItems().length, 8);
  assert.ok(visibleItems().every((el) => el.getAttribute('data-news-tags') === '国际'));
  assert.equal(pagination.hidden, true);

  // Clicking All restores full paginated feed and clears URL query
  allChip.click();
  assert.equal(allChip.getAttribute('aria-pressed'), 'true');
  assert.equal(visibleItems().length, 10);
  assert.equal(pagination.hidden, false);
  assert.equal(dom.window.location.search, '');
});

test('NewsFilter clicking an inline tag badge filters and toggles back to All on second click', () => {
  const items = makeSampleItems(4, 6);
  const dom = createNewsDom({ items, lang: 'en', pageSize: 15 });
  const { document } = dom.window;

  NewsFilter.initNewsFilter({ root: document, window: dom.window });

  const allChip = document.querySelector('[data-news-filter-chip="all"]');
  const cnChip = document.querySelector('[data-news-filter-chip="国内"]');
  const firstCnBadge = document.querySelector('[data-news-tag-badge="国内"]');
  const visibleItems = () => Array.from(document.querySelectorAll('[data-news-item]')).filter((el) => !el.hidden);

  firstCnBadge.click();
  assert.equal(cnChip.getAttribute('aria-pressed'), 'true');
  assert.equal(firstCnBadge.getAttribute('aria-pressed'), 'true');
  assert.equal(visibleItems().length, 4);

  // Clicking the same badge again toggles back to All
  firstCnBadge.click();
  assert.equal(allChip.getAttribute('aria-pressed'), 'true');
  assert.equal(firstCnBadge.getAttribute('aria-pressed'), 'false');
  assert.equal(visibleItems().length, 10);
});

test('NewsFilter reads initial filter from URL query or hash without breaking static markup', () => {
  const items = makeSampleItems(5, 7);

  // Query param
  const domQuery = createNewsDom({
    items,
    lang: 'en',
    pageSize: 15,
    url: 'https://example.com/news/?tag=%E5%9B%BD%E9%99%85'
  });
  NewsFilter.initNewsFilter({ root: domQuery.window.document, window: domQuery.window });
  const visibleQuery = Array.from(domQuery.window.document.querySelectorAll('[data-news-item]')).filter((el) => !el.hidden);
  assert.equal(visibleQuery.length, 7);
  assert.equal(
    domQuery.window.document.querySelector('[data-news-filter-chip="国际"]').getAttribute('aria-pressed'),
    'true'
  );

  // Hash param
  const domHash = createNewsDom({
    items,
    lang: 'en',
    pageSize: 15,
    url: 'https://example.com/news/#tag=%E5%9B%BD%E5%86%85'
  });
  NewsFilter.initNewsFilter({ root: domHash.window.document, window: domHash.window });
  const visibleHash = Array.from(domHash.window.document.querySelectorAll('[data-news-item]')).filter((el) => !el.hidden);
  assert.equal(visibleHash.length, 5);
  assert.equal(
    domHash.window.document.querySelector('[data-news-filter-chip="国内"]').getAttribute('aria-pressed'),
    'true'
  );
});

test('NewsFilter updates copy when site language switches between en and zh', () => {
  const items = makeSampleItems(10, 10);
  const dom = createNewsDom({ items, lang: 'en', pageSize: 15 });
  const { document } = dom.window;

  NewsFilter.initNewsFilter({ root: document, window: dom.window });

  const allLabel = document.querySelector('[data-news-i18n="all"]');
  const loadMoreBtn = document.querySelector('[data-news-load-more]');
  const status = document.querySelector('[data-news-filter-status]');

  assert.equal(allLabel.textContent, 'All');
  assert.equal(loadMoreBtn.textContent, 'Load more (5 remaining)');
  assert.equal(status.textContent, 'Showing 15 of 20 items');

  // Switch to zh and dispatch language change event
  document.documentElement.dataset.langMode = 'zh';
  dom.window.dispatchEvent(new dom.window.CustomEvent('xdlkc:lang-change', { detail: { mode: 'zh' } }));

  assert.equal(allLabel.textContent, '全部');
  assert.equal(loadMoreBtn.textContent, '加载更多（剩余 5 条）');
  assert.equal(status.textContent, '显示 15 / 20 条快讯');
});
