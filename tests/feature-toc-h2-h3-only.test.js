const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const path = require('node:path');

// Set up JSDOM before requiring the modules
const dom = new JSDOM(`<!DOCTYPE html><html><body>
  <div class="article-content">
    <h2 id="h2-one">Heading 2.1</h2>
    <h3 id="h3-one">Heading 3.1</h3>
    <h4 id="h4-one">Heading 4.1 - Should NOT be in TOC</h4>
    <h2 id="h2-two">Heading 2.2</h2>
    <h3 id="h3-two">Heading 3.2</h3>
  </div>
  <div class="toc-nav"></div>
  <nav class="article-nav"></nav>
</body></html>`, { url: "http://localhost" });

// Expose JSDOM globals to the Node.js global scope
global.window = dom.window;
global.document = dom.window.document;
global.localStorage = dom.window.localStorage;
global.history = dom.window.history;

// Now require the modules. They will pick up the global window/document.
const HeadingAutoId = require('../themes/evan/source/js/heading-auto-id.js');
const TocScrollSpy = require('../themes/evan/source/js/toc-scrollspy.js');

test('TOC should only track H2 and H3 headings, not H4', (t) => {
  // Initialize the TOC scroll spy, relying on global window/document
  HeadingAutoId.initHeadingAutoId();
  TocScrollSpy.initTocScrollSpy();

  const headingMeta = window.__xdlkcTocScrollSpy.headingMeta;

  const trackedIds = headingMeta.map(h => h.id);

  assert.ok(trackedIds.includes('h2-one'), 'H2.1 should be tracked');
  assert.ok(trackedIds.includes('h3-one'), 'H3.1 should be tracked');
  assert.ok(!trackedIds.includes('h4-one'), 'H4.1 should NOT be tracked'); // This is the failing assertion
  assert.ok(trackedIds.includes('h2-two'), 'H2.2 should be tracked');
  assert.ok(trackedIds.includes('h3-two'), 'H3.2 should be tracked');

  // Verify the number of tracked headings
  assert.equal(trackedIds.length, 4, 'Only 4 headings (H2, H3) should be tracked');
});