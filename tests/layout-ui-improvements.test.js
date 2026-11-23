const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('P0-3: shared header partial defines all 8 nav items, hooks, and active state', () => {
  const header = read('themes/evan/layout/_partial/header.ejs');

  assert.match(header, /data-i18n-key="nav\.archives"/);
  assert.match(header, /data-i18n-key="nav\.news"/);
  assert.match(header, /data-i18n-key="nav\.about"/);
  assert.match(header, /aria-label="RSS"/);
  assert.match(header, /data-site-search-trigger/);
  assert.match(header, /data-theme-toggle/);
  assert.match(header, /data-shortcut-help-trigger/);
  assert.match(header, /data-lang-toggle/);
  assert.match(header, /class="is-active" aria-current="page"/);

  const pages = [
    'themes/evan/layout/index.ejs',
    'themes/evan/layout/post.ejs',
    'themes/evan/layout/archive.ejs',
    'themes/evan/layout/page.ejs',
    'themes/evan/layout/news.ejs',
  ];

  pages.forEach((file) => {
    const content = read(file);
    assert.match(content, /partial\(['"]_partial\/header['"]/, `${file} should include _partial/header`);
  });
});

test('P1-1: homepage uses 3-column desktop grid, 6 news items, styled CTA, and URL-free excerpts', () => {
  const index = read('themes/evan/layout/index.ejs');
  const css = read('themes/evan/source/css/style.css');

  assert.match(css, /\.grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(index, /latest_news\(6\)/);
  assert.match(index, /class="section-cta"/);
  assert.match(css, /\.section-cta\s*\{[^}]*border-radius:\s*999px/s);
  assert.match(index, /post\.description \|\| post\.excerpt \|\| post\.content/);
  assert.match(index, /https\?:\\\/\\\//);
});

test('P1-3: single-column static pages center and balance content width when no TOC is present', () => {
  const page = read('themes/evan/layout/page.ejs');
  const css = read('themes/evan/source/css/style.css');

  assert.match(page, /page-shell-single/);
  assert.match(page, /article-layout-single/);
  assert.match(css, /\.article-layout\.article-layout-single\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
  assert.match(css, /\.page-shell-single \.article-hero,\s*\.article-layout\.article-layout-single\s*\{[^}]*max-width:\s*1360px/s);
});

test('P1-4: midnight button contrast, prev/next label ordering, and dark search result link styles', () => {
  const post = read('themes/evan/layout/post.ejs');
  const css = read('themes/evan/source/css/style.css');

  // Midnight primary button tokens (WCAG AA/AAA contrast)
  assert.match(css, /\[data-theme-palette="midnight"\]\s*\{[^}]*--btn-primary-bg:\s*#6d28d9;[^}]*--btn-primary-text:\s*#ffffff/s);
  assert.match(css, /\.btn\.primary\s*\{[^}]*background:\s*var\(--btn-primary-bg/s);

  // Prev/Next both place label before title
  const nextBlock = post.match(/class="post-navigation-next"[\s\S]*?<\/a>/);
  assert.ok(nextBlock, 'post.ejs should have post-navigation-next link');
  assert.ok(
    nextBlock[0].indexOf('post-navigation-label') < nextBlock[0].indexOf('post-navigation-title'),
    'Next navigation link should place label above title'
  );

  // Search modal result card link styling
  assert.match(css, /\.site-search-link,\s*\.site-search-link:visited[^}]*color:\s*var\(--text\);[^}]*text-decoration:\s*none/s);
  assert.match(css, /\.site-search-item\s*\{[^}]*border:\s*1px solid var\(--border\)/s);
});
