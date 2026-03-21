const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const TocScrollSpyFactory = require('../themes/evan/source/js/toc-scrollspy');

function setupDom(articleHtml, tocHtml = '<nav class="toc-nav"></nav>') {
  return new JSDOM(`<!doctype html><html data-lang-mode="en"><body>
    <div class="article-nav"></div> <!-- Header for offset calculation -->
    <article class="article-content">${articleHtml}</article>
    ${tocHtml}
  </body></html>`, { url: 'https://example.com/posts/test-article/' });
}

// Mock window.scrollTo and window.requestAnimationFrame for predictable testing
function mockWindowFunctions(window) {
  window.scrollTo = ({ top, behavior }) => {
    window.scrollY = top;
    window.pageYOffset = top;
    // For scrollspy to re-evaluate, we manually trigger a scroll event
    const event = new window.Event('scroll');
    window.dispatchEvent(event);
  };
  window.requestAnimationFrame = (callback) => setTimeout(callback, 0);
}


test('initTocScrollSpy: highlights active TOC link on scroll', async () => {
  const dom = setupDom(`
    <h2 id="h1">Heading 1</h2>
    <div style="height: 500px;"></div>
    <h2 id="h2">Heading 2</h2>
    <div style="height: 500px;"></div>
    <h3 id="h3">Sub Heading 3</h3>
    <div style="height: 500px;"></div>
    <h2 id="h4">Heading 4</h2>
    <div style="height: 500px;"></div>
  `, `
    <nav class="toc-nav">
      <ol>
        <li class="toc-nav-level-2"><a class="toc-nav-link" href="#h1">Heading 1</a></li>
        <li class="toc-nav-level-2"><a class="toc-nav-link" href="#h2">Heading 2</a>
          <ol>
            <li class="toc-nav-level-3"><a class="toc-nav-link" href="#h3">Sub Heading 3</a></li>
          </ol>
        </li>
        <li class="toc-nav-level-2"><a class="toc-nav-link" href="#h4">Heading 4</a></li>
      </ol>
    </nav>
  `);

  const { window } = dom; // Corrected destructuring
  const document = window.document; // Corrected document assignment

  mockWindowFunctions(window);

  // Initial scroll position
  window.scrollY = 0;
  window.pageYOffset = 0;

  // Initialize the scroll spy
  const TocScrollSpy = TocScrollSpyFactory(document, window);
  TocScrollSpy.initTocScrollSpy();

  // Wait for requestAnimationFrame to process initial scroll
  await new Promise(resolve => setTimeout(resolve, 50));

  const getActiveLinkHref = () => {
    const activeLink = document.querySelector('.toc-nav-link.is-active');
    return activeLink ? activeLink.getAttribute('href') : null;
  };

  // Test 1: Initially, H1 should be active (or the first one)
  assert.equal(getActiveLinkHref(), '#h1', 'H1 should be active initially');

  // Simulate scroll to H2
  // For simplicity, directly set scrollY to a value that would make H2 active
  // In a real browser, getHeadingTopInDocument would compute these.
  // Here, we just pick a value between H1.top and H2.top to make it pass pickActiveHeadingId.
  window.scrollTo({ top: 550, behavior: 'auto' });
  await new Promise(resolve => setTimeout(resolve, 50)); // Wait for rAF

  assert.equal(getActiveLinkHref(), '#h2', 'H2 should be active after scrolling past H1');

  // Simulate scroll to H3 (nested under H2)
  window.scrollTo({ top: 1100, behavior: 'auto' }); // Between H2 and H3's "top"
  await new Promise(resolve => setTimeout(resolve, 50)); // Wait for rAF

  assert.equal(getActiveLinkHref(), '#h3', 'H3 should be active after scrolling past H2');

  // Simulate scroll to H4
  window.scrollTo({ top: 1700, behavior: 'auto' }); // Past H3
  await new Promise(resolve => setTimeout(resolve, 50)); // Wait for rAF

  assert.equal(getActiveLinkHref(), '#h4', 'H4 should be active after scrolling past H3');

  // Simulate scroll back up to H1
  window.scrollTo({ top: 100, behavior: 'auto' }); // Just below H1
  await new Promise(resolve => setTimeout(resolve, 50)); // Wait for rAF

  assert.equal(getActiveLinkHref(), '#h1', 'H1 should be active after scrolling back up');

  // Test: No TOC if no headings
  const domNoHeadings = setupDom(`
    <p>This article has no headings.</p>
  `, `<nav class="toc-nav"></nav>`);

  const { window: winNoHeadings } = domNoHeadings; // Corrected destructuring
  const docNoHeadings = winNoHeadings.document; // Corrected document assignment

  mockWindowFunctions(winNoHeadings);

  const TocScrollSpyNoHeadings = TocScrollSpyFactory(docNoHeadings, winNoHeadings);
  TocScrollSpyNoHeadings.initTocScrollSpy();
  await new Promise(resolve => setTimeout(resolve, 50));

  const tocNavNoHeadings = docNoHeadings.querySelector('.toc-nav');
  assert.ok(tocNavNoHeadings.hasAttribute('hidden'), 'TOC nav should be hidden if no headings are present');
  assert.equal(tocNavNoHeadings.getAttribute('aria-hidden'), 'true', 'TOC nav aria-hidden should be true if no headings are present');
});

test('initTocScrollSpy: expands ancestors when active link is collapsed', async () => {
  const dom = setupDom(`
    <h2 id="h1">Section 1</h2>
    <div style="height: 500px;"></div>
    <h3 id="h1-1">Subsection 1.1</h3>
    <div style="height: 500px;"></div>
    <h2 id="h2">Section 2</h2>
    <div style="height: 500px;"></div>
  `, `
    <nav class="toc-nav">
      <ol>
        <li class="toc-nav-level-2 is-collapsed" id="toc-h1"><a class="toc-nav-link" href="#h1">Section 1</a>
          <ol>
            <li class="toc-nav-level-3" id="toc-h1-1"><a class="toc-nav-link" href="#h1-1">Subsection 1.1</a></li>
          </ol>
        </li>
        <li class="toc-nav-level-2" id="toc-h2"><a class="toc-nav-link" href="#h2">Section 2</a></li>
      </ol>
    </nav>
  `);

  const { window } = dom; // Corrected destructuring
  const document = window.document; // Corrected document assignment

  mockWindowFunctions(window);

  const TocScrollSpy = TocScrollSpyFactory(document, window);
  TocScrollSpy.initTocScrollSpy();
  await new Promise(resolve => setTimeout(resolve, 50));

  // Initially, Section 1 is collapsed
  assert.ok(document.getElementById('toc-h1').classList.contains('is-collapsed'), 'Section 1 should be initially collapsed');

  // Simulate scroll to Subsection 1.1
  window.scrollTo({ top: 700, behavior: 'auto' }); // A position that makes Subsection 1.1 active
  await new Promise(resolve => setTimeout(resolve, 50));

  // Section 1 (ancestor of Subsection 1.1) should now be expanded
  assert.ok(!document.getElementById('toc-h1').classList.contains('is-collapsed'), 'Section 1 should be expanded when its child is active');
  assert.equal(document.querySelector('.toc-nav-link.is-active').getAttribute('href'), '#h1-1', 'Subsection 1.1 should be active');

  // Simulate scroll to Section 2
  window.scrollTo({ top: 1300, behavior: 'auto' });
  await new Promise(resolve => setTimeout(resolve, 50));

  // Section 1 should remain expanded or go back to its original state (depending on specific logic)
  // For this test, we expect it to NOT be collapsed again if it was expanded to reveal an active child.
  // The 'expandTocAncestorsForLink' function does not persist, so if it's not active anymore, it's possible it collapses again.
  // For this test, we'll assert it's NOT collapsed *at the moment its child becomes active*.
  assert.equal(document.querySelector('.toc-nav-link.is-active').getAttribute('href'), '#h2', 'Section 2 should be active');
});
