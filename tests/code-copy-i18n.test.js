const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

test('CodeCopy: en mode injects English button label and English toast messages', async () => {
  const CodeCopy = require('../themes/evan/source/js/code-copy');

  const dom = new JSDOM(`<!doctype html><html data-lang-mode="en"><body>
    <article class="article-content">
      <pre><code>line1\nline2</code></pre>
    </article>
  </body></html>`, { url: 'https://example.com/' });

  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;

  let copied = null;
  global.navigator.clipboard = {
    writeText: async (text) => { copied = text; }
  };

  CodeCopy.initCodeCopy({ root: document });

  const button = document.querySelector('.code-copy-button');
  assert.ok(button, 'should inject copy button');
  assert.equal(button.textContent, 'Copy code');
  assert.equal(button.getAttribute('aria-label'), 'Copy code');

  button.click();
  await new Promise(resolve => dom.window.setTimeout(resolve, 0));

  assert.equal(copied, 'line1\nline2');

  const toast = document.querySelector('.code-copy-toast');
  assert.ok(toast);
  assert.ok(toast.classList.contains('is-visible'));
  assert.match(toast.textContent, /^Copied\s+2\s+lines$/);

  // button success feedback should be in English too
  assert.match(button.textContent, /^Copied\s*\(2\s+lines\)$/);

  delete global.window;
  delete global.document;
  delete global.navigator;
});

test('CodeCopy: reacts to xdlkc:lang-change and updates existing buttons', async () => {
  const CodeCopy = require('../themes/evan/source/js/code-copy');

  const dom = new JSDOM(`<!doctype html><html data-lang-mode="zh"><body>
    <article class="article-content">
      <pre><code>hello</code></pre>
    </article>
  </body></html>`, { url: 'https://example.com/' });

  global.window = dom.window;
  global.document = dom.window.document;

  CodeCopy.initCodeCopy({ root: document });

  const button = document.querySelector('.code-copy-button');
  assert.ok(button);
  assert.equal(button.textContent, '复制代码');

  document.documentElement.dataset.langMode = 'en';
  dom.window.dispatchEvent(new dom.window.Event('xdlkc:lang-change'));

  assert.equal(button.textContent, 'Copy code');
  assert.equal(button.getAttribute('aria-label'), 'Copy code');

  delete global.window;
  delete global.document;
});
