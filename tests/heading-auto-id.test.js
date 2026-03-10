const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

// NOTE: module will be added by this feature.
const HeadingAutoId = require('../themes/evan/source/js/heading-auto-id.js');

function setupDom(html) {
  const dom = new JSDOM(html, { url: 'https://xdlkc.github.io/2026/03/11/demo/' });
  return dom;
}

test('ensureHeadingIds: adds id for headings without id and preserves existing ids', () => {
  const dom = setupDom(`
    <!doctype html>
    <html><body>
      <article class="article-content">
        <h2>Quick Start</h2>
        <h2 id="keep">Keep Me</h2>
      </article>
    </body></html>
  `);

  const document = dom.window.document;
  const container = document.querySelector('.article-content');

  HeadingAutoId.ensureHeadingIds({ container });

  const h1 = container.querySelectorAll('h2')[0];
  const h2 = container.querySelectorAll('h2')[1];

  assert.ok(h1.getAttribute('id'), 'missing id should be added');
  assert.equal(h2.getAttribute('id'), 'keep', 'existing id should be preserved');
});

test('ensureHeadingIds: dedupes duplicate slugs with numeric suffix', () => {
  const dom = setupDom(`
    <!doctype html>
    <html><body>
      <article class="article-content">
        <h3>Same Title</h3>
        <h3>Same Title</h3>
        <h3>Same Title</h3>
      </article>
    </body></html>
  `);

  const document = dom.window.document;
  const container = document.querySelector('.article-content');

  HeadingAutoId.ensureHeadingIds({ container });

  const headings = Array.from(container.querySelectorAll('h3'));
  const ids = headings.map((h) => h.getAttribute('id'));

  assert.equal(new Set(ids).size, 3, 'ids should be unique');
  assert.ok(ids[1].endsWith('-2'), 'second duplicate should end with -2');
  assert.ok(ids[2].endsWith('-3'), 'third duplicate should end with -3');
});

test('repairTocLinks: fixes broken toc hrefs by matching heading text in order', () => {
  const dom = setupDom(`
    <!doctype html>
    <html><body>
      <aside>
        <ol class="toc-nav">
          <li><a href="#bad">Intro</a></li>
          <li><a href="#also-bad">Intro</a></li>
        </ol>
      </aside>
      <article class="article-content">
        <h2>Intro</h2>
        <p>...</p>
        <h2>Intro</h2>
      </article>
    </body></html>
  `);

  const document = dom.window.document;
  const container = document.querySelector('.article-content');
  const toc = document.querySelector('.toc-nav');

  // ids not present initially
  HeadingAutoId.ensureHeadingIds({ container });
  HeadingAutoId.repairTocLinks({ document, tocSelector: '.toc-nav', containerSelector: '.article-content' });

  const links = Array.from(toc.querySelectorAll('a'));
  const headings = Array.from(container.querySelectorAll('h2'));

  assert.equal(links[0].getAttribute('href'), `#${headings[0].id}`);
  assert.equal(links[1].getAttribute('href'), `#${headings[1].id}`);
});
