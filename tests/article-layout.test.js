const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('article layout uses a wider shell without widening the reading measure', () => {
  const css = read('themes/evan/source/css/style.css');

  assert.match(css, /\.article-shell\s*\{[^}]*width:\s*min\(1280px,/s);
  assert.match(css, /\.article-layout\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) 280px/s);
  assert.match(css, /\.article-content > :is\(p, ul, ol, blockquote, h2, h3, h4, h5, h6\)\s*\{[^}]*max-width:\s*52rem/s);
  assert.match(css, /\.article-content > p\.article-image\s*\{[^}]*max-width:\s*none/s);
});

test('article layout collapses the desktop TOC before it squeezes the article', () => {
  const css = read('themes/evan/source/css/style.css');
  const media = css.match(/@media \(max-width: 1100px\) \{([\s\S]*?)\n\}/);

  assert.ok(media);
  assert.match(media[1], /\.article-layout\s*\{[^}]*grid-template-columns:\s*1fr/s);
  assert.match(media[1], /\.toc-sidebar\s*\{[^}]*display:\s*none !important/s);
  assert.match(media[1], /\.toc-sidebar-mobile\s*\{[^}]*display:\s*block/s);
});

test('responsive tables and the desktop TOC each have one appropriate scroll container', () => {
  const css = read('themes/evan/source/css/style.css');

  assert.match(css, /\.article-content \.table-wrapper\s*\{[^}]*overflow-x:\s*auto/s);
  assert.match(css, /\.toc-sidebar\s*\{[^}]*overflow-y:\s*auto/s);
  assert.match(css, /\.toc-content\s*\{[^}]*max-height:\s*none;[^}]*overflow:\s*visible/s);
  assert.doesNotMatch(css, /max-height:\s*400px/);
});

test('post header avoids duplicate title metadata and places countdown in the TOC', () => {
  const template = read('themes/evan/layout/post.ejs');

  assert.match(template, /primaryCategoryName \|\| 'ARTICLES'/);
  assert.match(template, /class="article-updated"/);
  assert.doesNotMatch(template, /data-breadcrumb-title/);
  assert.doesNotMatch(template, /data-publish-date/);
  assert.doesNotMatch(template, /LATEST WRITING/);

  const tocHeader = template.indexOf('<div class="toc-header">');
  const countdown = template.indexOf('data-reading-time-countdown');
  assert.ok(tocHeader >= 0);
  assert.ok(countdown > tocHeader);
});
