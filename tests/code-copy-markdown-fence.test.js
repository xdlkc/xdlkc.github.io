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

test('Alt+click copy button copies Markdown fenced code with detected language', async () => {
  setupDom(`
    <!doctype html>
    <html><body>
      <div class="article-content">
        <pre><code class="language-js">console.log('hi');\n</code></pre>
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

  button.dispatchEvent(new window.MouseEvent('click', { bubbles: true, altKey: true }));
  await new Promise((r) => setTimeout(r, 0));

  assert.equal(copied, "```js\nconsole.log('hi');\n```");

  const toast = document.querySelector('.code-copy-toast');
  assert.ok(toast);
  assert.equal(toast.textContent, '已复制 Markdown');
});
