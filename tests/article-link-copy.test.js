const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('post template loads article-link-copy script and initializes it', () => {
  const template = read('themes/evan/layout/post.ejs');
  assert.match(template, /\/js\/article-link-copy\.js/);
  assert.match(template, /window\.ArticleLinkCopy\?\.initArticleLinkCopy\(\)/);
  assert.match(template, /data-article-link-copy/);
});

test('ArticleLinkCopy: clicking button copies page URL without hash and shows toast', async () => {
  const { initArticleLinkCopy } = require('../themes/evan/source/js/article-link-copy');

  const dom = new JSDOM(`<!doctype html><html><body>
    <header class="article-hero">
      <button type="button" data-article-link-copy>复制链接</button>
    </header>
  </body></html>`, { url: 'https://example.test/posts/hello-world/?utm=1#section' });

  let copied = null;
  dom.window.navigator.clipboard = {
    writeText: async (text) => {
      copied = text;
    }
  };

  initArticleLinkCopy({
    document: dom.window.document,
    navigator: dom.window.navigator,
    location: dom.window.location,
    window: dom.window,
  });

  const toast = dom.window.document.querySelector('.code-copy-toast');
  assert.ok(toast, 'should ensure toast element');

  const button = dom.window.document.querySelector('[data-article-link-copy]');
  assert.ok(button, 'should find copy button');

  button.click();
  await new Promise(resolve => dom.window.setTimeout(resolve, 0));

  assert.equal(copied, 'https://example.test/posts/hello-world/?utm=1');
  assert.ok(toast.classList.contains('is-visible'), 'toast should become visible');
  assert.equal(toast.textContent, '链接已复制');
});
