const { JSDOM } = require('jsdom');
// Require the factory function directly
const TocScrollSpyFactory = require('../themes/evan/source/js/toc-scrollspy');

function setupDom(html, url = 'https://example.com/posts/test-article/') {
  return new JSDOM(`<!doctype html><html><head></head><body>${html}</body></html>`, {
    url: url,
    runScripts: 'dangerously',
    resources: 'usable'
  });
}

describe('Article TOC Anchor Functionality', () => { // Use describe for grouping
  let TocScrollSpy; // Declare a variable to hold the instantiated object
  let dom;
  let document;
  let window;

  beforeEach(() => {
    // Re-setup DOM and instantiate TocScrollSpy for each test to ensure isolation
    dom = setupDom(`
      <div class="article-layout">
        <main class="article-card">
          <article class="article-content">
            <h2 id="section-1">Section 1</h2>
            <p>Some content.</p>
            <h3 id="section-1-1">Section 1.1</h3>
            <p>More content.</p>
          </article>
        </main>
        <aside class="toc-card toc-sidebar">
          <div class="toc-content" id="toc-content-desktop">
            <nav class="toc-nav"></nav>
          </div>
        </aside>
      </div>
    `);
    ({ document, window } = dom.window);
    TocScrollSpy = TocScrollSpyFactory(document, window);
  });

  test('Article page with headings should have a TOC container', () => {
    TocScrollSpy.initTocScrollSpy({
      tocSelector: '.toc-card .toc-nav',
      contentSelector: '.article-content',
      headingSelector: 'h2, h3'
    });

    const tocContainer = document.querySelector('aside.toc-card.toc-sidebar .toc-nav');
    expect(tocContainer).not.toBeNull(); // Use Jest's expect
    expect(tocContainer.innerHTML.trim()).not.toBe(''); // Use Jest's expect
  });

  test('Article page headings should have anchor links', () => {
    // Need to re-setup DOM for this test's specific content
    dom = setupDom(`
      <article class="article-content">
        <h2 id="section-a">Section A</h2>
        <h3 id="section-b">Section B</h3>
      </article>
    `);
    ({ document, window } = dom.window);
    TocScrollSpy = TocScrollSpyFactory(document, window); // Re-instantiate

    TocScrollSpy.initTocScrollSpy({
      tocSelector: '.toc-nav',
      contentSelector: '.article-content',
      headingSelector: 'h2, h3'
    });

    const h2 = document.querySelector('h2#section-a');
    const h3 = document.querySelector('h3#section-b');

    const h2Anchor = h2 ? h2.querySelector('a.heading-anchor') : null;
    const h3Anchor = h3 ? h3.querySelector('a.heading-anchor') : null;

    expect(h2Anchor).not.toBeNull();
    expect(h3Anchor).not.toBeNull();
  });
});
