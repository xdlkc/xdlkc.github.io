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

test('copy failure: auto-selects code content so user can Ctrl/Cmd+C', async () => {
  setupDom(`
    <!doctype html>
    <html><body>
      <div class="article-content">
        <pre><code>const x = 42;\nconsole.log(x);\n</code></pre>
      </div>
    </body></html>
  `);

  navigator.clipboard = {
    writeText: async () => {
      throw new Error('denied');
    }
  };

  // Ensure selection starts empty.
  assert.equal(window.getSelection().toString(), '');

  CodeCopy.initCodeCopy({ root: document });

  const button = document.querySelector('.code-copy-button');
  assert.ok(button);

  button.click();
  await new Promise((r) => setTimeout(r, 0));

  const toast = document.querySelector('.code-copy-toast');
  assert.ok(toast);
  assert.match(toast.textContent, /复制失败|Copy failed/);

  const selected = window.getSelection().toString();
  assert.match(selected, /const x = 42;/);
  assert.match(selected, /console\.log\(x\);/);
});
