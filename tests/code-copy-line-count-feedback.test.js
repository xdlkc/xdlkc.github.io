const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

test('CodeCopy: successful button copy shows copied line count in button and toast', async () => {
  const CodeCopy = require('../themes/evan/source/js/code-copy.js');

  const dom = new JSDOM(`<!doctype html><html><body>
    <article class="article-content">
      <pre><code>const a = 1;\nconst b = 2;\nconsole.log(a + b);\n</code></pre>
    </article>
  </body></html>`, {
    url: 'https://example.com/',
    runScripts: 'outside-only',
    pretendToBeVisual: true
  });

  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;

  navigator.clipboard = {
    writeText: async () => {}
  };

  CodeCopy.initCodeCopy({ root: document });

  const pre = document.querySelector('pre');
  const btn = pre.querySelector('.code-copy-button');
  const toast = document.querySelector('.code-copy-toast');

  assert.ok(btn);
  assert.ok(toast);

  btn.click();
  await new Promise((r) => setTimeout(r, 20));

  assert.equal(btn.textContent, '已复制（3 行）');
  assert.equal(toast.textContent, '已复制 3 行');

  await new Promise((r) => setTimeout(r, 1300));
  assert.equal(btn.textContent, '复制代码');

  delete global.window;
  delete global.document;
  delete global.navigator;
});

test('CodeCopy: successful button copy shows singular line count for one line', async () => {
  const CodeCopy = require('../themes/evan/source/js/code-copy.js');

  const dom = new JSDOM(`<!doctype html><html><body>
    <article class="article-content">
      <pre><code>console.log('one line');</code></pre>
    </article>
  </body></html>`, {
    url: 'https://example.com/',
    runScripts: 'outside-only',
    pretendToBeVisual: true
  });

  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;

  navigator.clipboard = {
    writeText: async () => {}
  };

  CodeCopy.initCodeCopy({ root: document });

  const pre = document.querySelector('pre');
  const btn = pre.querySelector('.code-copy-button');
  const toast = document.querySelector('.code-copy-toast');

  btn.click();
  await new Promise((r) => setTimeout(r, 20));

  assert.equal(btn.textContent, '已复制（1 行）');
  assert.equal(toast.textContent, '已复制 1 行');

  delete global.window;
  delete global.document;
  delete global.navigator;
});
