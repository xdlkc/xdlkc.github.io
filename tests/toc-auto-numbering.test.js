const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { initTocScrollSpy } = require('../themes/evan/source/js/toc-scrollspy');

test('TOC Auto-numbering: should add .toc-index to TOC links', () => {
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <body>
        <div class="toc-nav">
          <ol>
            <li class="toc-nav-level-2">
              <a class="toc-nav-link" href="#section-1">Introduction</a>
            </li>
            <li class="toc-nav-level-2">
              <a class="toc-nav-link" href="#section-2">Getting Started</a>
            </li>
            <li class="toc-nav-level-2">
              <a class="toc-nav-link" href="#section-3">Advanced Topics</a>
            </li>
          </ol>
        </div>
        <div id="section-1">Section 1</div>
        <div id="section-2">Section 2</div>
        <div id="section-3">Section 3</div>
      </body>
    </html>
  `);
  const doc = dom.window.document;
  const toc = doc.querySelector('.toc-nav');

  initTocScrollSpy({ document: doc });

  const links = toc.querySelectorAll('a.toc-nav-link');
  links.forEach((link) => {
    assert.ok(link.querySelector('.toc-index'));
  });
});

test('TOC Auto-numbering: should number single-level TOC as 1, 2, 3', () => {
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <body>
        <div class="toc-nav">
          <ol>
            <li class="toc-nav-level-2">
              <a class="toc-nav-link" href="#section-1">Introduction</a>
            </li>
            <li class="toc-nav-level-2">
              <a class="toc-nav-link" href="#section-2">Getting Started</a>
            </li>
            <li class="toc-nav-level-2">
              <a class="toc-nav-link" href="#section-3">Advanced Topics</a>
            </li>
          </ol>
        </div>
        <div id="section-1">Section 1</div>
        <div id="section-2">Section 2</div>
        <div id="section-3">Section 3</div>
      </body>
    </html>
  `);
  const doc = dom.window.document;
  const toc = doc.querySelector('.toc-nav');

  initTocScrollSpy({ document: doc });

  const indices = toc.querySelectorAll('.toc-index');
  assert.strictEqual(indices[0].textContent, '1');
  assert.strictEqual(indices[1].textContent, '2');
  assert.strictEqual(indices[2].textContent, '3');
});

test('TOC Auto-numbering: should preserve original link text after the index', () => {
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <body>
        <div class="toc-nav">
          <ol>
            <li class="toc-nav-level-2">
              <a class="toc-nav-link" href="#section-1">Introduction</a>
            </li>
          </ol>
        </div>
        <div id="section-1">Section 1</div>
      </body>
    </html>
  `);
  const doc = dom.window.document;
  const toc = doc.querySelector('.toc-nav');

  initTocScrollSpy({ document: doc });

  const link = toc.querySelector('a.toc-nav-link');
  assert.ok(link.textContent.includes('Introduction'));
  assert.strictEqual(link.querySelector('.toc-index').textContent, '1');
});

test('TOC Auto-numbering: should number nested TOC correctly', () => {
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <body>
        <div class="toc-nav">
          <ol>
            <li class="toc-nav-level-2">
              <a class="toc-nav-link" href="#section-1">Introduction</a>
            </li>
            <li class="toc-nav-level-2">
              <a class="toc-nav-link" href="#section-2">Getting Started</a>
              <ol>
                <li class="toc-nav-level-3">
                  <a class="toc-nav-link" href="#section-2-1">Installation</a>
                </li>
                <li class="toc-nav-level-3">
                  <a class="toc-nav-link" href="#section-2-2">Configuration</a>
                </li>
              </ol>
            </li>
            <li class="toc-nav-level-2">
              <a class="toc-nav-link" href="#section-3">Advanced Topics</a>
              <ol>
                <li class="toc-nav-level-3">
                  <a class="toc-nav-link" href="#section-3-1">Plugins</a>
                  <ol>
                    <li class="toc-nav-level-4">
                      <a class="toc-nav-link" href="#section-3-1-1">Plugin A</a>
                    </li>
                    <li class="toc-nav-level-4">
                      <a class="toc-nav-link" href="#section-3-1-2">Plugin B</a>
                    </li>
                  </ol>
                </li>
                <li class="toc-nav-level-3">
                  <a class="toc-nav-link" href="#section-3-2">Theming</a>
                </li>
              </ol>
            </li>
          </ol>
        </div>
        <div id="section-1">Section 1</div>
        <div id="section-2">Section 2</div>
        <div id="section-2-1">Section 2.1</div>
        <div id="section-2-2">Section 2.2</div>
        <div id="section-3">Section 3</div>
        <div id="section-3-1">Section 3.1</div>
        <div id="section-3-1-1">Section 3.1.1</div>
        <div id="section-3-1-2">Section 3.1.2</div>
        <div id="section-3-2">Section 3.2</div>
      </body>
    </html>
  `);
  const doc = dom.window.document;
  const toc = doc.querySelector('.toc-nav');

  initTocScrollSpy({ document: doc });

  const indices = toc.querySelectorAll('.toc-index');
  assert.strictEqual(indices[0].textContent, '1');
  assert.strictEqual(indices[1].textContent, '2');
  assert.strictEqual(indices[2].textContent, '2.1');
  assert.strictEqual(indices[3].textContent, '2.2');
  assert.strictEqual(indices[4].textContent, '3');
  assert.strictEqual(indices[5].textContent, '3.1');
  assert.strictEqual(indices[6].textContent, '3.1.1');
  assert.strictEqual(indices[7].textContent, '3.1.2');
  assert.strictEqual(indices[8].textContent, '3.2');
});

test('TOC Auto-numbering: should not add duplicate indices on multiple initializations', () => {
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <body>
        <div class="toc-nav">
          <ol>
            <li class="toc-nav-level-2">
              <a class="toc-nav-link" href="#section-1">Introduction</a>
            </li>
          </ol>
        </div>
        <div id="section-1">Section 1</div>
      </body>
    </html>
  `);
  const doc = dom.window.document;
  const toc = doc.querySelector('.toc-nav');

  initTocScrollSpy({ document: doc });
  initTocScrollSpy({ document: doc });
  initTocScrollSpy({ document: doc });

  const link = toc.querySelector('a.toc-nav-link');
  const indices = link.querySelectorAll('.toc-index');
  assert.strictEqual(indices.length, 1);
  assert.strictEqual(indices[0].textContent, '1');
});

test('TOC Auto-numbering: should not renumber existing indices on subsequent initializations', () => {
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <body>
        <div class="toc-nav">
          <ol>
            <li class="toc-nav-level-2">
              <a class="toc-nav-link" href="#section-1">Introduction</a>
            </li>
          </ol>
        </div>
        <div id="section-1">Section 1</div>
      </body>
    </html>
  `);
  const doc = dom.window.document;
  const toc = doc.querySelector('.toc-nav');

  initTocScrollSpy({ document: doc });
  const firstIndices = toc.querySelectorAll('.toc-index');
  const firstText = firstIndices[0].textContent;

  initTocScrollSpy({ document: doc });
  const secondIndices = toc.querySelectorAll('.toc-index');
  const secondText = secondIndices[0].textContent;

  assert.strictEqual(firstText, secondText);
});

test('TOC Auto-numbering: should not change href attributes', () => {
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <body>
        <div class="toc-nav">
          <ol>
            <li class="toc-nav-level-2">
              <a class="toc-nav-link" href="#section-1">Introduction</a>
            </li>
            <li class="toc-nav-level-2">
              <a class="toc-nav-link" href="#section-2">Getting Started</a>
            </li>
            <li class="toc-nav-level-2">
              <a class="toc-nav-link" href="#section-3">Advanced Topics</a>
            </li>
          </ol>
        </div>
        <div id="section-1">Section 1</div>
        <div id="section-2">Section 2</div>
        <div id="section-3">Section 3</div>
      </body>
    </html>
  `);
  const doc = dom.window.document;
  const toc = doc.querySelector('.toc-nav');

  initTocScrollSpy({ document: doc });

  const links = toc.querySelectorAll('a.toc-nav-link');
  assert.strictEqual(links[0].getAttribute('href'), '#section-1');
  assert.strictEqual(links[1].getAttribute('href'), '#section-2');
  assert.strictEqual(links[2].getAttribute('href'), '#section-3');
});

test('TOC Auto-numbering: should handle empty TOC gracefully', () => {
  const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
  const doc = dom.window.document;
  const emptyToc = doc.createElement('div');
  emptyToc.className = 'toc-nav';

  assert.doesNotThrow(() => {
    initTocScrollSpy({ document: doc, toc: emptyToc });
  });
});

test('TOC Auto-numbering: should handle TOC without existing indices', () => {
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <body>
        <div class="toc-nav">
          <ol>
            <li class="toc-nav-level-2">
              <a class="toc-nav-link" href="#section-1">Introduction</a>
            </li>
          </ol>
        </div>
        <div id="section-1">Section 1</div>
      </body>
    </html>
  `);
  const doc = dom.window.document;
  const toc = doc.querySelector('.toc-nav');
  const link = toc.querySelector('a.toc-nav-link');
  const existingIndex = link.querySelector('.toc-index');
  assert.strictEqual(existingIndex, null);

  initTocScrollSpy({ document: doc });

  const newIndex = link.querySelector('.toc-index');
  assert.ok(newIndex);
  assert.strictEqual(newIndex.textContent, '1');
});
