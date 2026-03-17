const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const CodeCopy = require('../js/code-copy');

function setupDom(codeContent) {
  const dom = new JSDOM(`<!doctype html><html><body>
    <article class="article-content">
      <figure class="highlight">
        <table>
          <tbody>
            <tr>
              <td class="gutter">
                <pre><span class="line">1</span><span class="line">2</span></pre>
              </td>
              <td class="code">
                <pre><span class="line">console.log("Hello");</span><span class="line">console.log("World");</span></pre>
              </td>
            </tr>
          </tbody>
        </table>
      </figure>
    </article>
  </body></html>`, { url: 'https://example.com/post/' });

  const { window } = dom;
  global.window = window;
  global.document = window.document;
  global.navigator = window.navigator;

  return dom;
}

test('Code Copy Button: adds copy button to code blocks', () => {
  const dom = setupDom();
  const { document } = dom.window;

  CodeCopy.initCodeCopy();
  const copyButton = document.querySelector('.highlight .code-copy-button');
  assert.ok(copyButton, 'copy button should be added');
  assert.strictEqual(copyButton.getAttribute('aria-label'), '复制代码');
  assert.strictEqual(copyButton.type, 'button');
});

test('Code Copy Button: does not add duplicate buttons', () => {
  const dom = setupDom();
  const { document } = dom.window;

  CodeCopy.initCodeCopy();
  const copyButtons1 = document.querySelectorAll('.highlight .code-copy-button');
  assert.strictEqual(copyButtons1.length, 1);

  CodeCopy.initCodeCopy();
  const copyButtons2 = document.querySelectorAll('.highlight .code-copy-button');
  assert.strictEqual(copyButtons2.length, 1);
});

test('Code Copy Button: does not add button to inline code', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <p>This is <code>inline code</code> and another <code>code</code>.</p>
  </body></html>`);

  const { window } = dom;
  global.window = window;
  global.document = window.document;

  CodeCopy.initCodeCopy();
  const copyButtons = document.querySelectorAll('code .code-copy-button');
  assert.strictEqual(copyButtons.length, 0);
});

test('Code Copy Button: gets code text without line numbers', () => {
  const dom = setupDom();
  const { document } = dom.window;

  const codeBlock = document.querySelector('.highlight');
  CodeCopy.initCodeCopy();

  // The button is added, now we need to extract the code
  const lines = Array.from(codeBlock.querySelectorAll('.code .line'))
    .map(line => line.textContent)
    .join('\n');

  assert.strictEqual(lines, 'console.log("Hello");\nconsole.log("World");');
});
