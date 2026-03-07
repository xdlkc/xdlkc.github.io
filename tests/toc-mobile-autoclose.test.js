const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

test('TocScrollSpy: clicking a TOC link inside mobile <details> closes it', () => {
  const TocScrollSpy = require('../themes/evan/source/js/toc-scrollspy');

  const dom = new JSDOM(`<!doctype html><html><body>
    <nav class="article-nav"></nav>
    <main class="article-content">
      <h2 id="section-a">Section A</h2>
    </main>

    <details class="toc-mobile" open>
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

  // JSDOM doesn't implement layout; stub minimal APIs used.
  const header = document.querySelector('.article-nav');
  header.getBoundingClientRect = () => ({ height: 0 });

  const target = document.getElementById('section-a');
  target.getBoundingClientRect = () => ({ top: 100 });

  window.scrollTo = () => {};

  TocScrollSpy.initTocScrollSpy({
    tocSelector: '.toc-nav',
    contentSelector: '.article-content',
    headingSelector: 'h2'
  });

  const details = document.querySelector('details.toc-mobile');
  assert.ok(details.hasAttribute('open'));

  const link = document.querySelector('.toc-nav a');
  link.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));

  assert.ok(!details.hasAttribute('open'), 'expected mobile TOC <details> to be closed after click');

  delete global.window;
  delete global.document;
  delete global.history;
  delete global.location;
});
