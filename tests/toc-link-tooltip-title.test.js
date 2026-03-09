const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

function setupDom(html, { url = 'https://example.com/post' } = {}) {
  const dom = new JSDOM(html, { url });
  global.window = dom.window;
  global.document = dom.window.document;
  global.history = dom.window.history;
  global.location = dom.window.location;

  // JSDOM doesn't do layout; stub minimal APIs used.
  window.requestAnimationFrame = (cb) => cb();
  window.scrollTo = () => {};

  const header = document.querySelector('.article-nav');
  if (header) header.getBoundingClientRect = () => ({ height: 0 });

  return dom;
}

function teardownDom() {
  delete global.window;
  delete global.document;
  delete global.history;
  delete global.location;
}

test('TocScrollSpy: auto-generated TOC links should have title tooltip', () => {
  const TocScrollSpy = require('../themes/evan/source/js/toc-scrollspy');

  setupDom(`<!doctype html><html><body>
    <nav class="article-nav"></nav>
    <aside><nav class="toc-nav"></nav></aside>
    <main class="article-content">
      <h2>一个很长很长的标题 Long Long Heading</h2>
      <h3>Details</h3>
    </main>
  </body></html>`);

  const h2 = document.querySelector('h2');
  const h3 = document.querySelector('h3');
  h2.getBoundingClientRect = () => ({ top: 100 });
  h3.getBoundingClientRect = () => ({ top: 300 });

  TocScrollSpy.initTocScrollSpy({
    tocSelector: '.toc-nav',
    contentSelector: '.article-content',
    headingSelector: 'h2, h3'
  });

  const links = Array.from(document.querySelectorAll('.toc-nav a[href^="#"]'));
  assert.equal(links.length, 2);

  assert.equal(links[0].getAttribute('title'), links[0].textContent.trim());
  assert.equal(links[1].getAttribute('title'), links[1].textContent.trim());

  teardownDom();
});

test('TocScrollSpy: existing TOC links should be backfilled with title when missing, but not overwritten', () => {
  const TocScrollSpy = require('../themes/evan/source/js/toc-scrollspy');

  setupDom(`<!doctype html><html><body>
    <nav class="article-nav"></nav>
    <aside>
      <nav class="toc-nav">
        <a class="toc-nav-link" href="#keep">Keep</a>
        <a class="toc-nav-link" href="#has-title" title="Already">Has title</a>
      </nav>
    </aside>
    <main class="article-content">
      <h2 id="keep">Keep</h2>
      <h2 id="has-title">Has title</h2>
    </main>
  </body></html>`);

  const keep = document.getElementById('keep');
  const hasTitle = document.getElementById('has-title');
  keep.getBoundingClientRect = () => ({ top: 100 });
  hasTitle.getBoundingClientRect = () => ({ top: 300 });

  TocScrollSpy.initTocScrollSpy({
    tocSelector: '.toc-nav',
    contentSelector: '.article-content',
    headingSelector: 'h2'
  });

  const keepLink = document.querySelector('.toc-nav a[href="#keep"]');
  const hasTitleLink = document.querySelector('.toc-nav a[href="#has-title"]');
  assert.ok(keepLink);
  assert.ok(hasTitleLink);

  assert.equal(keepLink.getAttribute('title'), 'Keep');
  assert.equal(hasTitleLink.getAttribute('title'), 'Already');

  teardownDom();
});
