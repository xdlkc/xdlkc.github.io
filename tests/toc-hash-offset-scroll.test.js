const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

test('TOC: on initial load with location.hash, scrolls to heading with header offset', () => {
  const TocScrollSpy = require('../themes/evan/source/js/toc-scrollspy');

  const dom = new JSDOM(`<!doctype html><html><body>
    <nav class="article-nav"></nav>
    <main class="article-content">
      <h2 id="section-a">Section A</h2>
    </main>
    <nav class="toc-nav">
      <a href="#section-a">Section A</a>
    </nav>
  </body></html>`, { url: 'https://example.com/post#section-a' });

  global.window = dom.window;
  global.document = dom.window.document;
  global.history = dom.window.history;
  global.location = dom.window.location;

  // Stub layout.
  const header = document.querySelector('.article-nav');
  header.getBoundingClientRect = () => ({ height: 50 });

  const target = document.getElementById('section-a');
  target.getBoundingClientRect = () => ({ top: 200 });

  let called = null;
  window.scrollTo = (arg) => { called = arg; };

  TocScrollSpy.initTocScrollSpy({
    tocSelector: '.toc-nav',
    contentSelector: '.article-content',
    headingSelector: 'h2'
  });

  assert.ok(called, 'expected window.scrollTo to be called');
  assert.equal(called.top, 138);

  delete global.window;
  delete global.document;
  delete global.history;
  delete global.location;
});

test('TOC: on hashchange, scrolls to heading with header offset', () => {
  const TocScrollSpy = require('../themes/evan/source/js/toc-scrollspy');

  const dom = new JSDOM(`<!doctype html><html><body>
    <nav class="article-nav"></nav>
    <main class="article-content">
      <h2 id="section-a">Section A</h2>
      <h2 id="section-b">Section B</h2>
    </main>
    <nav class="toc-nav">
      <a href="#section-a">Section A</a>
      <a href="#section-b">Section B</a>
    </nav>
  </body></html>`, { url: 'https://example.com/post' });

  global.window = dom.window;
  global.document = dom.window.document;
  global.history = dom.window.history;
  global.location = dom.window.location;

  const header = document.querySelector('.article-nav');
  header.getBoundingClientRect = () => ({ height: 40 });

  const a = document.getElementById('section-a');
  a.getBoundingClientRect = () => ({ top: 100 });

  const b = document.getElementById('section-b');
  b.getBoundingClientRect = () => ({ top: 300 });

  let tops = [];
  window.scrollTo = (arg) => { tops.push(arg.top); };

  TocScrollSpy.initTocScrollSpy({
    tocSelector: '.toc-nav',
    contentSelector: '.article-content',
    headingSelector: 'h2'
  });

  // Simulate navigation to #section-b.
  window.location.hash = '#section-b';
  window.dispatchEvent(new window.HashChangeEvent('hashchange'));

  assert.ok(tops.length >= 1, 'expected scrollTo to be called on hashchange');
  assert.equal(tops[tops.length - 1], 248);

  delete global.window;
  delete global.document;
  delete global.history;
  delete global.location;
});
