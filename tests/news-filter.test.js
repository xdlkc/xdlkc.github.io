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

function createHubDom({
  items,
  hotEvents = [],
  industries = ['AI', '工程与开源', '金融与政策'],
  lang = 'zh',
  url = 'https://example.com/news/',
  pageSize = 15
} = {}) {
  const tagCounts = new Map();
  items.forEach((item) => {
    item.tags.forEach((t) => {
      tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
    });
  });

  const curatedCount = items.filter((i) => i.selected !== false).length;

  const viewTabsHtml = `
    <nav class="news-view-tabs" role="tablist" data-news-view-tabs>
      <button type="button" role="tab" class="news-view-tab is-active" data-news-view-tab="curated" aria-selected="true">
        <span data-news-i18n="viewCurated">精选</span>
        <span data-news-view-count="curated">${curatedCount}</span>
      </button>
      <button type="button" role="tab" class="news-view-tab" data-news-view-tab="all" aria-selected="false">
        <span data-news-i18n="viewAll">全部动态</span>
        <span data-news-view-count="all">${items.length}</span>
      </button>
      <button type="button" role="tab" class="news-view-tab" data-news-view-tab="hot" aria-selected="false">
        <span data-news-i18n="viewHot">热点榜</span>
        <span data-news-view-count="hot">${hotEvents.length}</span>
      </button>
    </nav>`;

  const industryChipsHtml = [
    `<button type="button" class="news-industry-chip is-active" data-news-industry-chip="all" aria-pressed="true">
      <span data-news-i18n="industryAll">全部行业</span>
      <span data-news-industry-count="all">${curatedCount}</span>
    </button>`,
    ...industries.map((ind) => (
      `<button type="button" class="news-industry-chip" data-news-industry-chip="${ind}" aria-pressed="false">
        <span data-news-industry-label="${ind}">${ind}</span>
        <span data-news-industry-count="${ind}">0</span>
      </button>`
    ))
  ].join('\n');

  const chipsHtml = [
    `<button type="button" class="news-filter-chip is-active" data-news-filter-chip="all" aria-pressed="true">
      <span class="news-filter-chip-label" data-news-i18n="all">All</span>
      <span class="news-filter-chip-count" data-news-tag-count="all">${curatedCount}</span>
    </button>`,
    ...Array.from(tagCounts.entries()).map(([tag, count]) => (
      `<button type="button" class="news-filter-chip" data-news-filter-chip="${tag}" aria-pressed="false">
        <span class="news-filter-chip-label">#${tag}</span>
        <span class="news-filter-chip-count" data-news-tag-count="${tag}">${count}</span>
      </button>`
    ))
  ].join('\n');

  const itemsHtml = items.map((item, idx) => (
    `<section class="news-item" data-news-item data-news-selected="${item.selected === false ? 'false' : 'true'}" data-news-industry="${item.industry || 'AI'}" data-news-tags="${item.tags.join('|')}" data-idx="${idx}">
      <span class="news-industry-pill" data-news-industry-pill="${item.industry || 'AI'}">${item.industry || 'AI'}</span>
      <h2 class="news-item-title"><a href="/news/item-${idx}/">${item.title}</a></h2>
      <div class="news-item-tags">
        ${item.tags.map((t) => `<button type="button" class="news-tag-badge" data-news-tag-badge="${t}" aria-pressed="false">#${t}</button>`).join('')}
      </div>
    </section>`
  )).join('\n');

  const hotHtml = hotEvents.map((ev, idx) => (
    `<article class="news-hot-card" data-news-hot-item data-news-industry="${ev.industry || 'AI'}" data-news-tags="${(ev.topics || []).join('|')}" data-hot-idx="${idx}">
      <span class="news-hot-rank">#${ev.rank || idx + 1}</span>
      <span class="news-hot-heat"><span data-news-i18n="heat">热度</span><strong>${ev.heatScore || 90}</strong></span>
      <span class="news-hot-sources" data-news-i18n="sources" data-count="${ev.sourceCount || 1}">${ev.sourceCount || 1} 家来源报道</span>
      <h2 class="news-hot-title"><a href="/news/${ev.id || `hot-${idx}`}/">${ev.title}</a></h2>
      ${ev.sourceCount > 1 ? `<details data-news-hot-related><summary data-news-i18n="relatedCoverage" data-count="${ev.sourceCount}">相关报道（${ev.sourceCount} 篇）</summary></details>` : ''}
    </article>`
  )).join('\n');

  const html = `<!doctype html>
    <html lang="${lang === 'zh' ? 'zh-CN' : 'en'}" data-lang-mode="${lang}">
      <body>
        <main id="main-content" class="news-board">
          ${viewTabsHtml}
          <div class="news-filter-bar" role="region" data-news-filter-bar>
            <div class="news-industry-bar" role="group" data-news-industry-bar>${industryChipsHtml}</div>
            <div class="news-topic-row">
              <div class="news-filter-chips" role="group">${chipsHtml}</div>
              <p class="news-filter-status" data-news-filter-status aria-live="polite"></p>
            </div>
          </div>
          <div class="news-feed" data-news-feed data-news-page-size="${pageSize}">${itemsHtml}</div>
          <div class="news-hot-feed" data-news-hot-feed hidden>${hotHtml}</div>
          <div class="news-filter-empty" data-news-filter-empty hidden>
            <p data-news-i18n="emptyFiltered">当前筛选条件下暂无快讯。</p>
            <button type="button" data-news-reset-filters data-news-i18n="resetFilters">重置筛选</button>
          </div>
          <div class="news-pagination" data-news-pagination hidden>
            <button type="button" class="news-load-more-btn" data-news-load-more>Load more</button>
          </div>
        </main>
      </body>
    </html>`;

  return new JSDOM(html, { url });
}

test('news.ejs includes 3-view tabs, industry bar, hot events fallback, and preserves existing hooks', () => {
  const template = read('themes/evan/layout/news.ejs');
  assert.match(template, /data-news-view-tab="curated"/);
  assert.match(template, /data-news-view-tab="all"/);
  assert.match(template, /data-news-view-tab="hot"/);
  assert.match(template, /data-news-industry-chip="all"/);
  assert.match(template, /'工程与开源'/);
  assert.match(template, /'金融与政策'/);
  assert.match(template, /site\.data\['news-hot'\]/);
  assert.match(template, /data-news-selected=/);
  assert.match(template, /data-news-industry=/);
  assert.match(template, /data-news-hot-feed/);
  assert.match(template, /data-news-hot-related/);
});

test('NewsFilter switches cleanly across curated, all, and hot views with URL sync', () => {
  const items = [
    { title: 'AI Curated 1', industry: 'AI', tags: ['AI精选', '模型发布'], selected: true },
    { title: 'AI Raw 2', industry: 'AI', tags: ['模型发布'], selected: false },
    { title: 'OSS Curated 1', industry: '工程与开源', tags: ['开源生态'], selected: true },
    { title: 'Finance Raw 1', industry: '金融与政策', tags: ['国内', 'A股'], selected: false }
  ];
  const hotEvents = [
    { id: 'hot-1', rank: 1, title: 'Major AI Model Release', industry: 'AI', topics: ['AI精选', '模型发布'], heatScore: 96, sourceCount: 3 },
    { id: 'hot-2', rank: 2, title: 'Rust 2.0 Roadmap', industry: '工程与开源', topics: ['开源生态'], heatScore: 84, sourceCount: 2 }
  ];

  const dom = createHubDom({ items, hotEvents, lang: 'zh', pageSize: 15 });
  const { document } = dom.window;
  NewsFilter.initNewsFilter({ root: document, window: dom.window });

  const feed = document.querySelector('[data-news-feed]');
  const hotFeed = document.querySelector('[data-news-hot-feed]');
  const visibleFeedItems = () => Array.from(document.querySelectorAll('[data-news-item]')).filter((el) => !el.hidden);
  const visibleHotItems = () => Array.from(document.querySelectorAll('[data-news-hot-item]')).filter((el) => !el.hidden);

  // Default: curated view (only selected !== false -> 2 items)
  assert.equal(feed.hidden, false);
  assert.equal(hotFeed.hidden, true);
  assert.equal(visibleFeedItems().length, 2);
  assert.equal(document.querySelector('[data-news-view-tab="curated"]').getAttribute('aria-selected'), 'true');
  assert.equal(document.querySelector('[data-news-industry-count="AI"]').textContent, '1');
  assert.equal(dom.window.location.search, '');

  // Switch to all view -> all 4 items visible, industry count updates
  document.querySelector('[data-news-view-tab="all"]').click();
  assert.equal(feed.hidden, false);
  assert.equal(hotFeed.hidden, true);
  assert.equal(visibleFeedItems().length, 4);
  assert.equal(document.querySelector('[data-news-industry-count="AI"]').textContent, '2');
  assert.equal(document.querySelector('[data-news-industry-count="金融与政策"]').textContent, '1');
  assert.equal(dom.window.location.search, '?view=all');

  // Switch to hot view -> hotFeed visible, feed hidden, 2 hot events shown
  document.querySelector('[data-news-view-tab="hot"]').click();
  assert.equal(feed.hidden, true);
  assert.equal(hotFeed.hidden, false);
  assert.equal(visibleHotItems().length, 2);
  assert.equal(document.querySelector('[data-news-filter-status]').textContent, '显示 2 / 2 条热点事件');
  assert.equal(dom.window.location.search, '?view=hot');

  // Switch back to curated -> clears ?view param
  document.querySelector('[data-news-view-tab="curated"]').click();
  assert.equal(visibleFeedItems().length, 2);
  assert.equal(dom.window.location.search, '');
});

test('NewsFilter combines industry + topic filtering, handles empty state reset, and syncs URL', () => {
  const items = [
    { title: 'AI Agent Launch', industry: 'AI', tags: ['AI精选', 'Agent'], selected: true },
    { title: 'AI Infra Update', industry: 'AI', tags: ['基础设施'], selected: true },
    { title: 'OSS Infra Tool', industry: '工程与开源', tags: ['基础设施', '开源生态'], selected: true },
    { title: 'Policy Update', industry: '金融与政策', tags: ['国内', '市场政策'], selected: true }
  ];

  const dom = createHubDom({ items, hotEvents: [], lang: 'zh', pageSize: 15 });
  const { document } = dom.window;
  NewsFilter.initNewsFilter({ root: document, window: dom.window });

  const visibleItems = () => Array.from(document.querySelectorAll('[data-news-item]')).filter((el) => !el.hidden);
  const emptyEl = document.querySelector('[data-news-filter-empty]');
  const statusEl = document.querySelector('[data-news-filter-status]');

  // Filter by industry AI -> 2 items
  document.querySelector('[data-news-industry-chip="AI"]').click();
  assert.equal(visibleItems().length, 2);
  assert.equal(document.querySelector('[data-news-tag-count="基础设施"]').textContent, '1');
  assert.equal(statusEl.textContent, '显示 2 / 2 条 AI 快讯');
  assert.equal(dom.window.location.search, '?industry=AI');

  // Combine with topic #基础设施 -> 1 item
  document.querySelector('[data-news-filter-chip="基础设施"]').click();
  assert.equal(visibleItems().length, 1);
  assert.equal(statusEl.textContent, '显示 1 / 1 条 AI · #基础设施 快讯');
  assert.equal(dom.window.location.search, '?industry=AI&tag=%E5%9F%BA%E7%A1%80%E8%AE%BE%E6%96%BD');

  // Pick a topic with 0 items in AI -> empty state shown
  document.querySelector('[data-news-filter-chip="国内"]').click();
  assert.equal(visibleItems().length, 0);
  assert.equal(emptyEl.hidden, false);

  // Reset filters restores all 4 curated items and clears query params
  document.querySelector('[data-news-reset-filters]').click();
  assert.equal(visibleItems().length, 4);
  assert.equal(emptyEl.hidden, true);
  assert.equal(dom.window.location.search, '');
});

test('NewsFilter reads combined ?view=hot&industry=AI&tag=... from URL and updates bilingual copy', () => {
  const items = [
    { title: 'AI News', industry: 'AI', tags: ['AI精选'], selected: true },
    { title: 'OSS News', industry: '工程与开源', tags: ['开源生态'], selected: true }
  ];
  const hotEvents = [
    { id: 'hot-ai', rank: 1, title: 'AI Breakthrough', industry: 'AI', topics: ['AI精选'], heatScore: 95, sourceCount: 3 },
    { id: 'hot-oss', rank: 2, title: 'OSS Release', industry: '工程与开源', topics: ['开源生态'], heatScore: 80, sourceCount: 2 }
  ];

  const dom = createHubDom({
    items,
    hotEvents,
    lang: 'en',
    url: 'https://example.com/news/?view=hot&industry=AI&tag=AI%E7%B2%BE%E9%80%89'
  });
  const { document } = dom.window;
  NewsFilter.initNewsFilter({ root: document, window: dom.window });

  const visibleHot = () => Array.from(document.querySelectorAll('[data-news-hot-item]')).filter((el) => !el.hidden);
  assert.equal(document.querySelector('[data-news-hot-feed]').hidden, false);
  assert.equal(visibleHot().length, 1);
  assert.equal(document.querySelector('[data-news-i18n="viewHot"]').textContent, 'Hot Events');
  assert.equal(document.querySelector('[data-news-industry-label="工程与开源"]').textContent, 'Engineering & OSS');
  assert.equal(document.querySelector('[data-news-i18n="sources"]').textContent, '3 sources');
  assert.equal(document.querySelector('[data-news-filter-status]').textContent, 'Showing 1 of 1 hot events in AI · #AI精选');

  // Switch to zh
  document.documentElement.dataset.langMode = 'zh';
  dom.window.dispatchEvent(new dom.window.CustomEvent('xdlkc:lang-change', { detail: { mode: 'zh' } }));

  assert.equal(document.querySelector('[data-news-i18n="viewHot"]').textContent, '热点榜');
  assert.equal(document.querySelector('[data-news-industry-label="工程与开源"]').textContent, '工程与开源');
  assert.equal(document.querySelector('[data-news-i18n="sources"]').textContent, '3 家来源报道');
  assert.equal(document.querySelector('[data-news-filter-status]').textContent, '显示 1 / 1 条 AI · #AI精选 热点事件');
});
