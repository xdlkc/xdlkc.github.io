const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const CodeCopy = require(path.join(__dirname, '..', 'themes', 'evan', 'source', 'js', 'code-copy.js'));

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

test('CodeCopy: long-press (touch) copies code and shows toast (pre block)', async () => {
  const dom = new JSDOM(
    `<!doctype html><html data-lang-mode="zh"><body>
      <div class="article-content">
        <pre><code>line1\nline2</code></pre>
      </div>
    </body></html>`,
    { url: 'https://example.com/post' }
  );

  const { window } = dom;
  global.window = window;
  global.document = window.document;
  global.navigator = window.navigator;

  let copied = null;
  window.navigator.clipboard = {
    writeText: async (text) => {
      copied = text;
    }
  };
  // Some Node environments keep a separate global navigator; ensure both point to the stub.
  global.navigator.clipboard = window.navigator.clipboard;

  CodeCopy.initCodeCopy({ root: window.document, longPressMs: 10 });

  const pre = window.document.querySelector('.article-content pre');
  assert.ok(pre);

  pre.dispatchEvent(new window.Event('touchstart', { bubbles: true }));
  await sleep(15);

  assert.equal(copied, 'line1\nline2');
  const toast = window.document.querySelector('.code-copy-toast');
  assert.ok(toast);
  assert.match(toast.textContent, /已复制\s*2\s*行/);
});

test('CodeCopy: touchmove cancels long-press copy', async () => {
  const dom = new JSDOM(
    `<!doctype html><html data-lang-mode="zh"><body>
      <div class="article-content">
        <pre><code>hello</code></pre>
      </div>
    </body></html>`,
    { url: 'https://example.com/post' }
  );

  const { window } = dom;
  global.window = window;
  global.document = window.document;
  global.navigator = window.navigator;

  let copied = null;
  window.navigator.clipboard = {
    writeText: async (text) => {
      copied = text;
    }
  };
  global.navigator.clipboard = window.navigator.clipboard;

  CodeCopy.initCodeCopy({ root: window.document, longPressMs: 10 });

  const pre = window.document.querySelector('.article-content pre');
  pre.dispatchEvent(new window.Event('touchstart', { bubbles: true }));
  pre.dispatchEvent(new window.Event('touchmove', { bubbles: true }));

  await sleep(15);
  assert.equal(copied, null);
});
