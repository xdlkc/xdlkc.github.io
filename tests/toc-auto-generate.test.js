const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

test('TocScrollSpy: auto-generates TOC links when .toc-nav is empty', () => {
  const TocScrollSpy = require('../themes/evan/source/js/toc-scrollspy');

  const dom = new JSDOM(`<!doctype html><html><body>
    <nav class="article-nav"></nav>

    <aside>
      <nav class="toc-nav"></nav>
    </aside>

    <main class="article-content">
      <h2>Intro</h2>
      <h3>Details</h3>
    </main>
  </body></html>`, { url: 'https://example.com/post' });

  global.window = dom.window;
  global.document = dom.window.document;
  global.history = dom.window.history;
  global.location = dom.window.location;

  // JSDOM doesn't do layout; stub the functions used by toc-scrollspy.
  window.requestAnimationFrame = (cb) => cb();
  window.scrollTo = () => {};

  const header = document.querySelector('.article-nav');
  header.getBoundingClientRect = () => ({ height: 0 });

  // Stable heading tops so init doesn't crash when computing positions.
  const h2 = document.querySelector('h2');
  const h3 = document.querySelector('h3');
  h2.getBoundingClientRect = () => ({ top: 100 });
  h3.getBoundingClientRect = () => ({ top: 300 });

  TocScrollSpy.initTocScrollSpy({
    tocSelector: '.toc-nav',
    contentSelector: '.article-content',
    headingSelector: 'h2, h3'
  });

  const links = Array.from(document.querySelectorAll('.toc-nav a[href^="#"]'));
  assert.equal(links.length, 2);

  // Should preserve heading hierarchy as nested lists: h3 should be nested under h2.
  const topOl = document.querySelector('.toc-nav > ol');
  assert.ok(topOl, 'expected .toc-nav to contain a top-level <ol>');

  const topItems = Array.from(topOl.children).filter((el) => el && el.tagName === 'LI');
  assert.equal(topItems.length, 1, 'expected a single top-level li for h2');
  assert.ok(topItems[0].classList.contains('toc-nav-level-2'));

  const nestedOl = Array.from(topItems[0].children).find((el) => el && el.tagName === 'OL');
  assert.ok(nestedOl, 'expected h3 entries to be nested inside h2 li > ol');

  const nestedItems = Array.from(nestedOl.children).filter((el) => el && el.tagName === 'LI');
  assert.equal(nestedItems.length, 1);
  assert.ok(nestedItems[0].classList.contains('toc-nav-level-3'));

  // Should create ids for headings.
  assert.ok(document.querySelector('h2').id);
  assert.ok(document.querySelector('h3').id);

  assert.equal(links[0].textContent.trim(), 'Intro');
  assert.equal(links[1].textContent.trim(), 'Details');

  assert.equal(links[0].getAttribute('href'), `#${document.querySelector('h2').id}`);
  assert.equal(links[1].getAttribute('href'), `#${document.querySelector('h3').id}`);

  delete global.window;
  delete global.document;
  delete global.history;
  delete global.location;
});

test('TocScrollSpy: does not overwrite existing TOC links', () => {
  const TocScrollSpy = require('../themes/evan/source/js/toc-scrollspy');

  const dom = new JSDOM(`<!doctype html><html><body>
    <nav class="article-nav"></nav>

    <aside>
      <nav class="toc-nav">
        <a href="#keep">Keep</a>
      </nav>
    </aside>

    <main class="article-content">
      <h2 id="keep">Intro</h2>
      <h2 id="new">New</h2>
    </main>
  </body></html>`, { url: 'https://example.com/post' });

  global.window = dom.window;
  global.document = dom.window.document;
  global.history = dom.window.history;
  global.location = dom.window.location;

  window.requestAnimationFrame = (cb) => cb();
  window.scrollTo = () => {};

  const header = document.querySelector('.article-nav');
  header.getBoundingClientRect = () => ({ height: 0 });

  const keep = document.getElementById('keep');
  const newly = document.getElementById('new');
  keep.getBoundingClientRect = () => ({ top: 100 });
  newly.getBoundingClientRect = () => ({ top: 300 });

  TocScrollSpy.initTocScrollSpy({
    tocSelector: '.toc-nav',
    contentSelector: '.article-content',
    headingSelector: 'h2'
  });

  const html = document.querySelector('.toc-nav').innerHTML;
  assert.ok(html.includes('Keep'));
  assert.ok(!html.includes('New'), 'expected no auto-generated entries when toc already exists');

  delete global.window;
  delete global.document;
  delete global.history;
  delete global.location;
});
