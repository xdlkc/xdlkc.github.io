const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const TocScrollSpyFactory = require('../themes/evan/source/js/toc-scrollspy');
const TocScrollSpy = TocScrollSpyFactory(global.document, global.window);

test('TOC link copy: injects copy buttons and copies full URL with hash', async () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <nav class="toc-nav">
      <ol>
        <li><a href="#h2">Section</a></li>
        <li><a href="#h3">Section 2</a></li>
      </ol>
    </nav>
    <article class="article-content"><h2 id="h2">Section</h2><h3 id="h3">Section 2</h3></article>
  </body></html>`, { url: 'https://example.com/2026/03/11/post/' });

  const { window } = dom;
  global.window = window;
  global.document = window.document;
  global.navigator = window.navigator;

  let copied = null;
  window.navigator.clipboard = {
    writeText: async (text) => {
      copied = text;
    }
  };

  // Prevent scrollspy from crashing in jsdom.
  window.requestAnimationFrame = (cb) => cb();
  window.scrollTo = () => {};

  TocScrollSpy.initTocScrollSpy();

  const btn = window.document.querySelector('.toc-link-copy-button');
  assert.ok(btn, 'copy button should be injected');

  btn.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));

  // wait microtasks
  await new Promise((r) => setTimeout(r, 0));

  assert.equal(copied, 'https://example.com/2026/03/11/post/#h2');
});

test('TOC link copy: init is idempotent (no duplicate buttons)', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <nav class="toc-nav">
      <ol>
        <li><a href="#h2">Section</a></li>
        <li><a href="#h3">Section 2</a></li>
      </ol>
    </nav>
    <article class="article-content"><h2 id="h2">Section</h2><h3 id="h3">Section 2</h3></article>
  </body></html>`, { url: 'https://example.com/post/' });

  const { window } = dom;
  global.window = window;
  global.document = window.document;
  global.navigator = window.navigator;

  window.navigator.clipboard = { writeText: async () => {} };
  window.requestAnimationFrame = (cb) => cb();
  window.scrollTo = () => {};

  TocScrollSpy.initTocScrollSpy();
  TocScrollSpy.initTocScrollSpy();

  const buttons = window.document.querySelectorAll('.toc-link-copy-button');
  assert.equal(buttons.length, 2);
});
