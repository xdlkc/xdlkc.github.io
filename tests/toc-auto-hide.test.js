const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const TocScrollSpy = require('../themes/evan/source/js/toc-scrollspy');

test('TOC: auto-hides when article has fewer than 2 headings', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <nav class="toc-nav"></nav>
    <article class="article-content">
      <h2>Only One</h2>
      <p>hello</p>
    </article>
  </body></html>`, { url: 'https://example.com/post/' });

  global.window = dom.window;
  global.document = dom.window.document;

  TocScrollSpy.initTocScrollSpy();

  const toc = dom.window.document.querySelector('.toc-nav');
  assert.ok(toc);
  assert.equal(toc.hasAttribute('hidden'), true);
  assert.equal(toc.getAttribute('aria-hidden'), 'true');
});

test('TOC: stays visible when article has 2+ headings', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <nav class="toc-nav"></nav>
    <article class="article-content">
      <h2>Intro</h2>
      <p>a</p>
      <h2>Second</h2>
      <p>b</p>
    </article>
  </body></html>`, { url: 'https://example.com/post/' });

  global.window = dom.window;
  global.document = dom.window.document;

  // Make requestAnimationFrame synchronous for test determinism.
  dom.window.requestAnimationFrame = (fn) => fn();

  TocScrollSpy.initTocScrollSpy();

  const toc = dom.window.document.querySelector('.toc-nav');
  assert.ok(toc);
  assert.equal(toc.hasAttribute('hidden'), false);

  // Auto-generated TOC should contain links.
  const links = dom.window.document.querySelectorAll('.toc-nav a[href^="#"]');
  assert.ok(links.length >= 2);
});
