const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const {
  STORAGE_KEY,
  initCodeCollapse,
  toggleCodeBlock,
  shouldShowCollapseButton,
} = require('../themes/evan/source/js/code-collapse.js');

function setupDom(html) {
  const dom = new JSDOM(html, { url: 'https://example.com/' });
  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
  return dom;
}

test('STORAGE_KEY: remains stable', () => {
  assert.equal(STORAGE_KEY, 'xdlkc:code-collapse');
});

test('shouldShowCollapseButton returns false for code blocks with fewer than 10 lines', () => {
  setupDom(`
    <!doctype html>
    <html><body>
      <figure class="highlight">
        <table><tbody><tr><td class="code">
          <pre><span class="line">line1</span>
<span class="line">line2</span>
<span class="line">line3</span>
<span class="line">line4</span>
<span class="line">line5</span></pre>
        </td></tr></tbody></table>
      </figure>
    </body></html>
  `);

  const codeBlock = document.querySelector('.highlight');
  assert.equal(shouldShowCollapseButton(codeBlock), false);
});

test('shouldShowCollapseButton returns true for code blocks with 10 or more lines', () => {
  setupDom(`
    <!doctype html>
    <html><body>
      <figure class="highlight">
        <table><tbody><tr><td class="code">
          <pre><span class="line">line1</span>
<span class="line">line2</span>
<span class="line">line3</span>
<span class="line">line4</span>
<span class="line">line5</span>
<span class="line">line6</span>
<span class="line">line7</span>
<span class="line">line8</span>
<span class="line">line9</span>
<span class="line">line10</span></pre>
        </td></tr></tbody></table>
      </figure>
    </body></html>
  `);

  const codeBlock = document.querySelector('.highlight');
  assert.equal(shouldShowCollapseButton(codeBlock), true);
});

test('initCodeCollapse injects collapse button for code blocks with 10+ lines', () => {
  setupDom(`
    <!doctype html>
    <html><body>
      <figure class="highlight">
        <table><tbody><tr><td class="code">
          <pre>${Array.from({ length: 10 }, (_, i) => `<span class="line">line${i + 1}</span>`).join('\n')}</pre>
        </td></tr></tbody></table>
      </figure>
    </body></html>
  `);

  initCodeCollapse();

  const button = document.querySelector('.code-collapse-button');
  assert.ok(button);
  assert.equal(button.getAttribute('aria-label'), '折叠代码');
});

test('initCodeCollapse does not inject collapse button for short code blocks', () => {
  setupDom(`
    <!doctype html>
    <html><body>
      <figure class="highlight">
        <table><tbody><tr><td class="code">
          <pre><span class="line">line1</span><span class="line">line2</span></pre>
        </td></tr></tbody></table>
      </figure>
    </body></html>
  `);

  initCodeCollapse();

  const button = document.querySelector('.code-collapse-button');
  assert.equal(button, null);
});

test('toggleCodeBlock toggles collapsed class and button text', () => {
  setupDom(`
    <!doctype html>
    <html><body>
      <figure class="highlight">
        <table><tbody><tr><td class="code">
          <pre>${Array.from({ length: 10 }, (_, i) => `<span class="line">line${i + 1}</span>`).join('\n')}</pre>
        </td></tr></tbody></table>
      </figure>
    </body></html>
  `);

  initCodeCollapse();

  const codeBlock = document.querySelector('.highlight');
  const button = document.querySelector('.code-collapse-button');

  // Initial state: not collapsed
  assert.equal(codeBlock.classList.contains('is-collapsed'), false);
  assert.equal(button.getAttribute('aria-label'), '折叠代码');

  // Toggle to collapsed
  toggleCodeBlock(codeBlock);
  assert.equal(codeBlock.classList.contains('is-collapsed'), true);
  assert.equal(button.getAttribute('aria-label'), '展开代码');

  // Toggle back to expanded
  toggleCodeBlock(codeBlock);
  assert.equal(codeBlock.classList.contains('is-collapsed'), false);
  assert.equal(button.getAttribute('aria-label'), '折叠代码');
});

test('initCodeCollapse restores collapse state from localStorage', () => {
  setupDom(`
    <!doctype html>
    <html><body>
      <figure class="highlight">
        <table><tbody><tr><td class="code">
          <pre>${Array.from({ length: 10 }, (_, i) => `<span class="line">line${i + 1}</span>`).join('\n')}</pre>
        </td></tr></tbody></table>
      </figure>
    </body></html>
  `);

  const storage = {
    _data: new Map(),
    getItem(key) {
      return this._data.get(key) || null;
    },
    setItem(key, value) {
      this._data.set(key, String(value));
    },
  };

  // Simulate saved state
  storage.setItem(STORAGE_KEY, JSON.stringify({ collapsed: true }));

  initCodeCollapse({ storage });

  const codeBlock = document.querySelector('.highlight');
  assert.equal(codeBlock.classList.contains('is-collapsed'), true);
});

test('initCodeCollapse persists collapse state to localStorage', () => {
  setupDom(`
    <!doctype html>
    <html><body>
      <figure class="highlight">
        <table><tbody><tr><td class="code">
          <pre>${Array.from({ length: 10 }, (_, i) => `<span class="line">line${i + 1}</span>`).join('\n')}</pre>
        </td></tr></tbody></table>
      </figure>
    </body></html>
  `);

  const storage = {
    _data: new Map(),
    getItem(key) {
      return this._data.get(key) || null;
    },
    setItem(key, value) {
      this._data.set(key, String(value));
    },
  };

  initCodeCollapse({ storage });

  const button = document.querySelector('.code-collapse-button');
  button.click();

  const savedState = JSON.parse(storage.getItem(STORAGE_KEY));
  assert.equal(savedState.collapsed, true);
});
