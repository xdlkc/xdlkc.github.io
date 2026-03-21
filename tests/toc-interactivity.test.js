const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

let dom;
let window;
let document;
let tocInteractivity;
let scrollIntoViewMock;

test.beforeEach(() => {
  dom = new JSDOM(`<!DOCTYPE html><html><body>
    <div class="post-toc">
      <ul>
        <li><a href="#heading-1">Heading 1</a></li>
        <li><a href="#heading-2">Heading 2</a></li>
        <li><a href="#heading-3">Heading 3</a></li>
      </ul>
    </div>
    <div class="article-content">
      <h2 id="heading-1">Heading 1</h2>
      <p>Content for heading 1</p>
      <h3 id="heading-2">Heading 2</h3>
      <p>Content for heading 2</p>
      <h4 id="heading-3">Heading 3</h4>
      <p>Content for heading 3</p>
    </div>
  </body></html>`, { url: "http://localhost" });
  window = dom.window;
  document = window.document;
  global.window = window;
  global.document = document;
  global.HTMLElement = window.HTMLElement;
  global.Node = window.Node;

  // Mock scrollIntoView inside beforeEach, after global.HTMLElement is set
  scrollIntoViewMock = test.mock.fn();
  window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

  // Clear mock history before each test
  scrollIntoViewMock.mock.resetCalls();
  
  // Re-require the module inside beforeEach to ensure it uses the correct DOM context
  // This works for node:test as it doesn't have a module cache invalidation similar to Jest
  tocInteractivity = require('../source/js/toc-interactivity');
});

test.afterEach(() => {
  dom.window.close();
  delete global.window;
  delete global.document;
  delete global.HTMLElement;
  delete global.Node;
});


test('Clicking a TOC link should smooth scroll to the target heading', () => {
  tocInteractivity.initTocInteractivity(); // Initialize the interactivity

  const tocLink = document.querySelector('.post-toc a[href="#heading-2"]');
  const targetHeading = document.getElementById('heading-2');

  assert.ok(tocLink, 'TOC link for heading-2 should exist');
  assert.ok(targetHeading, 'Target heading-2 should exist');

  // Simulate click
  tocLink.click();

  // Assert that scrollIntoView was called on the target heading with smooth behavior
  assert.equal(scrollIntoViewMock.mock.callCount(), 1, 'scrollIntoView should be called once');
  assert.deepEqual(scrollIntoViewMock.mock.calls[0].arguments, [{ behavior: 'smooth' }], 'scrollIntoView should be called with smooth behavior');
  // The 'target' property is not directly available on the mock call object in node:test, 
  // so we need to get it from the 'this' context if scrollIntoView is called as a method
  assert.equal(scrollIntoViewMock.mock.calls[0].this, targetHeading, 'scrollIntoView should be called on the target heading');
});
