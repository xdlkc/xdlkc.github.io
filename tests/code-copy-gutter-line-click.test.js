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

test('clicking highlight gutter line copies the corresponding code line and shows toast', async () => {
  setupDom(`
    <!doctype html>
    <html><body>
      <div class="article-content">
        <figure class="highlight js"><table><tr>
          <td class="gutter"><pre>
            <span class="line">1</span>
            <span class="line">2</span>
            <span class="line">3</span>
          </pre></td>
          <td class="code"><pre>
            <span class="line">console.log('a');</span>
            <span class="line">console.log('b');</span>
            <span class="line">console.log('c');</span>
          </pre></td>
        </tr></table></figure>
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

  const line2 = document.querySelector('.highlight .gutter .line:nth-child(2)');
  assert.ok(line2);

  line2.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 0));

  assert.equal(copied, "console.log('b');");

  const toast = document.querySelector('.code-copy-toast');
  assert.ok(toast);
  assert.equal(toast.textContent, '已复制第 2 行');
});

test('initCodeCopy is idempotent for gutter click bindings', async () => {
  setupDom(`
    <!doctype html>
    <html><body>
      <div class="article-content">
        <figure class="highlight js"><table><tr>
          <td class="gutter"><pre>
            <span class="line">1</span>
            <span class="line">2</span>
          </pre></td>
          <td class="code"><pre>
            <span class="line">a</span>
            <span class="line">b</span>
          </pre></td>
        </tr></table></figure>
      </div>
    </body></html>
  `);

  let calls = 0;
  navigator.clipboard = {
    writeText: async () => {
      calls += 1;
    }
  };

  CodeCopy.initCodeCopy({ root: document });
  CodeCopy.initCodeCopy({ root: document });

  const line1 = document.querySelector('.highlight .gutter .line:nth-child(1)');
  line1.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 0));

  assert.equal(calls, 1);
});
