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

  // Stable heading tops.
  const headings = Array.from(document.querySelectorAll('.article-content h2'));
  headings.forEach((h, idx) => {
    const absoluteTop = 100 + idx * 400;
    // Simulate real DOM behavior: as scrollY increases, getBoundingClientRect().top decreases.
    h.getBoundingClientRect = () => ({ top: absoluteTop - (window.scrollY || 0) });
  });
}

function cleanupGlobals() {
  delete global.window;
  delete global.document;
  delete global.history;
  delete global.location;
}

test('TocScrollSpy: syncs URL hash on scroll via replaceState (no history pollution)', async () => {
  const TocScrollSpy = require('../themes/evan/source/js/toc-scrollspy');

  const dom = new JSDOM(`<!doctype html><html><body>
    <nav class="article-nav"></nav>

    <aside>
      <nav class="toc-nav">
        <ol>
          <li><a href="#intro">Intro</a></li>
          <li><a href="#details">Details</a></li>
        </ol>
      </nav>
    </aside>

    <main class="article-content">
      <h2 id="intro">Intro</h2>
      <h2 id="details">Details</h2>
    </main>
  </body></html>`, { url: 'https://example.com/post' });

  setupGlobals(dom);

  let replaced = null;
  const origReplace = history.replaceState.bind(history);
  history.replaceState = (state, title, url) => {
    replaced = String(url || '');
    return origReplace(state, title, url);
  };

  // Start at top.
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });

  TocScrollSpy.initTocScrollSpy({
    tocSelector: '.toc-nav',
    contentSelector: '.article-content',
    headingSelector: 'h2'
  });

  // Scroll to the second heading region.
  Object.defineProperty(window, 'scrollY', { value: 600, configurable: true });
  window.dispatchEvent(new dom.window.Event('scroll'));

  assert.equal(replaced, '#details');
  assert.equal(location.hash, '#details');

  cleanupGlobals();
});
