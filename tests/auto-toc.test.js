const { JSDOM } = require('jsdom');
// Import the factory function
const TocScrollSpyFactory = require('../themes/evan/source/js/toc-scrollspy');

function setupDom(html) {
  return new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
    url: 'https://example.com/posts/toc/'
  });
}

describe('buildTocIntoContainer', () => { // Use describe for grouping tests
  let TocScrollSpy; // Declare a variable to hold the instantiated object

  beforeEach(() => {
    // Instantiate TocScrollSpy for each test
    const dom = setupDom('<div></div>'); // A minimal DOM for instantiation
    TocScrollSpy = TocScrollSpyFactory(dom.window.document, dom.window);
  });

  test('generates anchor links for article headings', () => { // Use Jest's test
    const dom = setupDom(`
      <nav class="toc-nav"></nav>
      <article class="article-content">
        <h2 id="intro">Intro</h2>
        <h3 id="details">Details</h3>
        <h2 id="summary">Summary</h2>
      </article>
    `);

    const { document } = dom.window;
    const toc = document.querySelector('.toc-nav');
    const headings = Array.from(document.querySelectorAll('.article-content h2, .article-content h3'));

    TocScrollSpy.buildTocIntoContainer(toc, headings); // Now TocScrollSpy is the object

    const links = Array.from(toc.querySelectorAll('a[href^="#"]'));
    expect(links.length).toBe(3); // Use Jest's expect
    expect(
      links.map((link) => link.getAttribute('href'))
    ).toEqual(['#intro', '#details', '#summary']); // Use Jest's toEqual
    expect(
      links.map((link) => link.textContent)
    ).toEqual(['Intro', 'Details', 'Summary']); // Use Jest's toEqual
  });

  test('nests h3/h4 under the nearest parent heading', () => { // Use Jest's test
    const dom = setupDom(`
      <nav class="toc-nav"></nav>
      <article class="article-content">
        <h2 id="section-1">Section 1</h2>
        <h3 id="section-1-a">Section 1.A</h3>
        <h4 id="section-1-a-i">Section 1.A.I</h4>
        <h2 id="section-2">Section 2</h2>
      </article>
    `);

    const { document } = dom.window;
    const toc = document.querySelector('.toc-nav');
    const headings = Array.from(document.querySelectorAll('.article-content h2, .article-content h3, .article-content h4'));

    TocScrollSpy.buildTocIntoContainer(toc, headings);

    const topLevelItems = toc.querySelectorAll(':scope > ol > li');
    expect(topLevelItems.length).toBe(2);

    const nestedUnderFirst = toc.querySelector(':scope > ol > li:first-child > ol > li > a[href="#section-1-a"]');
    const nestedThirdLevel = toc.querySelector(':scope > ol > li:first-child > ol > li:first-child > ol > li > a[href="#section-1-a-i"]');

    expect(nestedUnderFirst).toBeTruthy();
    expect(nestedThirdLevel).toBeTruthy();
  });
});
