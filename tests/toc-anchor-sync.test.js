const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

function setupGlobals(dom) {
  global.window = dom.window;
  global.document = dom.window.document;
  global.history = dom.window.history;
  global.location = dom.window.location;

  // JSDOM doesn't do layout; stub the functions used by toc-scrollspy.
  window.requestAnimationFrame = (cb) => cb();
  window.scrollTo = () => {};

  const header = document.querySelector('.article-nav');
  if (header) header.getBoundingClientRect = () => ({ height: 0 });

  // Stable heading tops so init doesn't crash when computing positions.
  const headings = Array.from(document.querySelectorAll('.article-content h2, .article-content h3, .article-content h4'));
  headings.forEach((h, idx) => {
    h.getBoundingClientRect = () => ({ top: 100 + idx * 200 });
  });
}

function cleanupGlobals() {
  delete global.window;
  delete global.document;
  delete global.history;
  delete global.location;
}

test('TocScrollSpy: syncs heading ids to existing TOC anchors', () => {
  const TocScrollSpy = require('../themes/evan/source/js/toc-scrollspy');

  const dom = new JSDOM(`<!doctype html><html><body>
    <nav class="article-nav"></nav>

    <aside>
      <nav class="toc-nav">
        <ol>
          <li><a href="#intro-custom">Intro</a></li>
          <li><a href="#details-custom">Details</a></li>
        </ol>
      </nav>
    </aside>

    <main class="article-content">
      <h2>Intro</h2>
      <h2>Details</h2>
    </main>
  </body></html>`, { url: 'https://example.com/post' });

  setupGlobals(dom);

  TocScrollSpy.initTocScrollSpy({
    tocSelector: '.toc-nav',
    contentSelector: '.article-content',
    headingSelector: 'h2'
  });

  const h2s = Array.from(document.querySelectorAll('.article-content h2'));
  assert.equal(h2s[0].id, 'intro-custom');
  assert.equal(h2s[1].id, 'details-custom');

  const links = Array.from(document.querySelectorAll('.toc-nav a[href^="#"]'));
  assert.equal(links[0].getAttribute('href'), '#intro-custom');
  assert.equal(links[1].getAttribute('href'), '#details-custom');

  cleanupGlobals();
});

test('TocScrollSpy: dedupes duplicate TOC ids by rewriting href', () => {
  const TocScrollSpy = require('../themes/evan/source/js/toc-scrollspy');

  const dom = new JSDOM(`<!doctype html><html><body>
    <nav class="article-nav"></nav>

    <aside>
      <nav class="toc-nav">
        <ol>
          <li><a href="#section">Section</a></li>
          <li><a href="#section">Section</a></li>
        </ol>
      </nav>
    </aside>

    <main class="article-content">
      <h2>Section</h2>
      <h2>Section</h2>
    </main>
  </body></html>`, { url: 'https://example.com/post' });

  setupGlobals(dom);

  TocScrollSpy.initTocScrollSpy({
    tocSelector: '.toc-nav',
    contentSelector: '.article-content',
    headingSelector: 'h2'
  });

  const h2s = Array.from(document.querySelectorAll('.article-content h2'));
  assert.equal(h2s[0].id, 'section');
  assert.equal(h2s[1].id, 'section-2');

  const links = Array.from(document.querySelectorAll('.toc-nav a[href^="#"]'));
  assert.equal(links[0].getAttribute('href'), '#section');
  assert.equal(links[1].getAttribute('href'), '#section-2');

  // Ensure no duplicate ids in the document.
  const ids = h2s.map((h) => h.id);
  assert.equal(new Set(ids).size, ids.length);

  cleanupGlobals();
});
