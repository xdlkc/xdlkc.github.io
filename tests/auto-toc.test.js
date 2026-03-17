const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const TocScrollSpy = require('../themes/evan/source/js/toc-scrollspy');

function setupDom(html) {
  return new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
    url: 'https://example.com/posts/toc/'
  });
}

test('buildTocIntoContainer: generates anchor links for article headings', () => {
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

  TocScrollSpy.buildTocIntoContainer(toc, headings);

  const links = Array.from(toc.querySelectorAll('a[href^="#"]'));
  assert.equal(links.length, 3);
  assert.deepEqual(
    links.map((link) => link.getAttribute('href')),
    ['#intro', '#details', '#summary']
  );
  assert.deepEqual(
    links.map((link) => link.textContent),
    ['Intro', 'Details', 'Summary']
  );
});

test('buildTocIntoContainer: nests h3/h4 under the nearest parent heading', () => {
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
  assert.equal(topLevelItems.length, 2);

  const nestedUnderFirst = toc.querySelector(':scope > ol > li:first-child > ol > li > a[href="#section-1-a"]');
  const nestedThirdLevel = toc.querySelector(':scope > ol > li:first-child > ol > li:first-child > ol > li > a[href="#section-1-a-i"]');

  assert.ok(nestedUnderFirst, 'expected h3 to nest under the first h2');
  assert.ok(nestedThirdLevel, 'expected h4 to nest under the nearest h3');
});
