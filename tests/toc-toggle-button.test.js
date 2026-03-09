const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const TocScrollSpy = require('../themes/evan/source/js/toc-scrollspy');

function makeDom(html) {
  return new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
    url: 'https://example.com/post/'
  });
}

test('TOC can be toggled via a visible button and persists preference', () => {
  const dom = makeDom(`
    <nav class="article-nav" style="height: 60px"></nav>
    <aside class="toc-card">
      <div class="toc-header">
        <p class="toc-title">Outline</p>
        <button type="button" class="toc-visibility-toggle" data-toc-visibility-toggle aria-label="隐藏目录" aria-pressed="false">Hide</button>
      </div>
      <ol class="toc-nav"><li><a href="#a">A</a></li><li><a href="#b">B</a></li></ol>
    </aside>
    <article class="article-content">
      <h2 id="a">A</h2>
      <p>hello</p>
      <h2 id="b">B</h2>
      <p>world</p>
    </article>
  `);

  const { window } = dom;
  const { document } = window;

  global.window = window;
  global.document = document;
  window.requestAnimationFrame = (fn) => fn();

  TocScrollSpy.initTocScrollSpy({ tocSelector: '.toc-nav', contentSelector: '.article-content', storage: window.localStorage });

  const toc = document.querySelector('.toc-card .toc-nav');
  const btn = document.querySelector('[data-toc-visibility-toggle]');
  assert.ok(toc);
  assert.ok(btn);

  // Start visible.
  assert.equal(toc.hasAttribute('hidden'), false);
  assert.equal(btn.getAttribute('aria-pressed'), 'false');

  // Click -> hidden.
  btn.click();
  assert.equal(toc.getAttribute('hidden'), 'hidden');
  assert.equal(toc.getAttribute('aria-hidden'), 'true');
  assert.equal(window.localStorage.getItem('xdlkc:toc:hidden'), '1');
  assert.equal(btn.getAttribute('aria-pressed'), 'true');

  // Click again -> visible.
  btn.click();
  assert.equal(toc.hasAttribute('hidden'), false);
  assert.equal(toc.hasAttribute('aria-hidden'), false);
  assert.equal(window.localStorage.getItem('xdlkc:toc:hidden'), '0');
  assert.equal(btn.getAttribute('aria-pressed'), 'false');

  delete global.window;
  delete global.document;
});
