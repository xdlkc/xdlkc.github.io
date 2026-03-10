const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const CodeCopy = require('../themes/evan/source/js/code-copy.js');

test('CodeCopy: should not inject duplicate copy buttons for figure.highlight that contains pre', () => {
  const dom = new JSDOM(`<!doctype html>
  <html><body>
    <article class="article-content">
      <figure class="highlight">
        <table><tbody><tr>
          <td class="gutter"><pre><span class="line">1</span></pre></td>
          <td class="code"><pre><code><span class="line">console.log('hi')</span></code></pre></td>
        </tr></tbody></table>
      </figure>
    </article>
  </body></html>`, { url: 'https://example.com/' });

  const { window } = dom;
  global.window = window;
  global.document = window.document;
  global.navigator = window.navigator;

  CodeCopy.initCodeCopy({ root: window.document });

  const highlight = window.document.querySelector('figure.highlight');
  assert.ok(highlight);

  const buttons = highlight.querySelectorAll('.code-copy-button');
  assert.equal(buttons.length, 1);
});

test('CodeCopy: should still inject button for standalone pre blocks', () => {
  const dom = new JSDOM(`<!doctype html>
  <html><body>
    <article class="article-content">
      <pre><code>const a = 1;\n</code></pre>
    </article>
  </body></html>`, { url: 'https://example.com/' });

  const { window } = dom;
  global.window = window;
  global.document = window.document;
  global.navigator = window.navigator;

  CodeCopy.initCodeCopy({ root: window.document });

  const pre = window.document.querySelector('.article-content pre');
  const buttons = pre.querySelectorAll('.code-copy-button');
  assert.equal(buttons.length, 1);
});
