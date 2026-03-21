const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const makeCodeBlockDoubleClickSelect = require('../themes/evan/source/js/code-block-double-click-select');

test('selectCodeContent: selects all text within code element', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <article class="article-content">
      <!-- Hexo-rendered code block -->
      <figure class="highlight language-javascript">
        <div class="gutter">
          <span class="line">1</span>
          <span class="line">2</span>
        </div>
        <pre>
          <code class="hljs">const x = 1;
const y = 2;</code>
        </pre>
        <button class="code-copy-button">Copy</button>
        <button class="code-collapse-button">Collapse</button>
      </figure>
    </article>
  </body></html>`, { url: 'https://example.com/post/' });
  const { window, document } = dom;
  global.window = window;
  global.document = document;
  const { selectCodeContent } = makeCodeBlockDoubleClickSelect({ document, window });
  const codeEl = document.querySelector('figure.highlight code.hljs');

  const selection = selectCodeContent(codeEl);

  assert.ok(selection, 'selection should be created');
  assert.equal(selection.toString().trim(), 'const x = 1;\nconst y = 2;');
});

test('selectCodeContent: ignores gutter elements', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <article class="article-content">
      <!-- Hexo-rendered code block -->
      <figure class="highlight language-javascript">
        <div class="gutter">
          <span class="line">1</span>
          <span class="line">2</span>
        </div>
        <pre>
          <code class="hljs">const x = 1;
const y = 2;</code>
        </pre>
        <button class="code-copy-button">Copy</button>
        <button class="code-collapse-button">Collapse</button>
      </figure>
    </article>
  </body></html>`, { url: 'https://example.com/post/' });
  const { window, document } = dom;
  global.window = window;
  global.document = document;
  const { selectCodeContent } = makeCodeBlockDoubleClickSelect({ document, window });
  const codeEl = document.querySelector('figure.highlight code.hljs');

  selectCodeContent(codeEl);

  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  assert.ok(!selectedText.includes('1'), 'should not include line number 1');
  assert.ok(!selectedText.includes('2'), 'should not include line number 2');
  assert.ok(selectedText.includes('const x = 1;'), 'should include code');
});

test('selectCodeContent: ignores button elements', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <article class="article-content">
      <!-- Hexo-rendered code block -->
      <figure class="highlight language-javascript">
        <div class="gutter">
          <span class="line">1</span>
          <span class="line">2</span>
        </div>
        <pre>
          <code class="hljs">const x = 1;
const y = 2;</code>
        </pre>
        <button class="code-copy-button">Copy</button>
        <button class="code-collapse-button">Collapse</button>
      </figure>
    </article>
  </body></html>`, { url: 'https://example.com/post/' });
  const { window, document } = dom;
  global.window = window;
  global.document = document;
  const { selectCodeContent } = makeCodeBlockDoubleClickSelect({ document, window });
  const codeEl = document.querySelector('figure.highlight code.hljs');

  selectCodeContent(codeEl);

  const selection = window.getSelection();
  const selectedText = selection.toString();

  assert.ok(!selectedText.includes('Copy'), 'should not include Copy button text');
  assert.ok(!selectedText.includes('Collapse'), 'should not include Collapse button text');
});

test('initCodeBlockDoubleClickSelect: adds dblclick listeners to all code blocks', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <article class="article-content">
      <!-- Hexo-rendered code block -->
      <figure class="highlight language-javascript">
        <div class="gutter">
          <span class="line">1</span>
          <span class="line">2</span>
        </div>
        <pre>
          <code class="hljs">const x = 1;
const y = 2;</code>
        </pre>
        <button class="code-copy-button">Copy</button>
        <button class="code-collapse-button">Collapse</button>
      </figure>

      <!-- Direct code block -->
      <pre><code class="language-python">def hello():
    print("world")</code></pre>
    </article>
  </body></html>`, { url: 'https://example.com/post/' });
  const { document, window } = dom;
  global.window = window;
  global.document = document;
  const { initCodeBlockDoubleClickSelect } = makeCodeBlockDoubleClickSelect({ document, window });

  initCodeBlockDoubleClickSelect();

  const codeBlocks = document.querySelectorAll('.article-content figure.highlight, .article-content pre');
  codeBlocks.forEach((block) => {
    assert.ok(block.dataset.codeBlockDblClickBound === '1', `${block.tagName} should have dblclick listener marker`);
  });
});

test('Double-clicking Hexo code block selects content', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <article class="article-content">
      <!-- Hexo-rendered code block -->
      <figure class="highlight language-javascript">
        <div class="gutter">
          <span class="line">1</span>
          <span class="line">2</span>
        </div>
        <pre>
          <code class="hljs">const x = 1;
const y = 2;</code>
        </pre>
      </figure>
    </article>
  </body></html>`, { url: 'https://example.com/post/' });
  const { document, window } = dom;
  global.window = window;
  global.document = document;
  const { initCodeBlockDoubleClickSelect } = makeCodeBlockDoubleClickSelect({ document, window });
  initCodeBlockDoubleClickSelect();

  const figure = document.querySelector('figure.highlight');
  figure.dispatchEvent(new document.defaultView.Event('dblclick', { bubbles: true }));

  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  assert.equal(selectedText, 'const x = 1;\nconst y = 2;');
});

test('Double-clicking direct code block selects content', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <article class="article-content">
      <!-- Direct code block -->
      <pre><code class="language-python">def hello():
    print("world")</code></pre>
    </article>
  </body></html>`, { url: 'https://example.com/post/' });
  const { document, window } = dom;
  global.window = window;
  global.document = document;
  const { initCodeBlockDoubleClickSelect } = makeCodeBlockDoubleClickSelect({ document, window });
  initCodeBlockDoubleClickSelect();

  const pre = document.querySelector('pre > code.language-python').parentElement;
  pre.dispatchEvent(new document.defaultView.Event('dblclick', { bubbles: true }));

  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  assert.equal(selectedText, 'def hello():\n    print("world")');
});

test('Double-clicking gutter does not select content', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <article class="article-content">
      <!-- Hexo-rendered code block -->
      <figure class="highlight language-javascript">
        <div class="gutter">
          <span class="line">1</span>
          <span class="line">2</span>
        </div>
        <pre>
          <code class="hljs">const x = 1;
const y = 2;</code>
        </pre>
      </figure>
    </article>
  </body></html>`, { url: 'https://example.com/post/' });
  const { document, window } = dom;
  global.window = window;
  global.document = document;
  const { initCodeBlockDoubleClickSelect } = makeCodeBlockDoubleClickSelect({ document, window });
  initCodeBlockDoubleClickSelect();

  const gutter = document.querySelector('.gutter');
  gutter.dispatchEvent(new document.defaultView.Event('dblclick', { bubbles: true }));

  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  assert.equal(selectedText, '', 'should not select anything when gutter is clicked');
});

test('Multiple code blocks work independently', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <article class="article-content">
      <!-- Hexo-rendered code block -->
      <figure class="highlight language-javascript">
        <div class="gutter"><span class="line">1</span></div>
        <pre><code class="hljs">const x = 1;</code></pre>
      </figure>
      <!-- Direct code block -->
      <pre><code class="language-python">def hello():
    print("world")</code></pre>
    </article>
  </body></html>`, { url: 'https://example.com/post/' });
  const { document, window } = dom;
  global.window = window;
  global.document = document;
  const { initCodeBlockDoubleClickSelect } = makeCodeBlockDoubleClickSelect({ document, window });
  initCodeBlockDoubleClickSelect();

  // Click first block
  const figure = document.querySelector('figure.highlight');
  figure.dispatchEvent(new document.defaultView.Event('dblclick', { bubbles: true }));

  let selection = window.getSelection();
  assert.equal(selection.toString().trim(), 'const x = 1;');

  // Click second block
  const pre = document.querySelector('pre > code.language-python').parentElement;
  pre.dispatchEvent(new document.defaultView.Event('dblclick', { bubbles: true }));

  selection = window.getSelection();
  assert.equal(selection.toString().trim(), 'def hello():\n    print("world")');
});

test('Empty code blocks handle gracefully', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <article class="article-content">
      <!-- Empty code block -->
      <pre><code class="language-json"></code></pre>
    </article>
  </body></html>`, { url: 'https://example.com/post/' });
  const { document, window } = dom;
  global.window = window;
  global.document = document;
  const { initCodeBlockDoubleClickSelect } = makeCodeBlockDoubleClickSelect({ document, window });
  initCodeBlockDoubleClickSelect();

  const emptyPre = document.querySelector('pre > code.language-json').parentElement;
  assert.doesNotThrow(() => {
    emptyPre.dispatchEvent(new document.defaultView.Event('dblclick', { bubbles: true }));
  });

  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  assert.equal(selectedText, '');
});

test('Whitespace-only code blocks handle gracefully', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <article class="article-content">
      <!-- Whitespace-only code block -->
      <pre><code class="language-markdown">  \n  </code></pre>
    </article>
  </body></html>`, { url: 'https://example.com/post/' });
  const { document, window } = dom;
  global.window = window;
  global.document = document;
  const { initCodeBlockDoubleClickSelect } = makeCodeBlockDoubleClickSelect({ document, window });
  initCodeBlockDoubleClickSelect();

  const wsPre = document.querySelector('pre > code.language-markdown').parentElement;
  assert.doesNotThrow(() => {
    wsPre.dispatchEvent(new document.defaultView.Event('dblclick', { bubbles: true }));
  });

  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  assert.equal(selectedText, '');
});