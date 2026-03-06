const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const {
  extractFromPre,
  extractFromHighlightFigure,
  findCodeBlocks
} = require('../themes/evan/source/js/code-copy');

test('extractFromPre: prefers <code> text and excludes injected button label', () => {
  const dom = new JSDOM(`<!doctype html><body>
    <div class="article-content">
      <pre><code>console.log("hi")\n</code><button class="code-copy-button">复制代码</button></pre>
    </div>
  </body>`);

  const pre = dom.window.document.querySelector('pre');
  const result = extractFromPre(pre);
  assert.equal(result, 'console.log("hi")');
});

test('extractFromHighlightFigure: joins .line text and trims final newline', () => {
  const dom = new JSDOM(`<!doctype html><body>
    <figure class="highlight plaintext">
      <table><tr><td class="code"><pre>
        <span class="line">line1</span>
        <span class="line">line2</span>
        <span class="line"></span>
      </pre></td></tr></table>
    </figure>
  </body>`);

  const figure = dom.window.document.querySelector('figure');
  const result = extractFromHighlightFigure(figure);
  assert.equal(result, 'line1\nline2');
});

test('findCodeBlocks: returns both pre and highlight blocks inside .article-content', () => {
  const dom = new JSDOM(`<!doctype html><body>
    <div class="article-content">
      <pre><code>code</code></pre>
      <figure class="highlight plaintext"><span class="line">a</span></figure>
    </div>
  </body>`);

  const blocks = findCodeBlocks({ root: dom.window.document });
  assert.equal(blocks.length, 2);
  assert.deepEqual(blocks.map((b) => b.type).sort(), ['highlight', 'pre']);
});
