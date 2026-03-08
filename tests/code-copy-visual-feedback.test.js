const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

test('CodeCopy: successful copy adds transient is-copied class to the block', async () => {
  const CodeCopy = require('../themes/evan/source/js/code-copy.js');

  const dom = new JSDOM(`<!doctype html><html><body>
    <article class="article-content">
      <pre><code>console.log('hi')\n</code></pre>
    </article>
  </body></html>`, {
    url: 'https://example.com/',
    runScripts: 'outside-only',
    pretendToBeVisual: true
  });

  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;

  // Mock clipboard.
  navigator.clipboard = {
    writeText: async () => {}
  };

  CodeCopy.initCodeCopy({ root: document });

  const pre = document.querySelector('pre');
  assert.ok(pre);

  const btn = pre.querySelector('.code-copy-button');
  assert.ok(btn);

  btn.click();
  // Wait for async clipboard promise chain.
  await new Promise((r) => setTimeout(r, 20));

  // Should have class immediately after successful copy.
  assert.equal(pre.classList.contains('is-copied'), true);

  // Should auto-remove.
  await new Promise((r) => setTimeout(r, 1400));
  assert.equal(pre.classList.contains('is-copied'), false);

  delete global.window;
  delete global.document;
  delete global.navigator;
});

test('CodeCopy: failed copy does not add is-copied class', async () => {
  const CodeCopy = require('../themes/evan/source/js/code-copy.js');

  const dom = new JSDOM(`<!doctype html><html><body>
    <article class="article-content">
      <pre><code>console.log('hi')\n</code></pre>
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
    writeText: async () => {
      throw new Error('no permission');
    }
  };

  CodeCopy.initCodeCopy({ root: document });

  const pre = document.querySelector('pre');
  const btn = pre.querySelector('.code-copy-button');

  btn.click();
  // Wait for async clipboard promise chain.
  await new Promise((r) => setTimeout(r, 20));

  assert.equal(pre.classList.contains('is-copied'), false);

  delete global.window;
  delete global.document;
  delete global.navigator;
});
