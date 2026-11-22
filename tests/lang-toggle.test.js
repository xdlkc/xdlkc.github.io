const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('layout loads lang-toggle script and templates include toggle button', () => {
  const layout = read('themes/evan/layout/layout.ejs');
  assert.match(layout, /\/js\/lang-toggle\.js/);

  const header = read('themes/evan/layout/_partial/header.ejs');
  assert.match(header, /data-lang-toggle/);

  const templates = [
    'themes/evan/layout/post.ejs',
    'themes/evan/layout/page.ejs',
    'themes/evan/layout/index.ejs',
    'themes/evan/layout/archive.ejs',
    'themes/evan/layout/news.ejs',
  ];

  templates.forEach((file) => {
    const content = read(file);
    assert.ok(
      /data-lang-toggle/.test(content) || /partial\(['"]_partial\/header['"]/.test(content),
      `${file} should include lang toggle or shared header partial`
    );
  });
});

test('LangToggle: defaults to en and toggles to zh', () => {
  const LangToggle = require('../themes/evan/source/js/lang-toggle.js');
  const dom = new JSDOM(
    '<!doctype html><html><body><button data-lang-toggle></button><a data-i18n-key="nav.news">News</a></body></html>',
    { url: 'https://example.com/' }
  );

  const storage = {
    _data: new Map(),
    getItem(key) { return this._data.get(key) || null; },
    setItem(key, value) { this._data.set(key, String(value)); },
  };

  LangToggle.initLangToggle({ document: dom.window.document, storage });
  assert.equal(dom.window.document.documentElement.dataset.langMode, 'en');
  assert.equal(dom.window.document.querySelector('[data-i18n-key="nav.news"]').textContent, 'News');

  dom.window.document.querySelector('[data-lang-toggle]').click();
  assert.equal(dom.window.document.documentElement.dataset.langMode, 'zh');
  assert.equal(dom.window.document.querySelector('[data-i18n-key="nav.news"]').textContent, '新闻');
});

test('all data-i18n-key attributes in index.ejs and post.ejs exist in LangToggle.DICT with EN and ZH entries', () => {
  const LangToggle = require('../themes/evan/source/js/lang-toggle.js');
  const templates = [
    'themes/evan/layout/index.ejs',
    'themes/evan/layout/post.ejs',
  ];

  templates.forEach((file) => {
    const content = read(file);
    const keys = [...content.matchAll(/data-i18n-key="([^"]+)"/g)].map((m) => m[1]);
    assert.ok(keys.length > 0, `${file} should contain data-i18n-key attributes`);
    keys.forEach((key) => {
      const entry = LangToggle.DICT[key];
      assert.ok(entry, `Missing DICT entry for key "${key}" used in ${file}`);
      assert.ok(typeof entry.en === 'string' && entry.en.trim().length > 0, `Empty EN entry for "${key}"`);
      assert.ok(typeof entry.zh === 'string' && entry.zh.trim().length > 0, `Empty ZH entry for "${key}"`);
    });
  });
});

test('P2-4: homepage hero, profile card, projects, about, and news CTA toggle cleanly between EN and ZH', () => {
  const LangToggle = require('../themes/evan/source/js/lang-toggle.js');
  const indexTemplate = read('themes/evan/layout/index.ejs');

  const requiredKeys = [
    'index.hero.tag',
    'index.hero.titleLine1',
    'index.hero.titleLine2',
    'index.hero.subtitle',
    'index.profile.eyebrow',
    'index.profile.focusLabel',
    'index.profile.focusValue',
    'index.profile.stackLabel',
    'index.profile.stackValue',
    'index.profile.baseLabel',
    'index.profile.baseValue',
    'index.profile.latestLabel',
    'index.project.loom',
    'index.project.llmTexasHoldem',
    'index.project.scribeleaf',
    'index.project.stillpin',
    'index.project.agentForge',
    'index.project.skillsManager',
    'index.aboutCard.role',
    'index.aboutCard.bio',
    'index.contactCard.title',
    'index.contactCard.emailLabel',
    'index.news.all',
  ];

  requiredKeys.forEach((key) => {
    assert.ok(
      indexTemplate.includes(`data-i18n-key="${key}"`),
      `index.ejs should include data-i18n-key="${key}"`
    );
  });

  const elementsHtml = requiredKeys
    .map((key) => `<span data-i18n-key="${key}">${LangToggle.DICT[key].en}</span>`)
    .join('');

  const dom = new JSDOM(
    `<!doctype html><html><body><button data-lang-toggle></button>${elementsHtml}</body></html>`,
    { url: 'https://example.com/' }
  );

  const storage = {
    _data: new Map(),
    getItem(key) { return this._data.get(key) || null; },
    setItem(key, value) { this._data.set(key, String(value)); },
  };

  LangToggle.initLangToggle({ document: dom.window.document, storage });

  // EN defaults
  requiredKeys.forEach((key) => {
    assert.equal(
      dom.window.document.querySelector(`[data-i18n-key="${key}"]`).textContent,
      LangToggle.DICT[key].en
    );
  });

  // Toggle to ZH
  dom.window.document.querySelector('[data-lang-toggle]').click();
  assert.equal(dom.window.document.documentElement.dataset.langMode, 'zh');
  requiredKeys.forEach((key) => {
    const zhVal = dom.window.document.querySelector(`[data-i18n-key="${key}"]`).textContent;
    assert.equal(zhVal, LangToggle.DICT[key].zh);
    assert.notEqual(zhVal, LangToggle.DICT[key].en, `ZH translation for "${key}" should differ from EN`);
  });

  // Toggle back to EN
  dom.window.document.querySelector('[data-lang-toggle]').click();
  assert.equal(dom.window.document.documentElement.dataset.langMode, 'en');
  requiredKeys.forEach((key) => {
    assert.equal(
      dom.window.document.querySelector(`[data-i18n-key="${key}"]`).textContent,
      LangToggle.DICT[key].en
    );
  });
});

test('P2-4: article metadata switches consistently between EN and ZH without mixed language', () => {
  const LangToggle = require('../themes/evan/source/js/lang-toggle.js');
  const postTemplate = read('themes/evan/layout/post.ejs');

  assert.match(postTemplate, /data-i18n-key="post\.published"/);
  assert.match(postTemplate, /data-i18n-key="post\.words"/);
  assert.match(postTemplate, /data-i18n-key="post\.reading"/);
  assert.match(postTemplate, /data-i18n-key="post\.min"/);
  assert.match(postTemplate, /data-i18n-key="post\.updated"/);

  const dom = new JSDOM(
    `<!doctype html><html><body>
      <button data-lang-toggle></button>
      <p class="article-meta">
        <span class="article-meta-published"><span data-i18n-key="post.published">Published</span> <time class="article-meta-date" datetime="2026-11-18T00:00:00Z">2026-11-18</time></span>
        <span class="article-meta-sep" aria-hidden="true">·</span>
        <span class="article-meta-word-count"><span data-i18n-key="post.words">Words</span> 5951</span>
        <span class="article-meta-sep" aria-hidden="true">·</span>
        <span class="article-meta-reading-time"><span data-i18n-key="post.reading">Reading</span> 22 <span data-i18n-key="post.min">min</span></span>
        <span class="article-meta-sep" aria-hidden="true">·</span>
        <span class="article-meta-updated"><span data-i18n-key="post.updated">Updated</span> <time class="article-meta-updated-date" datetime="2026-11-22T00:00:00Z">2026-11-22</time></span>
      </p>
    </body></html>`,
    { url: 'https://example.com/2026/11/18/test/' }
  );

  const storage = {
    _data: new Map(),
    getItem(key) { return this._data.get(key) || null; },
    setItem(key, value) { this._data.set(key, String(value)); },
  };

  const normalize = (s) => s.replace(/\s+/g, ' ').trim();
  const metaEl = dom.window.document.querySelector('.article-meta');

  LangToggle.initLangToggle({ document: dom.window.document, storage });
  assert.equal(
    normalize(metaEl.textContent),
    'Published 2026-11-18 · Words 5951 · Reading 22 min · Updated 2026-11-22'
  );

  dom.window.document.querySelector('[data-lang-toggle]').click();
  assert.equal(
    normalize(metaEl.textContent),
    '发布于 2026-11-18 · 字数 5951 · 阅读约 22 分钟 · 更新于 2026-11-22'
  );

  dom.window.document.querySelector('[data-lang-toggle]').click();
  assert.equal(
    normalize(metaEl.textContent),
    'Published 2026-11-18 · Words 5951 · Reading 22 min · Updated 2026-11-22'
  );
});
