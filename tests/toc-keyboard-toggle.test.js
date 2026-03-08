const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const TocScrollSpy = require('../themes/evan/source/js/toc-scrollspy');

function makeDom(html) {
  return new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
    url: 'https://example.com/post/'
  });
}

test('TOC keyboard toggle: pressing t toggles desktop toc hidden/aria-hidden', () => {
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

  TocScrollSpy.initTocScrollSpy({ tocSelector: '.toc-nav', contentSelector: '.article-content' });

  const toc = document.querySelector('.toc-card .toc-nav');
  assert.ok(toc);
  assert.equal(toc.hasAttribute('hidden'), false);

  window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 't', bubbles: true }));

  assert.equal(toc.getAttribute('hidden'), 'hidden');
  assert.equal(toc.getAttribute('aria-hidden'), 'true');

  window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 't', bubbles: true }));

  assert.equal(toc.hasAttribute('hidden'), false);
  assert.equal(toc.hasAttribute('aria-hidden'), false);

  delete global.window;
  delete global.document;
});

test('TOC keyboard toggle: does not trigger when typing in an input', () => {
  const dom = makeDom(`
    <nav class="article-nav" style="height: 60px"></nav>
    <aside class="toc-card"><ol class="toc-nav"><li><a href="#a">A</a></li><li><a href="#b">B</a></li></ol></aside>
    <article class="article-content">
      <h2 id="a">A</h2>
      <p>hello</p>
      <h2 id="b">B</h2>
      <p>world</p>
    </article>
    <input id="q" />
  `);

  const { window } = dom;
  const { document } = window;

  global.window = window;
  global.document = document;
  window.requestAnimationFrame = (fn) => fn();

  TocScrollSpy.initTocScrollSpy({ tocSelector: '.toc-nav', contentSelector: '.article-content' });

  const toc = document.querySelector('.toc-card .toc-nav');
  const input = document.getElementById('q');
  input.focus();

  input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 't', bubbles: true }));

  assert.equal(toc.hasAttribute('hidden'), false);

  delete global.window;
  delete global.document;
});

test('TOC keyboard toggle: pressing t toggles mobile <details class="toc-mobile"> open', () => {
  const dom = makeDom(`
    <nav class="article-nav" style="height: 60px"></nav>
    <details class="toc-mobile"><summary>TOC</summary><div><ol class="toc-nav"><li><a href="#a">A</a></li></ol></div></details>
    <article class="article-content">
      <h2 id="a">A</h2>
      <p>hello</p>
    </article>
  `);

  const { window } = dom;
  const { document } = window;

  global.window = window;
  global.document = document;
  window.requestAnimationFrame = (fn) => fn();

  TocScrollSpy.initTocScrollSpy({ tocSelector: '.toc-nav', contentSelector: '.article-content' });

  const details = document.querySelector('details.toc-mobile');
  assert.ok(details);
  assert.equal(details.hasAttribute('open'), false);

  window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 't', bubbles: true }));
  assert.equal(details.hasAttribute('open'), true);

  window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 't', bubbles: true }));
  assert.equal(details.hasAttribute('open'), false);

  delete global.window;
  delete global.document;
});
