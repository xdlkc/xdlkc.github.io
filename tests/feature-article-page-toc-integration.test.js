const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const path = require('node:path');

// Mock `url_for` and other Hexo/EJS helpers if needed, but for client-side JS test,
// we mostly care about the resulting HTML structure and JS execution.
const TOC_SCROLLSPY_PATH = path.resolve(__dirname, '../themes/evan/source/js/toc-scrollspy.js');

test('TocScrollSpy: client-side enhances server-generated content with IDs, anchors, and smooth scroll', async () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <nav class="article-nav"></nav>

    <div class="article-layout">
      <main id="main-content" class="article-card" tabindex="-1">
        <article class="article-content">
          <h2>First Section Title</h2>
          <h3>Sub-Section One</h3>
          <h2>Second Section Title</h2>
        </article>
      </main>

      <aside class="toc-card toc-sidebar" data-toc-sidebar>
        <div class="toc-header">
          <p class="toc-title">Outline</p>
        </div>
        <div class="toc-content" id="toc-content-desktop">
          <!-- Server-generated TOC placeholder -->
          <ol class="toc-nav">
            <li class="toc-nav-level-2"><a class="toc-nav-link" href="#first-section-title">First Section Title</a></li>
            <li class="toc-nav-level-3"><a class="toc-nav-link" href="#sub-section-one">Sub-Section One</a></li>
            <li class="toc-nav-level-2"><a class="toc-nav-link" href="#second-section-title">Second Section Title</a></li>
          </ol>
        </div>
      </aside>
    </div>
  </body></html>`, { url: 'https://example.com/post/my-article' });

  global.window = dom.window;
  global.document = dom.window.document;
  global.history = dom.window.history;
  global.location = dom.window.location;
  dom.window.localStorage = { // Mock localStorage
    getItem: () => null,
    setItem: () => {},
    clear: () => {}
  };

  // Mock smooth scroll
  let scrollCalled = false;
  let scrollTargetTop = 0;
  let scrollBehavior = '';
  global.window.scrollTo = ({ top, behavior }) => {
    scrollCalled = true;
    scrollTargetTop = top;
    scrollBehavior = behavior;
  };

  // Mock pushState
  let pushStateCalled = false;
  let pushStateHash = '';
  global.window.history.pushState = (state, title, url) => {
    pushStateCalled = true;
    pushStateHash = url;
  };

  // JSDOM doesn't do layout; stub the functions used by toc-scrollspy.
  window.requestAnimationFrame = (cb) => cb();

  const articleNav = document.querySelector('.article-nav');
  articleNav.getBoundingClientRect = () => ({ height: 0 }); // Mock header height

  const h2s = Array.from(document.querySelectorAll('.article-content h2'));
  const h3s = Array.from(document.querySelectorAll('.article-content h3'));
  h2s[0].getBoundingClientRect = () => ({ top: 100 });
  h3s[0].getBoundingClientRect = () => ({ top: 300 });
  h2s[1].getBoundingClientRect = () => ({ top: 500 });

  // Load and initialize the TocScrollSpy module
  const TocScrollSpyFactory = require(TOC_SCROLLSPY_PATH);
  const TocScrollSpy = TocScrollSpyFactory(global.document, global.window);

  TocScrollSpy.initTocScrollSpy({
    tocSelector: '.toc-nav',
    contentSelector: '.article-content',
    headingSelector: 'h2, h3' // Explicitly test with H2, H3
  });

  // --- Assertions ---

  // 1. Headings should have IDs and anchor links
  const firstH2 = document.querySelector('.article-content h2');
  assert.ok(firstH2.id, 'First H2 should have an ID');
  assert.equal(firstH2.id, 'first-section-title', 'First H2 ID should be slugified');
  assert.ok(firstH2.querySelector(':scope > .heading-anchor'), 'First H2 should have an anchor link');

  const firstH3 = document.querySelector('.article-content h3');
  assert.ok(firstH3.id, 'First H3 should have an ID');
  assert.equal(firstH3.id, 'sub-section-one', 'First H3 ID should be slugified');
  assert.ok(firstH3.querySelector(':scope > .heading-anchor'), 'First H3 should have an anchor link');

  // 2. Clicking a TOC link should trigger smooth scroll and history pushState
  const tocLink = document.querySelector('.toc-nav a[href="#first-section-title"]');
  assert.ok(tocLink, 'TOC link for First Section Title should exist');

  // Simulate click
  scrollCalled = false;
  pushStateCalled = false;
  tocLink.click();

  assert.ok(scrollCalled, 'window.scrollTo should be called on TOC link click');
  assert.equal(scrollBehavior, 'smooth', 'scroll behavior should be smooth');
  // The exact scrollTargetTop is hard to assert without full layouting, but we can check if it's a number
  assert.ok(Number.isFinite(scrollTargetTop), 'scrollTargetTop should be a finite number');

  assert.ok(pushStateCalled, 'history.pushState should be called on TOC link click');
  assert.equal(pushStateHash, `#${firstH2.id}`, 'history.pushState should update hash to target ID');

  delete global.window;
  delete global.document;
  delete global.history;
  delete global.location;
});
