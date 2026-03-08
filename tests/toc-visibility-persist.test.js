const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const TocScrollSpy = require('../themes/evan/source/js/toc-scrollspy');

function makeDom(html) {
  return new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
    url: 'https://example.com/post/'
  });
}

test('TOC visibility persists via localStorage when toggled by `t`', () => {
  const dom = makeDom(`
    <nav class="article-nav" style="height: 60px"></nav>
    <aside class="toc-card"><ol class="toc-nav"><li><a href="#a">A</a></li><li><a href="#b">B</a></li></ol></aside>
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

  // 1) When localStorage says hidden=1, init should keep it hidden.
  window.localStorage.setItem('xdlkc:toc:hidden', '1');

  TocScrollSpy.initTocScrollSpy({ tocSelector: '.toc-nav', contentSelector: '.article-content', storage: window.localStorage });

  const toc = document.querySelector('.toc-card .toc-nav');
  assert.ok(toc);
  assert.equal(toc.getAttribute('hidden'), 'hidden');
  assert.equal(toc.getAttribute('aria-hidden'), 'true');

  // 2) Pressing `t` should toggle it visible and write hidden=0.
  window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 't', bubbles: true }));

  assert.equal(toc.hasAttribute('hidden'), false);
  assert.equal(toc.hasAttribute('aria-hidden'), false);
  assert.equal(window.localStorage.getItem('xdlkc:toc:hidden'), '0');

  // 3) Pressing `t` again hides and writes hidden=1.
  window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 't', bubbles: true }));

  assert.equal(toc.getAttribute('hidden'), 'hidden');
  assert.equal(toc.getAttribute('aria-hidden'), 'true');
  assert.equal(window.localStorage.getItem('xdlkc:toc:hidden'), '1');

  delete global.window;
  delete global.document;
});
