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

test('copy failure toast includes actionable Ctrl/Cmd+C hint (button click)', async () => {
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

  assert.equal(window.getSelection().toString(), '');

  CodeCopy.initCodeCopy({ root: document });

  const button = document.querySelector('.code-copy-button');
  assert.ok(button);

  button.click();
  await new Promise((r) => setTimeout(r, 0));

  const toast = document.querySelector('.code-copy-toast');
  assert.ok(toast);

  assert.match(toast.textContent, /(按\s*Ctrl\/Cmd\+C)|(Press\s*Ctrl\/Cmd\+C)/);

  const selected = window.getSelection().toString();
  assert.match(selected, /const x = 42;/);
});

test('double click copy failure selects code and shows hint', async () => {
  setupDom(`
    <!doctype html>
    <html><body>
      <div class="article-content">
        <pre><code>let a = 1;\nlet b = 2;\n</code></pre>
      </div>
    </body></html>
  `);

  navigator.clipboard = {
    writeText: async () => {
      throw new Error('denied');
    }
  };

  // Real selection in jsdom.
  assert.equal(window.getSelection().toString(), '');

  CodeCopy.initCodeCopy({ root: document });

  const pre = document.querySelector('.article-content pre');
  assert.ok(pre);

  pre.dispatchEvent(new window.MouseEvent('dblclick', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 0));

  const toast = document.querySelector('.code-copy-toast');
  assert.ok(toast);
  assert.match(toast.textContent, /(按\s*Ctrl\/Cmd\+C)|(Press\s*Ctrl\/Cmd\+C)/);

  const selected = window.getSelection().toString();
  assert.match(selected, /let a = 1;/);
  assert.match(selected, /let b = 2;/);
});
