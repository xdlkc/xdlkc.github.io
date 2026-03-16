const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const TocScrollSpy = require('../themes/evan/source/js/toc-scrollspy');

function setupDom() {
  const dom = new JSDOM(`<!doctype html><html><body>
    <nav class="article-nav" style="height: 56px"></nav>
    <aside class="toc-card">
      <ol class="toc-nav">
        <li>
          <a href="#h1">Intro</a>
          <ol>
            <li><a href="#h1-1">Why</a></li>
            <li><a href="#h1-2">How</a></li>
          </ol>
        </li>
        <li><a href="#h2">Appendix</a></li>
      </ol>
    </aside>
    <article class="article-content">
      <h2 id="h1">Intro</h2>
      <h3 id="h1-1">Why</h3>
      <h3 id="h1-2">How</h3>
      <h2 id="h2">Appendix</h2>
    </article>
  </body></html>`, { url: 'https://example.com/post/' });

  const { window } = dom;
  global.window = window;
  global.document = window.document;
  window.requestAnimationFrame = (fn) => fn();

  return dom;
}

test('TOC auto numbering: render hierarchical indices for links', () => {
  const dom = setupDom();
  const { document } = dom.window;

  TocScrollSpy.initTocScrollSpy({
    tocSelector: '.toc-nav',
    contentSelector: '.article-content',
    storage: dom.window.localStorage
  });

  const links = Array.from(document.querySelectorAll('.toc-nav a'));
  const indexes = links.map((a) => a.querySelector('.toc-index')?.textContent?.trim() || '');

  assert.deepEqual(indexes, ['1', '1.1', '1.2', '2']);

  delete global.window;
  delete global.document;
});

test('TOC auto numbering: idempotent when enhancement runs twice', () => {
  const dom = setupDom();
  const { document } = dom.window;
  const toc = document.querySelector('.toc-nav');

  TocScrollSpy.enhanceTocAutoNumbering(toc, { document });
  TocScrollSpy.enhanceTocAutoNumbering(toc, { document });

  const allIndexes = document.querySelectorAll('.toc-nav .toc-index');
  assert.equal(allIndexes.length, 4);

  delete global.window;
  delete global.document;
});
