const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

// 导入要测试的模块
const CodeLineNumbers = require('../themes/evan/source/js/code-line-numbers');

function setupDomWithCode(codeContent = 'line1\nline2\nline3') {
  const dom = new JSDOM(`<!doctype html><html><body>
    <article class="article-content">
      <pre><code>${codeContent}</code></pre>
      <figure class="highlight">
        <pre><code>${codeContent}</code></pre>
      </figure>
    </article>
  </body></html>`, { url: 'https://example.com/post/' });
  const { window } = dom;
  global.window = window;
  global.document = window.document;
  global.localStorage = window.localStorage; // 模拟 localStorage
  return dom;
}

function cleanupDom() {
  delete global.window;
  delete global.document;
  delete global.localStorage;
}

test('CodeLineNumbers: STORAGE_KEY_LINE_NUMBERS is defined and accessible', () => {
  const dom = setupDomWithCode();
  assert.equal(
    CodeLineNumbers.STORAGE_KEY_LINE_NUMBERS,
    'xdlkc:code-line-numbers-enabled'
  );
  cleanupDom();
});

test('CodeLineNumbers: initCodeLineNumbers exists and is a function', () => {
  const dom = setupDomWithCode();
  assert.ok(typeof CodeLineNumbers.initCodeLineNumbers === 'function');
  cleanupDom();
});

test('CodeLineNumbers: refreshCodeLineNumbers exists and is a function', () => {
  const dom = setupDomWithCode();
  assert.ok(typeof CodeLineNumbers.refreshCodeLineNumbers === 'function');
  cleanupDom();
});

test('CodeLineNumbers: line numbers are added by default', () => {
  const dom = setupDomWithCode('line1\nline2\nline3');
  const { document } = dom.window;
  CodeLineNumbers.initCodeLineNumbers({ document });
  const lineNumbersDiv = document.querySelector('.code-line-numbers');
  assert.ok(lineNumbersDiv);
  assert.strictEqual(lineNumbersDiv.children.length, 3);
  cleanupDom();
});

test('CodeLineNumbers: line numbers are not added when localStorage is set to false', () => {
  const dom = setupDomWithCode('line1\nline2\nline3');
  const { document, localStorage } = dom.window;
  localStorage.setItem(CodeLineNumbers.STORAGE_KEY_LINE_NUMBERS, 'false');
  CodeLineNumbers.initCodeLineNumbers({ document });
  const lineNumbersDiv = document.querySelector('.code-line-numbers');
  assert.strictEqual(lineNumbersDiv, null);
  cleanupDom();
});

test('CodeLineNumbers: line numbers are added when localStorage is set to true', () => {
  const dom = setupDomWithCode('line1\nline2\nline3');
  const { document, localStorage } = dom.window;
  localStorage.setItem(CodeLineNumbers.STORAGE_KEY_LINE_NUMBERS, 'true');
  CodeLineNumbers.initCodeLineNumbers({ document });
  const lineNumbersDiv = document.querySelector('.code-line-numbers');
  assert.ok(lineNumbersDiv);
  assert.strictEqual(lineNumbersDiv.children.length, 3);
  cleanupDom();
});

test('CodeLineNumbers: line numbers are not added for single line code blocks', () => {
  const dom = setupDomWithCode('single line');
  const { document } = dom.window;
  CodeLineNumbers.initCodeLineNumbers({ document });
  const lineNumbersDiv = document.querySelector('.code-line-numbers');
  assert.strictEqual(lineNumbersDiv, null);
  cleanupDom();
});

test('CodeLineNumbers: line numbers are correctly refreshed based on localStorage', () => {
  const dom = setupDomWithCode('line1\nline2');
  const { document, localStorage } = dom.window;

  // Initially enabled, add line numbers
  localStorage.setItem(CodeLineNumbers.STORAGE_KEY_LINE_NUMBERS, 'true');
  CodeLineNumbers.refreshCodeLineNumbers({ document }); // Use refresh
  assert.ok(document.querySelector('.code-line-numbers'));

  // Disable line numbers
  localStorage.setItem(CodeLineNumbers.STORAGE_KEY_LINE_NUMBERS, 'false');
  CodeLineNumbers.refreshCodeLineNumbers({ document }); // Use refresh
  assert.strictEqual(document.querySelector('.code-line-numbers'), null);

  // Enable again
  localStorage.setItem(CodeLineNumbers.STORAGE_KEY_LINE_NUMBERS, 'true');
  CodeLineNumbers.refreshCodeLineNumbers({ document }); // Use refresh
  assert.ok(document.querySelector('.code-line-numbers'));
  cleanupDom();
});
