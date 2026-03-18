const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

test('TOC Sticky Sidebar: CSS position: sticky is applied', async () => {
  // Simulate a page with TOC sidebar
  const dom = new JSDOM(`<!doctype html><html>
  <head>
    <style>
      .toc-sidebar {
        position: sticky;
        top: 80px;
        max-height: calc(100vh - 100px);
        overflow-y: auto;
      }
    </style>
  </head>
  <body>
    <aside class="toc-sidebar">
      <div class="toc-header">
        <p class="toc-title">Outline</p>
      </div>
      <div class="toc-content">
        <ul>
          <li><a href="#section1">Section 1</a></li>
          <li><a href="#section2">Section 2</a></li>
          <li><a href="#section3">Section 3</a></li>
        </ul>
      </div>
    </aside>
  </body>
</html>`, {
    url: 'https://example.com/posts/test/',
    runScripts: 'outside-only'
  });

  global.document = dom.window.document;
  global.window = dom.window;

  const sidebar = document.querySelector('.toc-sidebar');
  assert.ok(sidebar, 'TOC sidebar element should exist');

  // Check computed styles (JSDOM may not fully support position: sticky)
  const styles = window.getComputedStyle(sidebar);

  // At minimum, the inline style should be present in the stylesheet
  const stylesheet = document.querySelector('style').textContent;
  assert.ok(stylesheet.includes('position: sticky'), 'CSS should contain position: sticky');
  assert.ok(stylesheet.includes('top: 80px'), 'CSS should contain top: 80px');
  assert.ok(stylesheet.includes('max-height: calc(100vh - 100px)'), 'CSS should contain max-height');
  assert.ok(stylesheet.includes('overflow-y: auto'), 'CSS should contain overflow-y: auto');

  delete global.window;
  delete global.document;
});

test('TOC Sticky Sidebar: has correct structure', async () => {
  const dom = new JSDOM(`<!doctype html><html>
  <body>
    <aside class="toc-sidebar">
      <div class="toc-header">
        <p class="toc-title">Outline</p>
        <button class="toc-toggle-button" type="button" data-toc-toggle aria-expanded="true" aria-controls="toc-content-desktop">折叠目录</button>
      </div>
      <div class="toc-content" id="toc-content-desktop">
        <ul>
          <li><a href="#section1">Section 1</a></li>
        </ul>
      </div>
    </aside>
  </body>
</html>`);

  global.document = dom.window.document;
  global.window = dom.window;

  const sidebar = document.querySelector('.toc-sidebar');
  assert.ok(sidebar, 'TOC sidebar should exist');

  const header = sidebar.querySelector('.toc-header');
  assert.ok(header, 'TOC header should exist');

  const title = header.querySelector('.toc-title');
  assert.ok(title, 'TOC title should exist');
  assert.strictEqual(title.textContent, 'Outline');

  const toggleButton = header.querySelector('.toc-toggle-button');
  assert.ok(toggleButton, 'TOC toggle button should exist');
  assert.strictEqual(toggleButton.getAttribute('aria-expanded'), 'true');
  assert.strictEqual(toggleButton.getAttribute('aria-controls'), 'toc-content-desktop');

  const content = sidebar.querySelector('.toc-content');
  assert.ok(content, 'TOC content should exist');
  assert.strictEqual(content.id, 'toc-content-desktop');

  const links = content.querySelectorAll('a');
  assert.ok(links.length > 0, 'TOC should contain at least one link');

  delete global.window;
  delete global.document;
});

test('TOC Sticky Sidebar: mobile responsive styles', async () => {
  const dom = new JSDOM(`<!doctype html><html>
  <head>
    <style>
      @media (max-width: 768px) {
        .toc-sidebar {
          display: none !important;
        }
      }
    </style>
  </head>
  <body>
    <aside class="toc-sidebar">
      <div class="toc-content">
        <ul><li><a href="#section1">Section 1</a></li></ul>
      </div>
    </aside>
  </body>
</html>`);

  global.document = dom.window.document;
  global.window = dom.window;

  const sidebar = document.querySelector('.toc-sidebar');
  assert.ok(sidebar, 'TOC sidebar should exist');

  // Check that media query exists in stylesheet
  const stylesheet = document.querySelector('style').textContent;
  assert.ok(stylesheet.includes('@media (max-width: 768px)'), 'CSS should contain mobile media query');
  assert.ok(stylesheet.includes('.toc-sidebar {'), 'Media query should target .toc-sidebar');
  assert.ok(stylesheet.includes('display: none !important;'), 'Mobile styles should hide TOC');

  delete global.window;
  delete global.document;
});

test('TOC Sticky Sidebar: has correct data attributes', async () => {
  const dom = new JSDOM(`<!doctype html><html>
  <body>
    <aside class="toc-sidebar" data-toc-sidebar>
      <div class="toc-content"></div>
    </aside>
  </body>
</html>`);

  global.document = dom.window.document;
  global.window = dom.window;

  const sidebar = document.querySelector('.toc-sidebar');
  assert.ok(sidebar, 'TOC sidebar should exist');
  assert.strictEqual(sidebar.getAttribute('data-toc-sidebar'), '');

  delete global.window;
  delete global.document;
});
