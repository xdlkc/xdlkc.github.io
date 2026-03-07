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

test('double click on <pre> copies code and shows toast', async () => {
  setupDom(`
    <!doctype html>
    <html><body>
      <div class="article-content">
        <pre><code>const x = 1;\n</code></pre>
      </div>
    </body></html>
  `);

  let copied = null;
  navigator.clipboard = {
    writeText: async (text) => {
      copied = text;
    }
  };

  // Ensure no selection.
  window.getSelection = () => ({ toString: () => '' });

  CodeCopy.initCodeCopy({ root: document });

  const pre = document.querySelector('.article-content pre');
  assert.ok(pre);

  pre.dispatchEvent(new window.MouseEvent('dblclick', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 0));

  assert.equal(copied, 'const x = 1;');

  const toast = document.querySelector('.code-copy-toast');
  assert.ok(toast);
  assert.equal(toast.textContent, '复制成功');
});

test('double click does not copy when user is selecting text', async () => {
  setupDom(`
    <!doctype html>
    <html><body>
      <div class="article-content">
        <pre><code>const y = 2;\n</code></pre>
      </div>
    </body></html>
  `);

  let calls = 0;
  navigator.clipboard = {
    writeText: async () => {
      calls += 1;
    }
  };

  window.getSelection = () => ({ toString: () => 'const y' });

  CodeCopy.initCodeCopy({ root: document });
  const pre = document.querySelector('.article-content pre');
  pre.dispatchEvent(new window.MouseEvent('dblclick', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 0));

  assert.equal(calls, 0);
});

test('initCodeCopy is idempotent for dblclick bindings', async () => {
  setupDom(`
    <!doctype html>
    <html><body>
      <div class="article-content">
        <pre><code>console.log('z');\n</code></pre>
      </div>
    </body></html>
  `);

  let calls = 0;
  navigator.clipboard = {
    writeText: async () => {
      calls += 1;
    }
  };

  window.getSelection = () => ({ toString: () => '' });

  CodeCopy.initCodeCopy({ root: document });
  CodeCopy.initCodeCopy({ root: document });

  const pre = document.querySelector('.article-content pre');
  pre.dispatchEvent(new window.MouseEvent('dblclick', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 0));

  assert.equal(calls, 1);
});
