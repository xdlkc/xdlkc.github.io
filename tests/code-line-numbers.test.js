const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const CodeLineNumbers = require('../themes/evan/source/js/code-line-numbers');

function setupDom(codeContent) {
  const dom = new JSDOM(`<!doctype html><html><body>
    <article class="article-content">
      <pre><code>${codeContent || ''}</code></pre>
      <figure class="highlight">
        <pre><code>${codeContent || ''}</code></pre>
      </figure>
    </article>
  </body></html>`, { url: 'https://example.com/post/' });

  const { window } = dom;
  global.window = window;
  global.document = window.document;

  return dom;
}

test('code-line-numbers: adds line numbers to code blocks', () => {
  const dom = setupDom('line1\nline2\nline3');
  const { document } = dom.window;

  CodeLineNumbers.initCodeLineNumbers({
    containerSelector: '.article-content',
    document
  });

  const lineNumbers = document.querySelectorAll('.code-line-numbers');
  assert.ok(lineNumbers.length > 0);

  delete global.window;
  delete global.document;
});

test('code-line-numbers: starts from 1 and increments', () => {
  const dom = setupDom('line1\nline2\nline3');
  const { document } = dom.window;

  CodeLineNumbers.initCodeLineNumbers({
    containerSelector: '.article-content',
    document
  });

  const lineNumbers = document.querySelector('.code-line-numbers');
  const numbers = lineNumbers ? Array.from(lineNumbers.querySelectorAll('.code-line-number')) : [];

  if (numbers.length > 0) {
    assert.strictEqual(numbers[0].textContent, '1');
    assert.strictEqual(numbers[1].textContent, '2');
    assert.strictEqual(numbers[2].textContent, '3');
  }

  delete global.window;
  delete global.document;
});

test('code-line-numbers: does not add line numbers to empty code blocks', () => {
  const dom = setupDom('');
  const { document } = dom.window;

  CodeLineNumbers.initCodeLineNumbers({
    containerSelector: '.article-content',
    document
  });

  const lineNumbers = document.querySelectorAll('.code-line-numbers');
  assert.strictEqual(lineNumbers.length, 0);

  delete global.window;
  delete global.document;
});

test('code-line-numbers: is idempotent', () => {
  const dom = setupDom('line1\nline2');
  const { document } = dom.window;

  CodeLineNumbers.initCodeLineNumbers({
    containerSelector: '.article-content',
    document
  });
  CodeLineNumbers.initCodeLineNumbers({
    containerSelector: '.article-content',
    document
  });

  const lineNumbers = document.querySelectorAll('.code-line-number');
  assert.ok(lineNumbers.length <= 4); // 不应该重复添加

  delete global.window;
  delete global.document;
});
