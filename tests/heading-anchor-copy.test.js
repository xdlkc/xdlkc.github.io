const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('theme loads HeadingAnchorCopy script and post template initializes it', () => {
  const template = read('themes/evan/layout/post.ejs');
  assert.match(template, /\/js\/heading-anchor-copy\.js/);
  assert.match(template, /window\.HeadingAnchorCopy\?\.initHeadingAnchorCopy\(\)/);
});

test('stylesheet contains heading anchor button styles', () => {
  const css = read('themes/evan/source/css/style.css');
  assert.match(css, /\.heading-anchor-button\s*\{/);
});

test('HeadingAnchorCopy: clicking anchor button copies full URL with hash', async () => {
  const { initHeadingAnchorCopy } = require('../themes/evan/source/js/heading-anchor-copy');

  const dom = new JSDOM(`<!doctype html><html><body>
    <article class="article-content">
      <h2 id="section-1">Section</h2>
      <p>hello</p>
    </article>
  </body></html>`, { url: 'https://example.test/posts/hello-world/' });

  let copied = null;
  dom.window.navigator.clipboard = {
    writeText: async (text) => {
      copied = text;
    }
  };

  initHeadingAnchorCopy({
    document: dom.window.document,
    navigator: dom.window.navigator,
    location: dom.window.location,
    history: dom.window.history,
  });

  const button = dom.window.document.querySelector('.heading-anchor-button');
  assert.ok(button, 'should inject a button next to heading');

  button.click();
  // wait microtask
  await new Promise(resolve => dom.window.setTimeout(resolve, 0));

  assert.equal(copied, 'https://example.test/posts/hello-world/#section-1');
});

test('HeadingAnchorCopy: aria-label and toast messages follow langMode (en)', async () => {
  const { initHeadingAnchorCopy } = require('../themes/evan/source/js/heading-anchor-copy');

  const dom = new JSDOM(`<!doctype html><html data-lang-mode="en"><body>
    <article class="article-content">
      <h2 id="s1">Section</h2>
    </article>
  </body></html>`, { url: 'https://example.test/p/' });

  // Set lang via dataset (the real site uses dataset.langMode).
  dom.window.document.documentElement.dataset.langMode = 'en';

  let toastText = '';
  dom.window.navigator.clipboard = {
    writeText: async () => {
      // success
    }
  };

  initHeadingAnchorCopy({
    document: dom.window.document,
    navigator: dom.window.navigator,
    location: dom.window.location,
    history: dom.window.history,
    window: dom.window,
  });

  const button = dom.window.document.querySelector('.heading-anchor-button');
  assert.ok(button);
  assert.match(String(button.getAttribute('aria-label') || ''), /copy/i);

  button.click();
  await new Promise(resolve => dom.window.setTimeout(resolve, 0));

  const toast = dom.window.document.querySelector('.code-copy-toast');
  toastText = String(toast?.textContent || '');
  assert.match(toastText, /copied/i);
});

test('HeadingAnchorCopy: updates aria-label on xdlkc:lang-change', () => {
  const { initHeadingAnchorCopy } = require('../themes/evan/source/js/heading-anchor-copy');

  const dom = new JSDOM(`<!doctype html><html><body>
    <article class="article-content">
      <h2 id="s1">Section</h2>
    </article>
  </body></html>`, { url: 'https://example.test/p/' });

  dom.window.document.documentElement.dataset.langMode = 'zh';

  initHeadingAnchorCopy({
    document: dom.window.document,
    navigator: dom.window.navigator,
    location: dom.window.location,
    history: dom.window.history,
    window: dom.window,
  });

  const button = dom.window.document.querySelector('.heading-anchor-button');
  assert.ok(button);
  const zhLabel = String(button.getAttribute('aria-label') || '');

  dom.window.document.documentElement.dataset.langMode = 'en';
  dom.window.dispatchEvent(new dom.window.Event('xdlkc:lang-change'));

  const enLabel = String(button.getAttribute('aria-label') || '');
  assert.notEqual(enLabel, zhLabel);
  assert.match(enLabel, /copy/i);
});

test('HeadingAnchorCopy: init is idempotent (no duplicate buttons)', () => {
  const { initHeadingAnchorCopy } = require('../themes/evan/source/js/heading-anchor-copy');

  const dom = new JSDOM(`<!doctype html><html><body>
    <article class="article-content">
      <h2 id="s1">Section</h2>
    </article>
  </body></html>`, { url: 'https://example.test/p/' });

  initHeadingAnchorCopy({
    document: dom.window.document,
    navigator: dom.window.navigator,
    location: dom.window.location,
    history: dom.window.history,
    window: dom.window,
  });

  initHeadingAnchorCopy({
    document: dom.window.document,
    navigator: dom.window.navigator,
    location: dom.window.location,
    history: dom.window.history,
    window: dom.window,
  });

  const buttons = dom.window.document.querySelectorAll('.heading-anchor-button');
  assert.equal(buttons.length, 1);
});
