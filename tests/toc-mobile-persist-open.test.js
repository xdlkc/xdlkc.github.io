const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

test('TocScrollSpy: mobile TOC <details> open state is persisted and restored', () => {
  const TocScrollSpy = require('../themes/evan/source/js/toc-scrollspy');

  const dom = new JSDOM(`<!doctype html><html><body>
    <nav class="article-nav"></nav>
    <main class="article-content">
      <h2 id="section-a">Section A</h2>
    </main>

    <details class="toc-mobile">
      <summary>TOC</summary>
      <div class="toc-mobile-body">
        <nav class="toc-nav">
          <a href="#section-a">Section A</a>
        </nav>
      </div>
    </details>
  </body></html>`, { url: 'https://example.com/post' });

  global.window = dom.window;
  global.document = dom.window.document;
  global.history = dom.window.history;
  global.location = dom.window.location;

  const header = document.querySelector('.article-nav');
  header.getBoundingClientRect = () => ({ height: 0 });

  const target = document.getElementById('section-a');
  target.getBoundingClientRect = () => ({ top: 100 });

  window.scrollTo = () => {};

  // 1) Init: default should stay collapsed.
  TocScrollSpy.initTocScrollSpy({
    tocSelector: '.toc-nav',
    contentSelector: '.article-content',
    headingSelector: 'h2',
    storage: window.localStorage
  });

  const details = document.querySelector('details.toc-mobile');
  assert.ok(details, 'expected details.toc-mobile');
  assert.ok(!details.hasAttribute('open'), 'expected default mobile TOC collapsed');

  // 2) User opens it -> persist as 1.
  details.setAttribute('open', 'open');
  details.dispatchEvent(new window.Event('toggle'));
  assert.equal(window.localStorage.getItem('xdlkc:toc:mobile-open'), '1');

  // 3) User closes it -> persist as 0.
  details.removeAttribute('open');
  details.dispatchEvent(new window.Event('toggle'));
  assert.equal(window.localStorage.getItem('xdlkc:toc:mobile-open'), '0');

  // 4) Restore: set storage to 1, then re-run init on a fresh details element.
  window.localStorage.setItem('xdlkc:toc:mobile-open', '1');
  details.removeAttribute('open');

  TocScrollSpy.initTocScrollSpy({
    tocSelector: '.toc-nav',
    contentSelector: '.article-content',
    headingSelector: 'h2',
    storage: window.localStorage
  });

  assert.ok(details.hasAttribute('open'), 'expected init to restore mobile TOC open state from storage');

  delete global.window;
  delete global.document;
  delete global.history;
  delete global.location;
});
