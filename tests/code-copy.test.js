const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const CodeCopy = require('../themes/evan/source/js/code-copy.js');

function setupDom(html) {
  const dom = new JSDOM(html, { url: 'https://example.com/' });
  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
  return dom;
}

test('initCodeCopy injects buttons for <pre> and figure.highlight and is idempotent', () => {
  setupDom(`
    <!doctype html>
    <html><body>
      <div class="article-content">
        <pre><code>console.log('hi')\n</code></pre>
        <figure class="highlight">
          <table><tbody><tr><td class="code">
            <pre><span class="line">line1</span><span class="line">line2</span></pre>
          </td></tr></tbody></table>
        </figure>
      </div>
    </body></html>
  `);

  CodeCopy.initCodeCopy({ root: document });
  assert.equal(document.querySelectorAll('.code-copy-button').length, 2);
  assert.ok(document.querySelector('.code-copy-toast'));

  // Call again should not duplicate.
  CodeCopy.initCodeCopy({ root: document });
  assert.equal(document.querySelectorAll('.code-copy-button').length, 2);
});

test('clicking copy button uses navigator.clipboard.writeText and shows success UI', async () => {
  setupDom(`
    <!doctype html>
    <html><body>
      <div class="article-content">
        <pre><code>let a = 1;\nlet b = 2;\n</code></pre>
      </div>
    </body></html>
  `);

  let copied = null;
  navigator.clipboard = {
    writeText: async (text) => {
      copied = text;
    }
  };

  CodeCopy.initCodeCopy({ root: document });

  const button = document.querySelector('.code-copy-button');
  assert.ok(button);
  assert.equal(button.textContent, '复制代码');

  button.click();
  // Let the async handler finish.
  await new Promise((r) => setTimeout(r, 0));

  assert.equal(copied, "let a = 1;\nlet b = 2;");
  assert.equal(button.textContent, '已复制');

  const toast = document.querySelector('.code-copy-toast');
  assert.ok(toast);
  assert.equal(toast.textContent, '复制成功');
  assert.ok(toast.classList.contains('is-visible'));
});
