const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const TocScrollSpyFactory = require('../themes/evan/source/js/toc-scrollspy');
const TocScrollSpy = TocScrollSpyFactory();

test('computeTocScrollTopToReveal keeps scrollTop when active link is already visible', () => {
  const next = TocScrollSpy.computeTocScrollTopToReveal({
    containerScrollTop: 100,
    containerHeight: 200,
    linkTop: 120,
    linkHeight: 24,
  });

  assert.equal(next, 100);
});

test('computeTocScrollTopToReveal scrolls up when active link is above view', () => {
  const next = TocScrollSpy.computeTocScrollTopToReveal({
    containerScrollTop: 300,
    containerHeight: 200,
    linkTop: 240,
    linkHeight: 24,
  });

  assert.equal(next, 240);
});

test('computeTocScrollTopToReveal scrolls down when active link is below view', () => {
  const next = TocScrollSpy.computeTocScrollTopToReveal({
    containerScrollTop: 100,
    containerHeight: 200,
    linkTop: 360,
    linkHeight: 24,
  });

  // linkBottom = 384; viewBottom = 300 => need +84
  assert.equal(next, 184);
});

test('initTocScrollSpy scrolls the desktop sidebar to reveal the active link', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <article class="article-content">
      <h2 id="first">First</h2>
      <h2 id="second">Second</h2>
    </article>
    <aside class="toc-sidebar">
      <div class="toc-content">
        <ol class="toc-nav">
          <li><a href="#first">First</a></li>
          <li><a href="#second">Second</a></li>
        </ol>
      </div>
    </aside>
  </body></html>`, { url: 'https://example.com/posts/test/' });
  const { window } = dom;
  const { document } = window;
  const sidebar = document.querySelector('.toc-sidebar');
  const toc = document.querySelector('.toc-nav');
  const links = Array.from(toc.querySelectorAll('a'));
  const headings = Array.from(document.querySelectorAll('h2'));

  Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 0 });
  window.requestAnimationFrame = (callback) => { callback(); };
  headings.forEach((heading, index) => {
    heading.getBoundingClientRect = () => ({ top: index * 500 - window.scrollY });
  });

  Object.defineProperty(sidebar, 'clientHeight', { configurable: true, value: 100 });
  Object.defineProperty(sidebar, 'scrollHeight', { configurable: true, value: 300 });
  sidebar.scrollTop = 0;
  sidebar.getBoundingClientRect = () => ({ top: 0 });
  sidebar.scrollTo = ({ top }) => { sidebar.scrollTop = top; };

  // The list itself is not the scroll container in the production layout.
  Object.defineProperty(toc, 'clientHeight', { configurable: true, value: 300 });
  Object.defineProperty(toc, 'scrollHeight', { configurable: true, value: 300 });
  links.forEach((link, index) => {
    link.getBoundingClientRect = () => ({
      top: 20 + index * 230 - sidebar.scrollTop,
      height: 20,
    });
  });

  const scrollSpy = TocScrollSpyFactory(document, window);
  scrollSpy.initTocScrollSpy();
  assert.equal(sidebar.scrollTop, 0, 'initial visible link should not scroll the sidebar');

  window.scrollY = 500;
  window.dispatchEvent(new window.Event('scroll'));

  assert.equal(toc.querySelector('.is-active').getAttribute('href'), '#second');
  assert.equal(sidebar.scrollTop, 170, 'sidebar should reveal the active link below its viewport');
});
