const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const CodeCopy = require('../themes/evan/source/js/code-copy.js');

function makeDom(html, { langMode = 'zh' } = {}) {
  const dom = new JSDOM(`<!doctype html><html data-lang-mode="${langMode}"><body>${html}</body></html>`, {
    url: 'https://example.com/post/',
    pretendToBeVisual: true
  });
  const { window } = dom;


  // Make timers deterministic enough.
  window.scrollTo = () => {};
  return dom;
}

beforeEach(() => {
  // noop
});

test('CodeCopy: Ctrl/Cmd+Shift+C copies focused <pre> code block and shows line-count toast', async () => {
  const dom = makeDom(`
    <div class="article-content">
      <pre id="p"><code>line1\nline2</code></pre>
    </div>
  `);
  const { window } = dom;
  global.window = window;
  global.document = window.document;
  global.navigator = window.navigator;

  navigator.clipboard = {
    writeText: async (text) => {
      window.__copied = text;
    }
  };

  CodeCopy.initCodeCopy({ root: window.document });

  const pre = window.document.getElementById('p');
  assert.equal(pre.getAttribute('tabindex'), '0', 'pre should be tabbable');
  assert.equal(pre.getAttribute('data-code-copy-shortcut'), '1', 'shortcut binding marker should be set');

  pre.focus();
  pre.dispatchEvent(new window.KeyboardEvent('keydown', {
    key: 'c',
    code: 'KeyC',
    ctrlKey: true,
    shiftKey: true,
    bubbles: true,
    cancelable: true
  }));

  // Allow async clipboard.
  await new Promise(r => window.setTimeout(r, 0));

  const toast = window.document.querySelector('.code-copy-toast');
  assert.ok(toast, 'toast exists');

  // If clipboard copy worked, __copied should be set.
  assert.equal(window.__copied, 'line1\nline2');
  assert.match(toast.textContent, /已复制\s*2\s*行/);
});

test('CodeCopy: Ctrl/Cmd+Shift+C works with metaKey (macOS)', async () => {
  const dom = makeDom(`
    <div class="article-content">
      <pre id="p"><code>only</code></pre>
    </div>
  `);
  const { window } = dom;
  global.window = window;
  global.document = window.document;
  global.navigator = window.navigator;

  navigator.clipboard = {
    writeText: async (text) => {
      window.__copied = text;
    }
  };

  CodeCopy.initCodeCopy({ root: window.document });

  const pre = window.document.getElementById('p');
  pre.focus();
  pre.dispatchEvent(new window.KeyboardEvent('keydown', {
    key: 'c',
    code: 'KeyC',
    metaKey: true,
    shiftKey: true,
    bubbles: true,
    cancelable: true
  }));

  await new Promise(r => window.setTimeout(r, 0));

  assert.equal(window.__copied, 'only');
});
